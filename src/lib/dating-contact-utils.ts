/**
 * 相亲交友联系方式安全判定与脱敏工具
 */

export type DatingContactType = "PHONE" | "WECHAT" | "MATCHMAKER";

export interface DatingContactInfo {
  type: DatingContactType;
  label: string;
  maskedDisplay: string;
  isFakeOrEmpty: boolean;
  hint: string;
}

const FAKE_PHONE_PATTERNS = [
  /^13800000000$/,
  /^13100000000$/,
  /^13123456789$/,
  /^13888888888$/,
  /^13999999999$/,
  /^15912345682$/,
  /^13000000000$/,
  /^15000000000$/,
  /^18000000000$/,
];

export function parseDatingContact(rawContact?: string | null): DatingContactInfo {
  const contact = (rawContact || "").trim();

  // 1. 空或缺省
  if (!contact || contact === "同城面议" || contact === "联系红娘" || contact === "暂无" || contact === "无") {
    return {
      type: "MATCHMAKER",
      label: "官方红娘专线",
      maskedDisplay: "💌 红娘一对一专属代牵线",
      isFakeOrEmpty: true,
      hint: "该嘉宾已委托平台红娘统一代为牵线，由红娘协助双方破冰沟通并互换微信。",
    };
  }

  // 2. 判断是否为老站假手机号/测试号
  const isFakePhone = FAKE_PHONE_PATTERNS.some((reg) => reg.test(contact));
  if (isFakePhone) {
    return {
      type: "MATCHMAKER",
      label: "官方红娘专线",
      maskedDisplay: "💌 红娘一对一专属代牵线",
      isFakeOrEmpty: true,
      hint: "该嘉宾未公开私人手机号，由平台专属红娘代为牵线沟通与转达心意。",
    };
  }

  // 3. 真实有效的 11 位中国大陆手机号
  const isRealPhone = /^1[3-9]\d{9}$/.test(contact);
  if (isRealPhone) {
    const masked = contact.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
    return {
      type: "PHONE",
      label: "真实手机号",
      maskedDisplay: masked,
      isFakeOrEmpty: false,
      hint: "已通过平台实名认证，联系信息已加密保护，登录或申请后安全调取。",
    };
  }

  // 4. 微信号/QQ号/字母混合字符
  if (/^[a-zA-Z0-9_-]{5,30}$/.test(contact) || contact.length >= 4) {
    return {
      type: "WECHAT",
      label: "嘉宾微信号",
      maskedDisplay: "微信已安全加密（申请后互换）",
      isFakeOrEmpty: false,
      hint: "为防骚扰，嘉宾微信号通过平台红娘与系统安全鉴权调取。",
    };
  }

  // 5. 兜底
  return {
    type: "MATCHMAKER",
    label: "官方红娘专线",
    maskedDisplay: "💌 红娘一对一专属代牵线",
    isFakeOrEmpty: true,
    hint: "由平台专属红娘代为牵线沟通与转达心意。",
  };
}
