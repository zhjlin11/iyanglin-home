/**
 * Audit Log Presenter & Action Registry
 * 将程序内部底层日志转化为管理员、运营与财务可读的专业业务审计日志。
 * 遵循“列表讲人话，详情讲业务，高级信息讲技术”的三层呈现架构。
 */

export type AuditCategoryKey =
  | "FINANCE"
  | "CONTENT"
  | "REVIEW"
  | "ACCOUNT"
  | "SECURITY"
  | "MALL"
  | "OPERATIONS"
  | "SYSTEM";

export interface AuditCategoryMeta {
  key: AuditCategoryKey;
  label: string;
  color: string;
  bg: string;
  border: string;
}

export const AUDIT_CATEGORIES: Record<AuditCategoryKey, AuditCategoryMeta> = {
  FINANCE: {
    key: "FINANCE",
    label: "财务支付",
    color: "#15803d",
    bg: "#dcfce7",
    border: "#bbf7d0",
  },
  CONTENT: {
    key: "CONTENT",
    label: "内容管理",
    color: "#0369a1",
    bg: "#e0f2fe",
    border: "#bae6fd",
  },
  REVIEW: {
    key: "REVIEW",
    label: "审核治理",
    color: "#c2410c",
    bg: "#ffedd5",
    border: "#fed7aa",
  },
  ACCOUNT: {
    key: "ACCOUNT",
    label: "账号用户",
    color: "#7e22ce",
    bg: "#f3e8ff",
    border: "#e9d5ff",
  },
  SECURITY: {
    key: "SECURITY",
    label: "安全审计",
    color: "#b91c1c",
    bg: "#fee2e2",
    border: "#fecaca",
  },
  MALL: {
    key: "MALL",
    label: "商城业务",
    color: "#4338ca",
    bg: "#e0e7ff",
    border: "#c7d2fe",
  },
  OPERATIONS: {
    key: "OPERATIONS",
    label: "运营增长",
    color: "#0d9488",
    bg: "#ccfbf1",
    border: "#99f6e4",
  },
  SYSTEM: {
    key: "SYSTEM",
    label: "系统配置",
    color: "#4b5563",
    bg: "#f3f4f6",
    border: "#e5e7eb",
  },
};

export interface AuditActionDefinition {
  label: string;
  category: AuditCategoryKey;
  severity: "info" | "success" | "warning" | "danger" | "security";
  defaultResult?: string;
  isSecurityEvent?: boolean;
}

/**
 * 完整 Action Code 中文白名单与业务映射注册表
 * 覆盖生产数据库全量 29 种已发生 Action 及代码中声明的全部核心 Action
 */
