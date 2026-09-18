export interface ParsedActivityBody {
  activityType?: string;      // 活动类型: outdoor | sport | party | lecture | etc.
  startTime?: string;         // 开始时间 (ISO 8601)
  endTime?: string;           // 结束时间 (ISO 8601)
  deadline?: string;          // 报名截止时间 (ISO 8601)
  quota?: string;             // 人数上限
  signupStatus?: string;      // 报名状态: 报名中 | 即将满员 | 已满员 | 已截止
  location?: string;          // 举办地点
  assemblyPoint?: string;     // 集合地点
  feeType?: string;           // 活动费用: 免费 | AA制 | 收费
  feeDetail?: string;         // 费用说明
  phone?: string;             // 联系电话
  wechat?: string;            // 微信
  organizer?: string;         // 组织者名称
  organizerType?: string;     // 主办方类型: 个人发起 | 官方组织 | 商业机构 | 校园社团
  suitableFor?: string;       // 适合人群
  agenda?: string;            // 活动流程
  notes?: string;             // 注意事项
  tags?: string;              // 活动标签
  coverImage?: string;        // 封面图
  signupMethod?: string;      // 报名方式: 在线报名 | 电话报名 | 微信联系 | 外部链接
  externalLink?: string;      // 外部报名链接
  eventStatus?: string;       // 活动状态: 正常 | 已完成 | 已取消
  badge?: string;             // 推荐标识: 官方推荐 | 热门活动 | 首页置顶
  
  // Multi-line image fields
  activityImages?: string[];  // 活动图片列表

  intro: string;              // 活动详细介绍正文
  rawProtocolData?: Record<string, string>; // 未知旧字段原样保存
}

export function parseActivityBody(rawBody: string | null | undefined): ParsedActivityBody {
  if (!rawBody) return { intro: "" };

  const parsed: ParsedActivityBody = {
    intro: rawBody,
    rawProtocolData: {},
  };

  const lines = rawBody.split("\n");
  const protocolData: Record<string, string> = {};

  let currentKey: string | null = null;
  let currentValue: string[] = [];
  let contentStartIndex = 0;

  const isUrl = (str: string) => /^https?:\/\//i.test(str);
  const isMultiLineKey = (key: string) => key === "活动图片";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    const m = line.match(/^【(.*?)】\s*[:：]?\s*(.*)$/);
    if (m) {
      if (currentKey) {
        protocolData[currentKey] = currentValue.join("\n").trim();
      }
      currentKey = m[1].trim();
      currentValue = m[2] ? [m[2].trim()] : [];
      contentStartIndex = i + 1;

      if (!isMultiLineKey(currentKey) && m[2]) {
        protocolData[currentKey] = currentValue.join("\n").trim();
        currentKey = null;
        currentValue = [];
      }
    } else if (currentKey) {
      if (isMultiLineKey(currentKey)) {
        if (line === "") {
          protocolData[currentKey] = currentValue.join("\n").trim();
          currentKey = null;
          currentValue = [];
          contentStartIndex = i + 1;
        } else if (isUrl(line)) {
          currentValue.push(line);
          contentStartIndex = i + 1;
        } else {
          protocolData[currentKey] = currentValue.join("\n").trim();
          currentKey = null;
          currentValue = [];
          break;
        }
      } else {
        if (line !== "") {
          currentValue.push(line);
          contentStartIndex = i + 1;
        }
        protocolData[currentKey] = currentValue.join("\n").trim();
        currentKey = null;
        currentValue = [];
      }
    } else {
      if (line !== "") {
        break;
      }
      contentStartIndex = i + 1;
    }
  }

  if (currentKey) {
    protocolData[currentKey] = currentValue.join("\n").trim();
  }

  parsed.intro = lines.slice(contentStartIndex).join("\n").trim();
  parsed.rawProtocolData = protocolData;

  // Key Mappings
  if (protocolData["活动类型"]) parsed.activityType = protocolData["活动类型"];
  if (protocolData["开始时间"]) parsed.startTime = protocolData["开始时间"];
  if (protocolData["结束时间"]) parsed.endTime = protocolData["结束时间"];
  if (protocolData["报名截止"]) parsed.deadline = protocolData["报名截止"];
  if (protocolData["人数上限"]) parsed.quota = protocolData["人数上限"];
  if (protocolData["报名状态"]) parsed.signupStatus = protocolData["报名状态"];
  if (protocolData["举办地点"]) parsed.location = protocolData["举办地点"];
  if (protocolData["集合地点"]) parsed.assemblyPoint = protocolData["集合地点"];
  if (protocolData["活动费用"]) parsed.feeType = protocolData["活动费用"];
  if (protocolData["费用说明"]) parsed.feeDetail = protocolData["费用说明"];
  if (protocolData["联系电话"]) parsed.phone = protocolData["联系电话"];
  if (protocolData["微信"]) parsed.wechat = protocolData["微信"];
  if (protocolData["组织者"]) parsed.organizer = protocolData["组织者"];
  if (protocolData["主办方类型"]) parsed.organizerType = protocolData["主办方类型"];
  if (protocolData["适合人群"]) parsed.suitableFor = protocolData["适合人群"];
  if (protocolData["活动流程"]) parsed.agenda = protocolData["活动流程"];
  if (protocolData["注意事项"]) parsed.notes = protocolData["注意事项"];
  if (protocolData["活动标签"]) parsed.tags = protocolData["活动标签"];
  if (protocolData["封面图"]) parsed.coverImage = protocolData["封面图"];
  if (protocolData["报名方式"]) parsed.signupMethod = protocolData["报名方式"];
  if (protocolData["外部报名链接"]) parsed.externalLink = protocolData["外部报名链接"];
  if (protocolData["活动状态"]) parsed.eventStatus = protocolData["活动状态"];
  if (protocolData["推荐标识"]) parsed.badge = protocolData["推荐标识"];

  if (protocolData["活动图片"]) {
    const urls = protocolData["活动图片"].split("\n").map(s => s.trim()).filter(s => isUrl(s));
    if (urls.length > 0) {
      parsed.activityImages = Array.from(new Set(urls));
    }
  }

  return parsed;
}

