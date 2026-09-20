/**
 * 资源访问与审核状态控制
 * 统一各频道（招聘、房产、便民、相亲、商城、招商、活动、社区）的审核状态访问逻辑
 * 避免待审核内容在个人中心点击后 404，同时确保普通访客不会看到未审核公开内容
 */

export interface CanViewResourceParams {
  status: string;
  authorId?: string | null;
  userId?: string | null;
  currentUser?: {
    id: string;
    role?: string;
  } | null;
}

export interface ResourceAccessResult {
  canView: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isPublic: boolean;
  normalizedStatus: "APPROVED" | "PENDING" | "REJECTED" | "OFFLINE" | "OTHER";
}

export function canViewResource(params: CanViewResourceParams): ResourceAccessResult {
  const statusUpper = (params.status || "").toUpperCase();
  const ownerId = params.authorId || params.userId;
  const currentUserId = params.currentUser?.id;
  const roleUpper = (params.currentUser?.role || "").toUpperCase();

  const isOwner = Boolean(currentUserId && ownerId && currentUserId === ownerId);
  const isAdmin = roleUpper === "ADMIN" || roleUpper === "EDITOR" || roleUpper === "REVIEWER";

  const isPublic = [
    "APPROVED",
    "PUBLISHED",
    "ACTIVE",
    "SOLD",
    "RESOLVED",
    "EXPIRED",
  ].includes(statusUpper);

  let normalizedStatus: "APPROVED" | "PENDING" | "REJECTED" | "OFFLINE" | "OTHER" = "OTHER";
  if (["APPROVED", "PUBLISHED", "ACTIVE"].includes(statusUpper)) {
    normalizedStatus = "APPROVED";
  } else if (["PENDING", "DRAFT", "REVIEW", "UNDER_REVIEW"].includes(statusUpper)) {
    normalizedStatus = "PENDING";
  } else if (["REJECTED", "REFUSED"].includes(statusUpper)) {
    normalizedStatus = "REJECTED";
  } else if (["OFFLINE", "CLOSED", "PAUSED"].includes(statusUpper)) {
    normalizedStatus = "OFFLINE";
  }

  // 公开状态任何人可看；非公开状态仅作者本人和平台管理员可预览
  const canView = isPublic || isOwner || isAdmin;

  return {
    canView,
    isOwner,
    isAdmin,
    isPublic,
    normalizedStatus,
  };
}