export const AUDIT_ACTION_REGISTRY: Record<string, AuditActionDefinition> = {
  // ── 财务与支付 ──
  WECHAT_PAY_SUCCESS: {
    label: "微信支付成功",
    category: "FINANCE",
    severity: "success",
    defaultResult: "成功",
  },
  ADMIN_REFUND_ORDER: {
    label: "发起订单退款",
    category: "FINANCE",
    severity: "warning",
    defaultResult: "已退款",
  },
  BILLING_ORDER_PAID: {
    label: "商业订单支付成功",
    category: "FINANCE",
    severity: "success",
    defaultResult: "成功",
  },
  ADMIN_CONFIRM_ORDER_PAID: {
    label: "管理员线下核实入账",
    category: "FINANCE",
    severity: "success",
    defaultResult: "已确认入账",
  },
  SERVICE_ORDER_PAID: {
    label: "便民服务订单支付成功",
    category: "FINANCE",
    severity: "success",
    defaultResult: "成功",
  },
  SERVICE_ORDER_REFUNDED: {
    label: "便民服务退款处理",
    category: "FINANCE",
    severity: "warning",
    defaultResult: "已退款",
  },
  ADMIN_SETTLEMENT_PAYOUT: {
    label: "发放服务商结算款",
    category: "FINANCE",
    severity: "warning",
    defaultResult: "已打款",
  },
  CREATE_PLATFORM_COUPON: {
    label: "创建平台立减券",
    category: "FINANCE",
    severity: "info",
    defaultResult: "创建成功",
  },
  TOGGLE_COUPON: {
    label: "启停平台优惠券",
    category: "FINANCE",
    severity: "warning",
    defaultResult: "状态已变更",
  },
  COMMERCIAL_PACKAGE_UPDATED: {
    label: "修改商业推广计费策略",
    category: "FINANCE",
    severity: "warning",
    defaultResult: "配置已更新",
  },
  coin_recharge: {
    label: "金币充值",
    category: "FINANCE",
    severity: "success",
    defaultResult: "成功",
  },
  point_consume: {
    label: "积分消费扣减",
    category: "FINANCE",
    severity: "info",
    defaultResult: "已扣减",
  },
  refund_order: {
    label: "订单申请退款",
    category: "FINANCE",
    severity: "warning",
    defaultResult: "处理中",
  },

  // ── 内容管理 ──
  create_listing: {
    label: "发布综合信息",
    category: "CONTENT",
    severity: "info",
    defaultResult: "发布成功",
  },
  delete_listing: {
    label: "删除综合信息",
    category: "CONTENT",
    severity: "danger",
    defaultResult: "已删除",
  },
  ADMIN_DELETE_CONTENT_LISTING: {
    label: "管理员删除综合信息",
    category: "CONTENT",
    severity: "danger",
    defaultResult: "已删除",
  },
  create_job: {
    label: "发布招聘岗位",
    category: "CONTENT",
    severity: "info",
    defaultResult: "发布成功",
  },
  delete_job: {
    label: "删除招聘岗位",
    category: "CONTENT",
    severity: "danger",
    defaultResult: "已删除",
  },
  create_house: {
    label: "发布房产租售",
    category: "CONTENT",
    severity: "info",
    defaultResult: "发布成功",
  },
  delete_house: {
    label: "删除房产房源",
    category: "CONTENT",
    severity: "danger",
    defaultResult: "已删除",
  },
  delete_article: {
    label: "删除资讯文章",
    category: "CONTENT",
    severity: "danger",
    defaultResult: "已删除",
  },
  CREATE_POST_PENDING: {
    label: "发布社区帖子(待审)",
    category: "CONTENT",
    severity: "info",
    defaultResult: "待审核",
  },
  delete_post: {
    label: "删除社区帖子",
    category: "CONTENT",
    severity: "danger",
    defaultResult: "已删除",
  },
  delete_event: {
    label: "删除同城活动",
    category: "CONTENT",
    severity: "danger",
    defaultResult: "已删除",
  },
  delete_love: {
    label: "删除相亲档案",
    category: "CONTENT",
    severity: "danger",
    defaultResult: "已删除",
  },
  delete_shop: {
    label: "删除口碑好店",
    category: "CONTENT",
    severity: "danger",
    defaultResult: "已删除",
  },
  DELETE_SHOP: {
    label: "删除商户主页",
    category: "CONTENT",
    severity: "danger",
    defaultResult: "已删除",
  },
  view_job_contact: {
    label: "查看招聘联系方式",
    category: "CONTENT",
    severity: "info",
    defaultResult: "查看成功",
  },
  refresh_listing: {
    label: "刷新信息发布时间",
    category: "CONTENT",
    severity: "info",
    defaultResult: "已刷新",
  },

  // ── 审核治理 ──
  review_listing_offline: {
    label: "下架综合信息",
    category: "REVIEW",
    severity: "warning",
    defaultResult: "已下架",
  },
  review_job_offline: {
    label: "下架招聘岗位",
    category: "REVIEW",
    severity: "warning",
    defaultResult: "已下架",
  },
  review_job_approved: {
    label: "审核通过招聘岗位",
    category: "REVIEW",
    severity: "success",
    defaultResult: "审核通过",
  },
  approve_job: {
    label: "审核通过招聘",
    category: "REVIEW",
    severity: "success",
    defaultResult: "审核通过",
  },
  reject_job: {
    label: "驳回招聘岗位",
    category: "REVIEW",
    severity: "warning",
    defaultResult: "已驳回",
  },
  update_job_status: {
    label: "流转招聘状态",
    category: "REVIEW",
    severity: "info",
    defaultResult: "状态已更新",
  },
  update_listing_status: {
    label: "流转综合信息状态",
    category: "REVIEW",
    severity: "info",
    defaultResult: "状态已更新",
  },
  ADMIN_UPDATE_CONTENT_LISTING_APPROVED: {
    label: "审核通过便民分类",
    category: "REVIEW",
    severity: "success",
    defaultResult: "审核通过",
  },
  ADMIN_UPDATE_CONTENT_LISTING_OFFLINE: {
    label: "下架便民分类信息",
    category: "REVIEW",
    severity: "warning",
    defaultResult: "已下架",
  },
  review_shop_offline: {
    label: "下架口碑好店",
    category: "REVIEW",
    severity: "warning",
    defaultResult: "已下架",
  },
  review_post_offline: {
    label: "下架社区帖子",
    category: "REVIEW",
    severity: "warning",
    defaultResult: "已下架",
  },
  review_verification_approved: {
    label: "审核通过实名/企业认证",
    category: "REVIEW",
    severity: "success",
    defaultResult: "认证通过",
  },
  update_report_status: {
    label: "处理违规举报工单",
    category: "REVIEW",
    severity: "info",
    defaultResult: "已处理",
  },
  MODERATE_REVIEW: {
    label: "处理商户评价",
    category: "REVIEW",
    severity: "info",
    defaultResult: "已治理",
  },

  // ── 账号与企业 ──
  delete_user: {
    label: "删除用户账号",
    category: "ACCOUNT",
    severity: "danger",
    defaultResult: "已注销",
  },
  update_user_admin: {
    label: "管理员修改用户信息",
    category: "ACCOUNT",
    severity: "warning",
    defaultResult: "修改成功",
  },
  COMPANY_CREATE: {
    label: "录入企业主体档案",
    category: "ACCOUNT",
    severity: "info",
    defaultResult: "录入成功",
  },
  COMPANY_MERGE: {
    label: "合并重复企业档案",
    category: "ACCOUNT",
    severity: "warning",
    defaultResult: "已合并",
  },
  TOGGLE_FEATURED: {
    label: "调整名企招聘推荐",
    category: "OPERATIONS",
    severity: "info",
    defaultResult: "推荐位已调整",
  },
  create_organization: {
    label: "新建组织机构治理单元",
    category: "ACCOUNT",
    severity: "info",
    defaultResult: "创建成功",
  },
  disable_user: {
    label: "封禁禁用用户账号",
    category: "SECURITY",
    severity: "danger",
    defaultResult: "已封禁",
    isSecurityEvent: true,
  },
  update_user: {
    label: "修改用户信息",
    category: "ACCOUNT",
    severity: "info",
    defaultResult: "修改成功",
  },

  // ── 安全与权限 ──
  ADMIN_MANAGE_USER_LOGOUT_ALL: {
    label: "强制账号全端登出",
    category: "SECURITY",
    severity: "security",
    defaultResult: "强制下线",
    isSecurityEvent: true,
  },
  change_own_password: {
    label: "修改个人登录密码",
    category: "SECURITY",
    severity: "warning",
    defaultResult: "密码已修改",
    isSecurityEvent: true,
  },
  login_success: {
    label: "管理员登录成功",
    category: "SECURITY",
    severity: "success",
    defaultResult: "成功",
  },
  login_failed: {
    label: "管理员登录失败",
    category: "SECURITY",
    severity: "danger",
    defaultResult: "拒绝",
    isSecurityEvent: true,
  },
  admin_unbind_wechat: {
    label: "解绑微信绑定账号",
    category: "SECURITY",
    severity: "warning",
    defaultResult: "解绑成功",
    isSecurityEvent: true,
  },
  rate_limit_exceeded: {
    label: "触发请求安全频控拦截",
    category: "SECURITY",
    severity: "danger",
    defaultResult: "拦截",
    isSecurityEvent: true,
  },

  // ── 运营与推广 ──
  create_advertisement: {
    label: "创建全站广告排期",
    category: "OPERATIONS",
    severity: "info",
    defaultResult: "排期创建",
  },
  update_advertisement: {
    label: "修改全站广告排期",
    category: "OPERATIONS",
    severity: "info",
    defaultResult: "排期已更新",
  },
  delete_advertisement: {
    label: "删除广告排期",
    category: "OPERATIONS",
    severity: "danger",
    defaultResult: "已删除",
  },
  sync_wechat_followers: {
    label: "全量同步微信公众号粉丝",
    category: "OPERATIONS",
    severity: "info",
    defaultResult: "同步完成",
  },

  // ── 商城业务 ──
  START_DELIVERY: {
    label: "自营便利店骑手接单配送",
    category: "MALL",
    severity: "info",
    defaultResult: "配送中",
  },
  CONFIRM_RECEIVED: {
    label: "商城订单确认收货",
    category: "MALL",
    severity: "success",
    defaultResult: "已完成",
  },
  AFTERSALE_REJECT: {
    label: "驳回自营商城售后申请",
    category: "MALL",
    severity: "warning",
    defaultResult: "已驳回",
  },

  // ── 系统运维与字典 ──
  update_system_settings: {
    label: "修改全站系统参数配置",
    category: "SYSTEM",
    severity: "warning",
    defaultResult: "保存成功",
  },
  create_dictionary_item: {
    label: "新建数据字典子项",
    category: "SYSTEM",
    severity: "info",
    defaultResult: "新建成功",
  },
  update_dictionary_item: {
    label: "更新数据字典子项",
    category: "SYSTEM",
    severity: "info",
    defaultResult: "更新成功",
  },
  delete_dictionary_item: {
    label: "删除数据字典子项",
    category: "SYSTEM",
    severity: "danger",
    defaultResult: "已删除",
  },
  create_dictionary_type: {
    label: "创建数据字典分类",
    category: "SYSTEM",
    severity: "info",
    defaultResult: "分类已建",
  },
  update_dictionary_type: {
    label: "修改数据字典分类",
    category: "SYSTEM",
    severity: "info",
    defaultResult: "修改成功",
  },
  delete_dictionary_type: {
    label: "删除数据字典分类",
    category: "SYSTEM",
    severity: "danger",
    defaultResult: "已删除",
  },
};