export function buildActivityBody(data: ParsedActivityBody): string {
  const parts: string[] = [];
  const outProtocol: Record<string, string> = { ...(data.rawProtocolData || {}) };

  if (data.activityType) outProtocol["活动类型"] = data.activityType;
  if (data.startTime) outProtocol["开始时间"] = data.startTime;
  if (data.endTime) outProtocol["结束时间"] = data.endTime;
  if (data.deadline) outProtocol["报名截止"] = data.deadline;
  if (data.quota) outProtocol["人数上限"] = data.quota;
  if (data.signupStatus) outProtocol["报名状态"] = data.signupStatus;
  if (data.location) outProtocol["举办地点"] = data.location;
  if (data.assemblyPoint) outProtocol["集合地点"] = data.assemblyPoint;
  if (data.feeType) outProtocol["活动费用"] = data.feeType;
  if (data.feeDetail) outProtocol["费用说明"] = data.feeDetail;
  if (data.phone) outProtocol["联系电话"] = data.phone;
  if (data.wechat) outProtocol["微信"] = data.wechat;
  if (data.organizer) outProtocol["组织者"] = data.organizer;
  if (data.organizerType) outProtocol["主办方类型"] = data.organizerType;
  if (data.suitableFor) outProtocol["适合人群"] = data.suitableFor;
  if (data.agenda) outProtocol["活动流程"] = data.agenda;
  if (data.notes) outProtocol["注意事项"] = data.notes;
  if (data.tags) outProtocol["活动标签"] = data.tags;
  if (data.coverImage) outProtocol["封面图"] = data.coverImage;
  if (data.signupMethod) outProtocol["报名方式"] = data.signupMethod;
  if (data.externalLink) outProtocol["外部报名链接"] = data.externalLink;
  if (data.eventStatus) outProtocol["活动状态"] = data.eventStatus;
  if (data.badge) outProtocol["推荐标识"] = data.badge;

  if (data.activityImages && data.activityImages.length > 0) {
    outProtocol["活动图片"] = "\n" + data.activityImages.join("\n");
  }

  for (const [key, value] of Object.entries(outProtocol)) {
    if (value && value.trim() !== "") {
      parts.push(`【${key}】${value}`);
    }
  }

  if (parts.length > 0) {
    parts.push("");
  }

  parts.push(data.intro || "");

  return parts.join("\n").trim();
}

