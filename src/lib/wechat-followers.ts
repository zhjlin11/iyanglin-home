import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type WechatFollowerIdentity = {
  openId: string;
  unionId?: string | null;
  nickname?: string | null;
  avatar?: string | null;
  subscribed: boolean;
  subscribeTime?: Date | null;
  unsubscribedAt?: Date | null;
  firstSeenSource: "OAUTH" | "SUBSCRIBE_EVENT" | "SYNC" | "RE_SUBSCRIBE";
};

export type WechatSubscriptionStatus = {
  subscribed: boolean;
  subscribeTime: Date | null;
  unsubscribedAt: Date | null;
  firstSeenSource: string;
};

type QueryClient = {
  $executeRaw: typeof prisma.$executeRaw;
  $queryRaw: typeof prisma.$queryRaw;
};

export async function upsertWechatFollower(
  identity: WechatFollowerIdentity,
  userId?: string | null,
  client: QueryClient = prisma
): Promise<WechatSubscriptionStatus> {
  const rows = await client.$queryRaw<WechatSubscriptionStatus[]>(Prisma.sql`
    INSERT INTO "WechatFollower" (
      "id", "openId", "unionId", "nickname", "avatar", "subscribed",
      "subscribeTime", "unsubscribedAt", "firstSeenSource", "lastSyncedAt",
      "userId", "createdAt", "updatedAt"
    ) VALUES (
      ${crypto.randomUUID()}, ${identity.openId}, ${identity.unionId ?? null},
      ${identity.nickname ?? null}, ${identity.avatar ?? null}, ${identity.subscribed},
      ${identity.subscribeTime ?? null},
      ${identity.subscribed ? null : identity.unsubscribedAt ?? null}, ${identity.firstSeenSource}, NOW(),
      ${userId ?? null}, NOW(), NOW()
    )
    ON CONFLICT ("openId") DO UPDATE SET
      "unionId" = COALESCE(EXCLUDED."unionId", "WechatFollower"."unionId"),
      "nickname" = COALESCE(EXCLUDED."nickname", "WechatFollower"."nickname"),
      "avatar" = COALESCE(EXCLUDED."avatar", "WechatFollower"."avatar"),
      "subscribed" = EXCLUDED."subscribed",
      "subscribeTime" = CASE
        WHEN EXCLUDED."subscribed" THEN COALESCE(EXCLUDED."subscribeTime", "WechatFollower"."subscribeTime", NOW())
        ELSE "WechatFollower"."subscribeTime"
      END,
      "unsubscribedAt" = CASE
        WHEN EXCLUDED."subscribed" THEN NULL
        ELSE COALESCE(EXCLUDED."unsubscribedAt", "WechatFollower"."unsubscribedAt")
      END,
      "userId" = COALESCE(EXCLUDED."userId", "WechatFollower"."userId"),
      "lastSyncedAt" = NOW(),
      "updatedAt" = NOW()
    RETURNING "subscribed", "subscribeTime", "unsubscribedAt", "firstSeenSource"
  `);
  return rows[0];
}