/* ────────────────────────────────────────────
   Presenter 辅助函数与呈现器
   ──────────────────────────────────────────── */

/**
 * 敏感信息脱敏处理器
 */
export function maskPhone(phone?: string | null): string {
  if (!phone) return "";
  const clean = phone.trim();
  if (clean.length === 11) {
    return clean.slice(0, 3) + "****" + clean.slice(7);
  }
  if (clean.length > 6) {
    return clean.slice(0, 3) + "***" + clean.slice(-3);
  }
  return clean;
}

export function maskSensitiveData(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(maskSensitiveData);

  const sensitiveKeys = new Set([
    "password",
    "passwordHash",
    "token",
    "cookie",
    "secret",
    "authSecret",
    "apiKey",
    "mchKey",
    "privateKey",
    "openId",
    "wechatOpenId",
    "unionId",
    "wechatUnionId",
  ]);

  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (sensitiveKeys.has(k)) {
      result[k] = "[已受安全策略保护脱敏]";
    } else if (k === "phone" && typeof v === "string") {
      result[k] = maskPhone(v);
    } else if (typeof v === "object" && v !== null) {
      result[k] = maskSensitiveData(v);
    } else {
      result[k] = v;
    }
  }
  return result;
}

/**
 * 时间相对格式化
 */
