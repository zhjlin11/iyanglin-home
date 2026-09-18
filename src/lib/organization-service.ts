import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export type OrgRole =
  | "OWNER"
  | "ADMIN"
  | "OPERATOR"
  | "HR"
  | "CUSTOMER_SERVICE"
  | "FINANCE"
  | "TECHNICIAN";

export type OrgPermission =
  | "org:manage"
  | "org:members:manage"
  | "jobs:read"
  | "jobs:write"
  | "candidates:read"
  | "candidates:write"
  | "orders:read"
  | "orders:write"
  | "orders:assign"
  | "orders:finance"
  | "crm:read"
  | "crm:write"
  | "crm:export"
  | "leads:read"
  | "leads:write"
  | "services:manage"
  | "tasks:manage"
  | "tasks:execute";

const ROLE_PERMISSIONS: Record<OrgRole, OrgPermission[]> = {
  OWNER: [
    "org:manage",
    "org:members:manage",
    "jobs:read",
    "jobs:write",
    "candidates:read",
    "candidates:write",
    "orders:read",
    "orders:write",
    "orders:assign",
    "orders:finance",
    "crm:read",
    "crm:write",
    "crm:export",
    "leads:read",
    "leads:write",
    "services:manage",
    "tasks:manage",
    "tasks:execute",
  ],
  ADMIN: [
    "org:members:manage",
    "jobs:read",
    "jobs:write",
    "candidates:read",
    "candidates:write",
    "orders:read",
    "orders:write",
    "orders:assign",
    "crm:read",
    "crm:write",
    "leads:read",
    "leads:write",
    "services:manage",
    "tasks:manage",
    "tasks:execute",
  ],
  HR: [
    "jobs:read",
    "jobs:write",
    "candidates:read",
    "candidates:write",
    "tasks:execute",
  ],
  OPERATOR: [
    "jobs:read",
    "services:manage",
    "crm:read",
    "crm:write",
    "leads:read",
    "leads:write",
    "tasks:execute",
  ],
  CUSTOMER_SERVICE: [
    "orders:read",
    "crm:read",
    "crm:write",
    "leads:read",
    "leads:write",
    "tasks:execute",
  ],
  FINANCE: [
    "orders:read",
    "orders:finance",
    "tasks:execute",
  ],
  TECHNICIAN: [
    "orders:read",
    "tasks:execute",
  ],
};

export function hasOrgPermission(role: string, permission: OrgPermission): boolean {
  const allowed = ROLE_PERMISSIONS[role as OrgRole];
  if (!allowed) return false;
  return allowed.includes(permission);
}