export async function markWechatUnsubscribed(openId: string) {
  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "WechatFollower" (
      "id", "openId", "subscribed", "unsubscribedAt", "firstSeenSource",
      "lastSyncedAt", "createdAt", "updatedAt"
    ) VALUES (
      ${crypto.randomUUID()}, ${openId}, false, NOW(), 'SUBSCRIBE_EVENT', NOW(), NOW(), NOW()
    )
    ON CONFLICT ("openId") DO UPDATE SET
      "subscribed" = false,
      "unsubscribedAt" = NOW(),
      "lastSyncedAt" = NOW(),
      "updatedAt" = NOW()
  `);
}

export async function linkWechatFollowerToUser(params: {
  userId: string;
  openId: string;
  unionId?: string | null;
  source?: "OAUTH" | "SUBSCRIBE_EVENT";
}): Promise<WechatSubscriptionStatus> {
  const unionIdClause = params.unionId
    ? Prisma.sql`OR "unionId" = ${params.unionId}`
    : Prisma.empty;

  const byIdentity = await prisma.$queryRaw<Array<WechatSubscriptionStatus & { id: string }>>(Prisma.sql`
    SELECT "id", "subscribed", "subscribeTime", "unsubscribedAt", "firstSeenSource"
    FROM "WechatFollower"
    WHERE "openId" = ${params.openId}
       ${unionIdClause}
       OR "userId" = ${params.userId}
    ORDER BY "subscribed" DESC, "updatedAt" DESC
    LIMIT 1
  `);

  if (byIdentity[0]) {
    const unionIdUpdate = params.unionId
      ? Prisma.sql`"unionId" = ${params.unionId},`
      : Prisma.empty;

    await prisma.$executeRaw(Prisma.sql`
      UPDATE "WechatFollower"
      SET "userId" = ${params.userId},
          ${unionIdUpdate}
          "updatedAt" = NOW()
      WHERE "id" = ${byIdentity[0].id}
    `);
    return byIdentity[0];
  }

  return upsertWechatFollower(
    {
      openId: params.openId,
      unionId: params.unionId,
      subscribed: false,
      subscribeTime: null,
      firstSeenSource: params.source || "OAUTH",
    },
    params.userId
  );
}

export async function getWechatSubscriptionForUser(
  userId: string
): Promise<WechatSubscriptionStatus | null> {
  const rows = await prisma.$queryRaw<WechatSubscriptionStatus[]>(Prisma.sql`
    SELECT "subscribed", "subscribeTime", "unsubscribedAt", "firstSeenSource"
    FROM "WechatFollower"
    WHERE "userId" = ${userId}
    ORDER BY "subscribed" DESC, "updatedAt" DESC
    LIMIT 1
  `);
  return rows[0] || null;
}

export type WechatSyncRow = {
  openId: string;
  unionId: string | null;
  nickname: string | null;
  avatar: string | null;
  subscribeTimeEpoch: number | null;
};

export async function reconcileWechatFollowers(rows: WechatSyncRow[]) {
  const before = await prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
    SELECT COUNT(*)::int AS "count" FROM "WechatFollower"
  `);

  await prisma.$transaction(async (tx) => {
    // 先为已有微信授权会员建立“未确认关注”的身份记录，不新建会员、不赠送积分。
    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "WechatFollower" (
        "id", "openId", "unionId", "nickname", "avatar", "subscribed",
        "subscribeTime", "unsubscribedAt", "firstSeenSource", "lastSyncedAt",
        "userId", "createdAt", "updatedAt"
      )
      SELECT
        'wf_' || md5(u."wechatOpenId"), u."wechatOpenId", u."wechatUnionId",
        COALESCE(u."wechatNickname", u."nickname"), COALESCE(u."wechatAvatar", u."avatar"),
        false, NULL, NULL, 'OAUTH', NOW(), u."id", u."createdAt", NOW()
      FROM "User" u
      WHERE u."wechatOpenId" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM "WechatFollower" wf
          WHERE wf."openId" = u."wechatOpenId" OR wf."userId" = u."id"
        )
      ON CONFLICT ("openId") DO NOTHING
    `);

    // 只有在完整拉取微信名单后才执行本步骤；随后同一事务内恢复当前关注者。
    await tx.$executeRaw(Prisma.sql`
      UPDATE "WechatFollower"
      SET "subscribed" = false,
          "unsubscribedAt" = CASE WHEN "subscribed" THEN NOW() ELSE "unsubscribedAt" END,
          "lastSyncedAt" = NOW(),
          "updatedAt" = NOW()
      WHERE "subscribed" = true
    `);

    for (let i = 0; i < rows.length; i += 500) {
      const payload = JSON.stringify(rows.slice(i, i + 500));
      await tx.$executeRaw(Prisma.sql`
        WITH incoming AS (
          SELECT *
          FROM jsonb_to_recordset(CAST(${payload} AS jsonb)) AS x(
            "openId" text,
            "unionId" text,
            "nickname" text,
            "avatar" text,
            "subscribeTimeEpoch" double precision
          )
        ), prepared AS (
          SELECT
            i.*,
            (
              SELECT u."id"
              FROM "User" u
              WHERE u."wechatOpenId" = i."openId"
                 OR (i."unionId" IS NOT NULL AND u."wechatUnionId" = i."unionId")
              ORDER BY CASE WHEN u."wechatOpenId" = i."openId" THEN 0 ELSE 1 END
              LIMIT 1
            ) AS "matchedUserId"
          FROM incoming i
        )
        INSERT INTO "WechatFollower" (
          "id", "openId", "unionId", "nickname", "avatar", "subscribed",
          "subscribeTime", "unsubscribedAt", "firstSeenSource", "lastSyncedAt",
          "userId", "createdAt", "updatedAt"
        )
        SELECT
          'wf_' || md5(p."openId"), p."openId", p."unionId", p."nickname", p."avatar",
          true,
          CASE WHEN p."subscribeTimeEpoch" IS NULL THEN NULL ELSE to_timestamp(p."subscribeTimeEpoch") END,
          NULL, 'SYNC', NOW(), p."matchedUserId", NOW(), NOW()
        FROM prepared p
        ON CONFLICT ("openId") DO UPDATE SET
          "unionId" = COALESCE(EXCLUDED."unionId", "WechatFollower"."unionId"),
          "nickname" = COALESCE(EXCLUDED."nickname", "WechatFollower"."nickname"),
          "avatar" = COALESCE(EXCLUDED."avatar", "WechatFollower"."avatar"),
          "subscribed" = true,
          "subscribeTime" = COALESCE(EXCLUDED."subscribeTime", "WechatFollower"."subscribeTime"),
          "unsubscribedAt" = NULL,
          "userId" = COALESCE(EXCLUDED."userId", "WechatFollower"."userId"),
          "lastSyncedAt" = NOW(),
          "updatedAt" = NOW()
      `);
    }
  }, { maxWait: 10_000, timeout: 120_000 });

  const [stats] = await prisma.$queryRaw<Array<{
    totalRecords: number;
    currentFollowers: number;
    linkedFollowers: number;
    unlinkedFollowers: number;
    notFollowingUsers: number;
  }>>(Prisma.sql`
    SELECT
      COUNT(*)::int AS "totalRecords",
      COUNT(*) FILTER (WHERE "subscribed")::int AS "currentFollowers",
      COUNT(*) FILTER (WHERE "subscribed" AND "userId" IS NOT NULL)::int AS "linkedFollowers",
      COUNT(*) FILTER (WHERE "subscribed" AND "userId" IS NULL)::int AS "unlinkedFollowers",
      COUNT(*) FILTER (WHERE NOT "subscribed" AND "userId" IS NOT NULL)::int AS "notFollowingUsers"
    FROM "WechatFollower"
  `);

  return {
    ...stats,
    syncedCount: rows.length,
    createdCount: stats.totalRecords - (before[0]?.count || 0),
    updatedCount: rows.length,
  };
}

export async function getWechatFollowerAdminStats() {
  const [stats] = await prisma.$queryRaw<Array<{
    currentFollowers: number;
    linkedFollowers: number;
    unlinkedFollowers: number;
    notFollowingUsers: number;
    boundPhoneCount: number;
    totalRecords: number;
  }>>(Prisma.sql`
    SELECT
      COUNT(*) FILTER (WHERE wf."subscribed")::int AS "currentFollowers",
      COUNT(*) FILTER (WHERE wf."subscribed" AND wf."userId" IS NOT NULL)::int AS "linkedFollowers",
      COUNT(*) FILTER (WHERE wf."subscribed" AND wf."userId" IS NULL)::int AS "unlinkedFollowers",
      COUNT(*) FILTER (WHERE NOT wf."subscribed" AND wf."userId" IS NOT NULL)::int AS "notFollowingUsers",
      COUNT(*) FILTER (WHERE wf."subscribed" AND u."phone" IS NOT NULL)::int AS "boundPhoneCount",
      COUNT(*)::int AS "totalRecords"
    FROM "WechatFollower" wf
    LEFT JOIN "User" u ON u."id" = wf."userId"
  `);
  return stats;
}

export async function listWechatFollowerRecords(params: {
  page: number;
  limit: number;
  search: string;
}) {
  const offset = (params.page - 1) * params.limit;
  const pattern = `%${params.search}%`;
  const filter = params.search
    ? Prisma.sql`WHERE
        wf."openId" ILIKE ${pattern}
        OR COALESCE(wf."nickname", '') ILIKE ${pattern}
        OR COALESCE(u."nickname", '') ILIKE ${pattern}
        OR COALESCE(u."username", '') ILIKE ${pattern}
        OR COALESCE(u."phone", '') LIKE ${pattern}`
    : Prisma.empty;

  const [countRows, records] = await Promise.all([
    prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
      SELECT COUNT(*)::int AS "count"
      FROM "WechatFollower" wf
      LEFT JOIN "User" u ON u."id" = wf."userId"
      ${filter}
    `),
    prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT
        wf."id", wf."openId" AS "wechatOpenId", wf."unionId",
        COALESCE(wf."nickname", u."wechatNickname", u."nickname", u."username", '微信用户') AS "nickname",
        COALESCE(wf."avatar", u."wechatAvatar", u."avatar") AS "avatar",
        wf."subscribed", wf."subscribeTime", wf."unsubscribedAt", wf."firstSeenSource",
        wf."lastSyncedAt", wf."userId", u."username", u."phone", u."role", u."status",
        u."createdAt" AS "registeredAt", pa."balance" AS "pointBalance"
      FROM "WechatFollower" wf
      LEFT JOIN "User" u ON u."id" = wf."userId"
      LEFT JOIN "PointAccount" pa ON pa."userId" = u."id"
      ${filter}
      ORDER BY wf."subscribed" DESC, COALESCE(wf."subscribeTime", wf."createdAt") DESC
      LIMIT ${params.limit} OFFSET ${offset}
    `),
  ]);

  return { total: countRows[0]?.count || 0, records };
}
