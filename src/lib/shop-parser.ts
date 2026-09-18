export interface ParsedShopBody {
  shopType?: string;
  category?: string;
  address?: string;
  hours?: string;
  services?: string;
  tags?: string;
  verified?: string;
  contact?: string;
  
  // New fields
  status?: string;        // 营业状态: 营业中/休息中/24小时
  wechat?: string;        // 微信
  qq?: string;            // QQ
  promotions?: string;    // 优惠活动
  membership?: string;    // 会员等级
  
  // Multi-line image fields
  shopImages?: string[];  // 门店图片
  caseImages?: string[];  // 案例图片
  
  intro: string;          // 正文介绍
  rawProtocolData?: Record<string, string>; // 保存所有未知旧字段，保证无损
}

export function parseShopBody(rawBody: string | null | undefined): ParsedShopBody {
  if (!rawBody) return { intro: "" };

  const parsed: ParsedShopBody = {
    intro: rawBody,
    rawProtocolData: {},
  };

  const lines = rawBody.split('\n');
  const protocolData: Record<string, string> = {};
  
  let currentKey: string | null = null;
  let currentValue: string[] = [];
  let contentStartIndex = 0;
  
  const isUrl = (str: string) => /^https?:\/\//i.test(str);
  const isMultiLineKey = (key: string) => ["门店图片", "案例图片"].includes(key);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 如果是带括号的键：【XXX】
    const m = line.match(/^【(.*?)】\s*[:：]?\s*(.*)$/);
    if (m) {
      if (currentKey) {
        protocolData[currentKey] = currentValue.join('\n').trim();
      }
      currentKey = m[1].trim();
      currentValue = m[2] ? [m[2].trim()] : [];
      contentStartIndex = i + 1;

      // 如果单行协议的值直接在同一行，立即闭合该 Key
      if (!isMultiLineKey(currentKey) && m[2]) {
        protocolData[currentKey] = currentValue.join('\n').trim();
        currentKey = null;
        currentValue = [];
      }
    } else if (currentKey) {
      if (isMultiLineKey(currentKey)) {
        if (line === "") {
          protocolData[currentKey] = currentValue.join('\n').trim();
          currentKey = null;
          currentValue = [];
          contentStartIndex = i + 1;
        } else if (isUrl(line)) {
          currentValue.push(line);
          contentStartIndex = i + 1;
        } else {
          protocolData[currentKey] = currentValue.join('\n').trim();
          currentKey = null;
          currentValue = [];
          break;
        }
      } else {
        // 单行协议值写在下一行
        if (line !== "") {
          currentValue.push(line);
          contentStartIndex = i + 1;
        }
        protocolData[currentKey] = currentValue.join('\n').trim();
        currentKey = null;
        currentValue = [];
      }
    } else {
      // 没有 currentKey，说明遇到普通正文文本，协议头读取完毕
      if (line !== "") {
        break;
      }
      contentStartIndex = i + 1;
    }
  }

  if (currentKey) {
    protocolData[currentKey] = currentValue.join('\n').trim();
  }

  // 提取剩余的介绍正文
  parsed.intro = lines.slice(contentStartIndex).join('\n').trim();
  parsed.rawProtocolData = protocolData;

  // 映射到具体的属性上
  if (protocolData["商家类型"]) parsed.shopType = protocolData["商家类型"];
  if (protocolData["主营行业"]) parsed.category = protocolData["主营行业"];
  if (protocolData["地址"]) parsed.address = protocolData["地址"];
  if (protocolData["营业时间"]) parsed.hours = protocolData["营业时间"];
  if (protocolData["服务项目"]) parsed.services = protocolData["服务项目"];
  if (protocolData["特色标签"]) parsed.tags = protocolData["特色标签"];
  if (protocolData["认证状态"]) parsed.verified = protocolData["认证状态"];
  if (protocolData["联系方式"]) parsed.contact = protocolData["联系方式"];
  if (protocolData["营业状态"]) parsed.status = protocolData["营业状态"];
  if (protocolData["微信"]) parsed.wechat = protocolData["微信"];
  if (protocolData["QQ"]) parsed.qq = protocolData["QQ"];
  if (protocolData["优惠活动"]) parsed.promotions = protocolData["优惠活动"];
  if (protocolData["会员等级"]) parsed.membership = protocolData["会员等级"];

  // 多行图片解析
  const parseImages = (key: string) => {
    if (!protocolData[key]) return undefined;
    const urls = protocolData[key].split('\n').map(s => s.trim()).filter(s => isUrl(s));
    return Array.from(new Set(urls)); // 去重
  };
  
  const shopImgs = parseImages("门店图片");
  if (shopImgs && shopImgs.length > 0) parsed.shopImages = shopImgs;
  
  const caseImgs = parseImages("案例图片");
  if (caseImgs && caseImgs.length > 0) parsed.caseImages = caseImgs;

  return parsed;
}

export function buildShopBody(data: ParsedShopBody): string {
  const parts: string[] = [];
  
  // 保留原有未知字段
  const knownKeys = ["商家类型", "主营行业", "地址", "营业时间", "服务项目", "特色标签", "认证状态", "联系方式", "营业状态", "微信", "QQ", "优惠活动", "会员等级", "门店图片", "案例图片"];
  const outProtocol: Record<string, string> = { ...(data.rawProtocolData || {}) };

  // 覆盖新字段
  if (data.shopType) outProtocol["商家类型"] = data.shopType;
  if (data.category) outProtocol["主营行业"] = data.category;
  if (data.address) outProtocol["地址"] = data.address;
  if (data.hours) outProtocol["营业时间"] = data.hours;
  if (data.services) outProtocol["服务项目"] = data.services;
  if (data.tags) outProtocol["特色标签"] = data.tags;
  if (data.verified) outProtocol["认证状态"] = data.verified;
  if (data.contact) outProtocol["联系方式"] = data.contact;
  if (data.status) outProtocol["营业状态"] = data.status;
  if (data.wechat) outProtocol["微信"] = data.wechat;
  if (data.qq) outProtocol["QQ"] = data.qq;
  if (data.promotions) outProtocol["优惠活动"] = data.promotions;
  if (data.membership) outProtocol["会员等级"] = data.membership;
  
  if (data.shopImages && data.shopImages.length > 0) outProtocol["门店图片"] = "\n" + data.shopImages.join("\n");
  if (data.caseImages && data.caseImages.length > 0) outProtocol["案例图片"] = "\n" + data.caseImages.join("\n");

  // 生成格式
  for (const [key, value] of Object.entries(outProtocol)) {
    if (value && value.trim() !== "") {
      if (value.startsWith("\n")) {
        // 多行数据
        parts.push(`【${key}】${value}`);
      } else {
        parts.push(`【${key}】${value}`);
      }
    }
  }

  // 添加空行分隔符
  if (parts.length > 0) {
    parts.push("");
  }
  
  parts.push(data.intro || "");
  
  return parts.join("\n").trim();
}
