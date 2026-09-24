import { prisma } from "@/lib/prisma";
import { AdminLayout } from "@/components/admin/AdminLayout";
import Link from "next/link";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

const statusLabels: Record<string, string> = {
  PENDING_PAYMENT: "待支付",
  PAID: "已支付",
  CANCELLED: "已取消",
  REFUNDED: "已退款",
};

const kindLabels: Record<string, string> = {
  article: "文章资讯",
  job: "招聘职位",
  listing: "分类信息",
  house: "房产",
  shop: "好店商家",
  event: "本地活动",
  post: "社区贴子",
  love: "相亲嘉宾",
};

const contentStatusLabels: Record<string, string> = {
  draft: "草稿",
  pending: "待审核",
  approved: "已发布",
  offline: "已下线",
  DRAFT: "草稿",
  PENDING: "待审核",
  APPROVED: "已发布",
  OFFLINE: "已下线",
};

function yuan(cents: number) {
  const value = cents / 100;
  return value.toFixed(value % 1 === 0 ? 0 : 2);
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const order = await prisma.billingOrder.findUnique({
    where: { id },
    include: { plan: true },
  });

  if (!order) {
    return (
      <AdminLayout title="订单详情" subtitle="未找到指定订单">
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "40px 20px", textAlign: "center" }}>
          <p style={{ color: "#6b7280", margin: "0 0 16px" }}>订单不存在或已被删除</p>
          <Link href="/admin/orders" style={{ padding: "8px 16px", borderRadius: "6px", background: "#1677FF", color: "#ffffff", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>
            ← 返回订单列表
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const linked = await (async () => {
    if (order.targetKind === "article") return prisma.article.findUnique({ where: { id: order.targetId }, select: { id: true, title: true, status: true } });
    if (order.targetKind === "job") return prisma.job.findUnique({ where: { id: order.targetId }, select: { id: true, title: true, status: true } });
    if (order.targetKind === "listing") return prisma.listing.findUnique({ where: { id: order.targetId }, select: { id: true, title: true, status: true } });
    if (order.targetKind === "house") return prisma.house.findUnique({ where: { id: order.targetId }, select: { id: true, title: true, status: true } });
    if (order.targetKind === "shop") return prisma.shop.findUnique({ where: { id: order.targetId }, select: { id: true, name: true, status: true } }).then(s => s ? { id: s.id, title: s.name, status: s.status } : null);
    if (order.targetKind === "event") return prisma.event.findUnique({ where: { id: order.targetId }, select: { id: true, title: true, status: true } });
    if (order.targetKind === "post") return prisma.post.findUnique({ where: { id: order.targetId }, select: { id: true, title: true, status: true } });
    if (order.targetKind === "love") return prisma.datingProfile.findUnique({ where: { id: order.targetId }, select: { id: true, nickname: true, status: true } }).then(s => s ? { id: s.id, title: s.nickname, status: s.status } : null);
    return null;
  })();
  const linkedContent = linked;

  const logs = await prisma.operationLog.findMany({
    where: { OR: [{ targetId: order.id }, { metadata: { path: ["orderNo"], equals: order.orderNo } }] },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <AdminLayout
      title={`订单详情 · ${order.orderNo}`}
      subtitle={`创建时间：${new Date(order.createdAt).toLocaleString("zh-CN")} · 金额：¥${yuan(order.amountCents)} · 状态：${statusLabels[order.status] || order.status}`}
      actionButton={
        <div style={{ display: "flex", gap: "8px" }}>
          <Link href="/admin/orders" style={{ padding: "6px 14px", borderRadius: "6px", background: "#f3f4f6", border: "1px solid #d1d5db", color: "#374151", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>
            ← 返回列表
          </Link>
          {linkedContent && (
            <Link href={`/admin/content/${linkedContent.id}/preview`} style={{ padding: "6px 14px", borderRadius: "6px", background: "#1677FF", color: "#ffffff", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>
              预览关联内容
            </Link>
          )}
        </div>
      }
    >
      <div className="shell detail-shell" style={{ maxWidth: "100%", margin: 0, padding: 0 }}>
        <div className="detail-meta" style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
          <span style={{ padding: "3px 10px", borderRadius: "4px", background: "#EFF6FF", color: "#1D4ED8", fontWeight: 600, fontSize: "13px" }}>{statusLabels[order.status] || order.status}</span>
          <span style={{ padding: "3px 10px", borderRadius: "4px", background: "#F3F4F6", color: "#374151", fontSize: "13px" }}>{kindLabels[order.targetKind] || order.targetKind}</span>
          <span style={{ padding: "3px 10px", borderRadius: "4px", background: "#ECFDF5", color: "#047857", fontWeight: 700, fontSize: "13px" }}>¥{yuan(order.amountCents)}</span>
        </div>

        <section className="detail-body">
          <h2>订单信息</h2>
          <p>套餐名称：{order.planName}</p>
          <p>关联内容：{order.targetTitle}</p>
          <p>内容 ID：{order.targetId}</p>
          <p>关联内容状态：{linkedContent ? "关联内容正常" : "关联内容已删除"}</p>
          {linkedContent ? (
            <p>
              当前内容：{linkedContent.title}（{contentStatusLabels[linkedContent.status] || linkedContent.status}）
            </p>
          ) : (
            <p>内容已删除，订单作为收费记录继续保留。</p>
          )}
          <p>订单金额：¥{yuan(order.amountCents)}</p>
          <p>当前状态：{statusLabels[order.status] || order.status}</p>
          <p>更新时间：{new Date(order.updatedAt).toLocaleString("zh-CN")}</p>
          {linkedContent ? (
            <p className="detail-actions">
              <a className="button button-small button-secondary" href={`/admin/content/${linkedContent.id}/preview`}>预览关联内容</a>
              <a className="button button-small button-secondary" href={`/admin/content/${linkedContent.id}/edit`}>编辑关联内容</a>
            </p>
          ) : null}
        </section>

        <section className="detail-body">
          <h2>套餐快照</h2>
          {order.plan ? (
            <>
              <p>当前套餐：{order.plan.name}</p>
              <p>套餐价格：¥{yuan(order.plan.priceCents)}</p>
              <p>有效天数：{order.plan.durationDays} 天</p>
              <p>套餐状态：{order.plan.enabled ? "启用中" : "已停用"}</p>
              {order.plan.description ? <p>套餐说明：{order.plan.description}</p> : null}
            </>
          ) : (
            <p>原套餐已删除，订单保留当时的套餐名称和金额。</p>
          )}
        </section>

        <section className="detail-body">
          <h2>操作记录</h2>
          {logs.length === 0 ? (
            <p>暂无订单操作记录</p>
          ) : (
            logs.map((log) => (
              <p key={log.id}>
                {log.action} · {new Date(log.createdAt).toLocaleString("zh-CN")}
              </p>
            ))
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