function parseDateSafe(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

export function formatActivityDateTime(startTimeStr?: string, endTimeStr?: string): string {
  const start = parseDateSafe(startTimeStr);
  if (!start) return startTimeStr || "时间见正文";

  const end = parseDateSafe(endTimeStr);
  
  const year = start.getFullYear();
  const month = start.getMonth() + 1;
  const day = start.getDate();
  const hours = String(start.getHours()).padStart(2, "0");
  const minutes = String(start.getMinutes()).padStart(2, "0");

  if (!end) {
    return `${year}年${month}月${day}日 ${hours}:${minutes}`;
  }

  const endYear = end.getFullYear();
  const endMonth = end.getMonth() + 1;
  const endDay = end.getDate();
  const endHours = String(end.getHours()).padStart(2, "0");
  const endMinutes = String(end.getMinutes()).padStart(2, "0");

  const isSameDay = year === endYear && month === endMonth && day === endDay;

  if (isSameDay) {
    return `${year}年${month}月${day}日 ${hours}:${minutes}–${endHours}:${endMinutes}`;
  } else {
    return `${year}年${month}月${day}日 ${hours}:${minutes} 至 ${endMonth}月${endDay}日 ${endHours}:${endMinutes}`;
  }
}

export function formatActivityDateRange(startTimeStr?: string, endTimeStr?: string): string {
  const start = parseDateSafe(startTimeStr);
  if (!start) return startTimeStr || "待定";

  const month = start.getMonth() + 1;
  const day = start.getDate();
  const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const week = weekDays[start.getDay()];
  const hours = String(start.getHours()).padStart(2, "0");
  const minutes = String(start.getMinutes()).padStart(2, "0");

  return `${month}月${day}日 ${week} ${hours}:${minutes}`;
}

export function formatSignupDeadline(deadlineStr?: string): string {
  const deadline = parseDateSafe(deadlineStr);
  if (!deadline) return "";

  const year = deadline.getFullYear();
  const month = deadline.getMonth() + 1;
  const day = deadline.getDate();
  const hours = String(deadline.getHours()).padStart(2, "0");
  const minutes = String(deadline.getMinutes()).padStart(2, "0");

  return `${year}年${month}月${day}日 ${hours}:${minutes}`;
}

export function formatActivityLocation(area?: string, venue?: string): { listText: string; areaText: string; venueText: string } {
  const cleanArea = (area || "").trim();
  let cleanVenue = (venue || "").trim();

  if (!cleanVenue) {
    return {
      listText: cleanArea || "杨林地区",
      areaText: cleanArea || "杨林地区",
      venueText: "场地见正文",
    };
  }

  if (cleanArea && cleanVenue.startsWith(cleanArea)) {
    cleanVenue = cleanVenue.slice(cleanArea.length).trim();
  }

  const listText = cleanArea && cleanVenue ? `${cleanArea} · ${cleanVenue}` : cleanVenue || cleanArea || "杨林地区";

  return {
    listText,
    areaText: cleanArea || "杨林地区",
    venueText: cleanVenue || "场地见正文",
  };
}

export function calculateEventStatus(
  startTimeStr?: string,
  endTimeStr?: string,
  deadlineStr?: string,
  currentCount: number = 0,
  quotaStr?: string,
  eventStatusOverride?: string
) {
  const now = new Date();

  if (eventStatusOverride === "已取消") {
    return { statusText: "已取消", badgeColor: "#64748b", canSignup: false, reason: "该活动已被取消" };
  }

  const start = parseDateSafe(startTimeStr);
  const end = parseDateSafe(endTimeStr);
  const deadline = parseDateSafe(deadlineStr);

  if (end && now > end) {
    return { statusText: "已结束", badgeColor: "#94a3b8", canSignup: false, reason: "活动已结束" };
  }
  if (!end && start) {
    const defaultEnd = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    if (now > defaultEnd) {
      return { statusText: "已结束", badgeColor: "#94a3b8", canSignup: false, reason: "活动已结束" };
    }
  }

  if (deadline && now > deadline) {
    return { statusText: "已截止", badgeColor: "#ef4444", canSignup: false, reason: "报名时间已截止" };
  }

  let quota = 0;
  if (quotaStr) {
    const num = parseInt(quotaStr.replace(/\D/g, ""), 10);
    if (!isNaN(num) && num > 0) quota = num;
  }

  if (quota > 0 && currentCount >= quota) {
    return { statusText: "已满员", badgeColor: "#f59e0b", canSignup: false, reason: "报名人数已满员" };
  }

  if (quota > 0 && currentCount >= quota * 0.8) {
    return { statusText: "即将满员", badgeColor: "#f97316", canSignup: true, reason: "" };
  }

  if (start && now >= start && (!end || now <= end)) {
    return { statusText: "活动进行中", badgeColor: "#10b981", canSignup: true, reason: "" };
  }

  // Dynamic countdown text for upcoming events
  let statusText = "报名中";
  if (start && now < start) {
    const diffMs = start.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      statusText = "即将开始";
    } else if (diffHours < 24) {
      statusText = "今天开始";
    } else if (diffDays === 1) {
      statusText = "明天开始";
    } else {
      statusText = `距开始还有 ${diffDays} 天`;
    }
  }

  return { statusText, badgeColor: "#0b7a75", canSignup: true, reason: "" };
}