export async function getUserOrganizations(userId: string) {
  const memberships = await prisma.organizationMember.findMany({
    where: { userId, status: "ACTIVE" },
    include: {
      organization: {
        include: {
          provider: { select: { id: true, name: true, serviceCategory: true, avatar: true } },
          _count: {
            select: { members: true, jobs: true, tasks: true },
          },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  const [provider, verifications] = await Promise.all([
    prisma.serviceProvider.findUnique({
      where: { userId },
      select: { id: true, name: true, avatar: true, phone: true, serviceCategory: true },
    }),
    prisma.verificationRecord.findMany({
      where: { userId, status: "APPROVED" },
      select: { verifyType: true, companyName: true },
    }),
  ]);

  const existingOrgProviderIds = new Set(memberships.map((m) => m.organization.providerId).filter(Boolean));
  const orgList = memberships.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    type: m.organization.type,
    logo: m.organization.logo,
    role: m.role,
    title: m.title,
    providerId: m.organization.providerId,
    memberCount: m.organization._count.members,
    jobCount: m.organization._count.jobs,
    taskCount: m.organization._count.tasks,
  }));

  if (provider && !existingOrgProviderIds.has(provider.id)) {
    try {
      const newOrg = await prisma.organization.create({
        data: {
          name: provider.name || "杨林本地精选店铺",
          type: "MERCHANT",
          logo: provider.avatar,
          contactPhone: provider.phone,
          ownerId: userId,
          providerId: provider.id,
          members: {
            create: {
              userId,
              role: "OWNER",
              title: "店铺负责人",
            },
          },
        },
      });
      orgList.push({
        id: newOrg.id,
        name: newOrg.name,
        type: newOrg.type,
        logo: newOrg.logo,
        role: "OWNER",
        title: "店铺负责人",
        providerId: provider.id,
        memberCount: 1,
        jobCount: 0,
        taskCount: 0,
      });
    } catch (e) {
      console.error("[ORG_INIT] Failed to auto create merchant org:", e);
    }
  }

  const enterpriseVerif = verifications.find((v) => v.verifyType === "ENTERPRISE");
  const hasEnterpriseOrg = orgList.some((o) => o.type === "ENTERPRISE" && o.role === "OWNER");
  if (enterpriseVerif && !hasEnterpriseOrg) {
    try {
      const newOrg = await prisma.organization.create({
        data: {
          name: enterpriseVerif.companyName || "杨林本地认证企业",
          type: "ENTERPRISE",
          ownerId: userId,
          members: {
            create: {
              userId,
              role: "OWNER",
              title: "企业法定代表/负责人",
            },
          },
        },
      });
      orgList.push({
        id: newOrg.id,
        name: newOrg.name,
        type: newOrg.type,
        logo: null,
        role: "OWNER",
        title: "企业法定代表/负责人",
        providerId: null,
        memberCount: 1,
        jobCount: 0,
        taskCount: 0,
      });
    } catch (e) {
      console.error("[ORG_INIT] Failed to auto create enterprise org:", e);
    }
  }

  return orgList;
}

export async function verifyOrgAccess(
  userId: string,
  organizationId: string,
  requiredPermission?: OrgPermission
): Promise<{
  authorized: boolean;
  member?: any;
  organization?: any;
  role?: OrgRole;
  error?: string;
}> {
  if (!userId || !organizationId) {
    return { authorized: false, error: "缺少组织或用户标识" };
  }

  const member = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    include: {
      organization: true,
    },
  });

  if (!member || member.status !== "ACTIVE" || member.organization.status !== "ACTIVE") {
    return { authorized: false, error: "无权访问该组织工作空间或组织已停用" };
  }

  if (requiredPermission) {
    const isPermitted = hasOrgPermission(member.role, requiredPermission);
    if (!isPermitted) {
      return {
        authorized: false,
        member,
        organization: member.organization,
        role: member.role as OrgRole,
        error: `当前角色 [${member.role}] 缺乏权限: ${requiredPermission}`,
      };
    }
  }

  return {
    authorized: true,
    member,
    organization: member.organization,
    role: member.role as OrgRole,
  };
}

export async function logOrgAudit(params: {
  organizationId: string;
  operatorId: string;
  operatorName: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: any;
  ip?: string;
}) {
  try {
    await prisma.organizationAuditLog.create({
      data: {
        organizationId: params.organizationId,
        operatorId: params.operatorId,
        operatorName: params.operatorName,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        detailsJson: JSON.stringify(params.details || {}),
        ip: params.ip,
      },
    });
  } catch (e) {
    console.error("[ORG_AUDIT] Failed to record audit log:", e);
  }
}

export async function createOrgInvite(params: {
  organizationId: string;
  operatorId: string;
  role: OrgRole;
  invitePhone?: string;
  expireDays?: number;
}) {
  const code = "INV_" + crypto.randomBytes(4).toString("hex").toUpperCase();
  const expiresAt = new Date(Date.now() + (params.expireDays || 7) * 24 * 60 * 60 * 1000);

  const invite = await prisma.organizationInvite.create({
    data: {
      organizationId: params.organizationId,
      inviteCode: code,
      invitePhone: params.invitePhone?.trim() || null,
      role: params.role,
      expiresAt,
      createdBy: params.operatorId,
    },
  });

  return invite;
}