export function formatAuditTime(isoString: string | Date): { short: string; full: string } {
  const d = new Date(isoString);
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");

  const full = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();

  let short = `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (isToday) {
    short = `今天 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } else if (isYesterday) {
    short = `昨天 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  return { short, full };
}

/**
 * 操作人员人话呈现器
 */
export function presentAuditActor(log: {
  userId?: string | null;
  action: string;
  metadata?: Record<string, any> | null;
  user?: {
    id: string;
    username: string;
    role?: string;
    nickname?: string | null;
    phone?: string | null;
  } | null;
}): {
  primary: string;
  secondary: string;
  isSystem: boolean;
  avatarText: string;
} {
  // 1. 微信支付回调系统自动动作
  if (log.action === "WECHAT_PAY_SUCCESS" || log.action === "SERVICE_ORDER_PAID") {
    return {
      primary: "微信支付系统",
      secondary: "官方回调 · 自动清分入账",
      isSystem: true,
      avatarText: "微",
    };
  }

  // 2. 微信粉丝同步或其他系统级定时任务
  if (log.action.startsWith("sync_") || log.action.includes("system_task")) {
    return {
      primary: "系统自动调度任务",
      secondary: "后台异步作业",
      isSystem: true,
      avatarText: "统",
    };
  }

  // 3. 关联了具体 User 账号
  if (log.user) {
    const isMasterAdmin =
      log.user.role === "ADMIN" ||
      log.user.username === "admin" ||
      log.user.username.includes("admin");

    const displayName = log.user.nickname || log.user.username;
    if (isMasterAdmin) {
      return {
        primary: `管理员 ${displayName}`,
        secondary: `账号: ${log.user.username} · ID: ...${log.user.id.slice(-6)}`,
        isSystem: false,
        avatarText: displayName[0] || "管",
      };
    }

    return {
      primary: `用户 ${displayName}`,
      secondary: log.user.phone ? `手机: ${maskPhone(log.user.phone)}` : `用户ID: ...${log.user.id.slice(-6)}`,
      isSystem: false,
      avatarText: displayName[0] || "用",
    };
  }

  // 4. 元数据中有操作者标识 (如 operator)
  if (log.metadata && typeof log.metadata.operator === "string") {
    return {
      primary: `管理员 ${log.metadata.operator}`,
      secondary: "后台管理控制台",
      isSystem: false,
      avatarText: log.metadata.operator[0] || "管",
    };
  }

  // 5. 无人为身份归属的默认推断
  const def = AUDIT_ACTION_REGISTRY[log.action];
  if (def?.category === "REVIEW" || def?.category === "SYSTEM") {
    return {
      primary: "系统合规治理机制",
      secondary: "系统自动化流转",
      isSystem: true,
      avatarText: "审",
    };
  }

  return {
    primary: "前台访客 / 系统",
    secondary: "匿名会话或自动化事件",
    isSystem: true,
    avatarText: "客",
  };
}

/**
 * 操作对象人话呈现器
 */
export function presentAuditTarget(log: {
  action: string;
  targetId?: string | null;
  metadata?: Record<string, any> | null;
}): {
  primary: string;
  secondary: string;
  href?: string;
  isDeleted?: boolean;
} {
  const m = log.metadata || {};

  // 1. 微信支付成功 / 订单退款
  if (log.action === "WECHAT_PAY_SUCCESS" || log.action === "ADMIN_REFUND_ORDER" || log.action === "BILLING_ORDER_PAID") {
    const amountStr = m.amountCents ? `¥${(Number(m.amountCents) / 100).toFixed(2)}` : "";
    const kindMap: Record<string, string> = {
      coin: "杨林金币充值",
      job: "求职招聘置顶发布",
      house: "房产楼市推广",
      listing: "综合便民服务",
      shop: "好店名录入驻",
      mall: "自营零售便利店",
    };
    const kindLabel = kindMap[String(m.targetKind)] || "全站商业订单";
    const orderNo = String(m.orderNo || log.targetId || "未登记单号");

    return {
      primary: `${kindLabel} ${amountStr}`.trim(),
      secondary: `订单号: ${orderNo} ${m.transactionId ? `· 交易号: ...${String(m.transactionId).slice(-8)}` : ""}`,
      href: `/admin/orders?search=${encodeURIComponent(orderNo)}`,
    };
  }

  // 2. 招聘岗位相关
  if (log.action.includes("job")) {
    const title = m.title ? `《${m.title}》` : "";
    const company = m.company ? ` · 企业: ${m.company}` : "";
    const isDeleted = log.action === "delete_job";

    return {
      primary: `招聘职位${title}`,
      secondary: `编号: ${log.targetId || m.id || "未记录"}${company}`,
      isDeleted,
      href: !isDeleted && (log.targetId || m.id) ? `/admin/content?kind=job&search=${encodeURIComponent(m.title || "")}` : undefined,
    };
  }

  // 3. 便民综合信息相关
  if (log.action.includes("listing")) {
    const title = m.title ? `《${m.title}》` : "";
    const category = m.category ? ` · 分类: ${m.category}` : "";
    const isDeleted = log.action.includes("delete");

    return {
      primary: `综合便民信息${title}`,
      secondary: `编号: ${log.targetId || m.id || "未记录"}${category}`,
      isDeleted,
      href: !isDeleted && (log.targetId || m.id) ? `/admin/info?search=${encodeURIComponent(m.title || "")}` : undefined,
    };
  }

  // 4. 用户账号与安全
  if (log.action.includes("user") || log.action === "change_own_password" || log.action === "ADMIN_MANAGE_USER_LOGOUT_ALL") {
    const username = m.username || m.targetUsername || "未知用户";
    return {
      primary: `用户账号《${username}》`,
      secondary: `用户ID: ${log.targetId || "系统登记"}`,
      href: `/admin/users?query=${encodeURIComponent(username)}`,
    };
  }

  // 5. 广告运营
  if (log.action.includes("advertisement") || log.action.includes("ads")) {
    const title = m.title ? `《${m.title}》` : "全站推广展位";
    const isDeleted = log.action.includes("delete");
    return {
      primary: `广告排期${title}`,
      secondary: `展位ID: ${log.targetId || "默认位"}`,
      isDeleted,
      href: "/admin/ads",
    };
  }

  // 6. 社区帖子
  if (log.action.includes("post")) {
    const title = m.title ? `《${m.title}》` : "";
    const isDeleted = log.action.includes("delete");
    return {
      primary: `社区话题${title}`,
      secondary: `帖子ID: ${log.targetId || m.id || "无"}`,
      isDeleted,
      href: !isDeleted ? `/admin/content?kind=post` : undefined,
    };
  }

  // 7. 好店商家
  if (log.action.includes("shop")) {
    const title = m.name || m.title ? `《${m.name || m.title}》` : "";
    return {
      primary: `口碑商家${title}`,
      secondary: `商户ID: ${log.targetId || m.id || "无"}`,
      href: `/admin/content?kind=shop`,
    };
  }

  // 8. 举报工单
  if (log.action.includes("report")) {
    return {
      primary: `违规举报工单 (对象类型: ${m.resourceType || "全站内容"})`,
      secondary: `工单ID: ${log.targetId || "系统派单"} · 资源ID: ${m.resourceId || "未知"}`,
      href: "/admin/reports",
    };
  }

  // 9. 系统配置与字典
  if (log.action.includes("settings") || log.action.includes("dictionary")) {
    if (log.action.includes("dictionary")) {
      const name = m.name || m.code ? `《${m.name || m.code}》` : "";
      return {
        primary: `数据字典${name}`,
        secondary: `编码: ${m.code || log.targetId || "未指定"}`,
        href: "/admin/dictionaries",
      };
    }
    return {
      primary: "全站核心系统参数配置",
      secondary: m.settingsCount ? `本次更新配置项: ${m.settingsCount} 项` : "系统参数治理",
      href: "/admin/settings/site",
    };
  }

  // 10. 微信粉丝同步
  if (log.action === "sync_wechat_followers") {
    return {
      primary: "微信公众号全量粉丝底座",
      secondary: m.totalFollowers ? `当前留存粉丝总量: ${m.totalFollowers} 人` : "微信数据通道",
      href: "/admin/wechat/users",
    };
  }

  // 兜底呈现
  const fallbackName = m.title || m.name || m.orderNo || log.targetId;
  return {
    primary: fallbackName ? `业务对象《${fallbackName}》` : "平台全局基础设施",
    secondary: log.targetId ? `资源ID: ${log.targetId}` : "无特定外部ID",
  };
}

/**
 * 操作来源与 IP 识别呈现器
 */
export function presentAuditSource(log: {
  action: string;
  metadata?: Record<string, any> | null;
  user?: { role?: string } | null;
}): {
  channel: string;
  ip: string;
  requestId?: string;
  userAgent?: string;
} {
  const m = log.metadata || {};
  let channel = "后台管理";

  if (log.action === "WECHAT_PAY_SUCCESS" || log.action.includes("wechat_notify")) {
    channel = "微信支付回调";
  } else if (log.action.startsWith("sync_")) {
    channel = "系统定时任务";
  } else if (log.user?.role === "USER") {
    channel = "用户前台站点";
  } else if (log.action.includes("login") || log.action.includes("password")) {
    channel = "身份认证中心";
  }

  const ip = String(m.ip || m.clientIp || "127.0.0.1 (本地/内网)");
  const requestId = m.requestId ? String(m.requestId) : undefined;
  const userAgent = m.userAgent ? String(m.userAgent) : undefined;

  return { channel, ip, requestId, userAgent };
}

/**
 * 变更前后对比提炼器
 */
export function extractAuditChangeset(metadata?: Record<string, any> | null): Array<{
  field: string;
  before: string;
  after: string;
}> {
  if (!metadata || typeof metadata !== "object") return [];
  const list: Array<{ field: string; before: string; after: string }> = [];

  // 1. 标准 before/after 结构
  if (metadata.before && metadata.after && typeof metadata.before === "object" && typeof metadata.after === "object") {
    const allKeys = Array.from(new Set([...Object.keys(metadata.before), ...Object.keys(metadata.after)]));
    for (const k of allKeys) {
      if (metadata.before[k] !== metadata.after[k]) {
        list.push({
          field: k,
          before: String(metadata.before[k] ?? "空"),
          after: String(metadata.after[k] ?? "空"),
        });
      }
    }
  }

  // 2. 状态流转专用 (previousStatus -> nextStatus / status)
  if (metadata.previousStatus && (metadata.nextStatus || metadata.status)) {
    list.push({
      field: "业务流转状态",
      before: String(metadata.previousStatus),
      after: String(metadata.nextStatus || metadata.status),
    });
  }

  // 3. 属性修改数组 changes: ["passwordHash", "sessionVersion"]
  if (Array.isArray(metadata.changes)) {
    metadata.changes.forEach((ch: string) => {
      list.push({
        field: ch,
        before: "旧属性值",
        after: "已安全更新",
      });
    });
  }

  return list;
}

/**
 * 完整审计条目解析总装器
 */
export function presentAuditLog(log: {
  id: string;
  userId?: string | null;
  action: string;
  targetId?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string | Date;
  user?: {
    id: string;
    username: string;
    role?: string;
    nickname?: string | null;
    phone?: string | null;
  } | null;
}) {
  const def = AUDIT_ACTION_REGISTRY[log.action];

  if (!def) {
    if (typeof console !== "undefined") {
      console.warn(`[AUDIT_PRESENTER] Unrecognized audit action code: "${log.action}" for log id: ${log.id}`);
    }
  }

  const categoryMeta = def ? AUDIT_CATEGORIES[def.category] : AUDIT_CATEGORIES.SYSTEM;
  const actionLabel = def ? def.label : "未知操作";
  const rawActionCode = log.action;
  const isSecurity = def?.isSecurityEvent || false;

  const actor = presentAuditActor(log);
  const target = presentAuditTarget(log);
  const source = presentAuditSource(log);
  const time = formatAuditTime(log.createdAt);
  const changes = extractAuditChangeset(log.metadata);
  const maskedMetadata = maskSensitiveData(log.metadata || {});

  // 结果计算
  let resultLabel = def?.defaultResult || "成功";
  let resultSeverity: "success" | "danger" | "warning" | "info" | "security" = def?.severity || "info";

  if (log.metadata?.status === "REJECTED" || log.action.includes("reject") || log.action === "login_failed") {
    resultLabel = "已驳回 / 失败";
    resultSeverity = "danger";
  } else if (log.action.includes("offline")) {
    resultLabel = "已下架";
    resultSeverity = "warning";
  } else if (log.action.includes("delete")) {
    resultLabel = "已删除";
    resultSeverity = "danger";
  } else if (log.action === "WECHAT_PAY_SUCCESS" || log.action.includes("approved")) {
    resultLabel = "成功完成";
    resultSeverity = "success";
  }

  return {
    id: log.id,
    rawAction: rawActionCode,
    actionLabel,
    category: categoryMeta,
    severity: resultSeverity,
    isSecurity,
    actor,
    target,
    source,
    time,
    result: {
      label: resultLabel,
      severity: resultSeverity,
    },
    changes,
    rawMetadata: maskedMetadata,
  };
}
