export type ParsedHouseData = {
  // Required core fields
  houseType?: string; // rent | secondhand | newhouse | shop | rent_out | sell_out
  price?: string;
  areaSize?: string;
  layout?: string;
  location?: string;
  
  // Extended fields
  decoration?: string;
  floor?: string;
  facing?: string;
  facilities?: string;
  payment?: string;
  tags?: string;
  contactIdentity?: string;
  contact?: string;

  // Actual description
  description: string;
};

export function parseHouseBody(rawBody: string): ParsedHouseData {
  const result: ParsedHouseData = { description: rawBody };
  
  if (!rawBody) return result;

  // Pattern to match 【Key】Value pairs
  const pattern = /【(.*?)】([^\n【]*)/g;
  let match;
  
  let descStart = -1;
  let hasParsedTags = false;

  while ((match = pattern.exec(rawBody)) !== null) {
    const key = match[1].trim();
    const value = match[2].trim();

    if (key === "类型" || key === "房源类型") result.houseType = value;
    else if (key === "价格" || key === "租金" || key === "售价") result.price = value;
    else if (key === "面积") result.areaSize = value;
    else if (key === "户型") result.layout = value;
    else if (key === "位置" || key === "区域") result.location = value;
    else if (key === "装修") result.decoration = value;
    else if (key === "楼层") result.floor = value;
    else if (key === "朝向") result.facing = value;
    else if (key === "设施") result.facilities = value;
    else if (key === "付款方式") result.payment = value;
    else if (key === "房源标签" || key === "标签") result.tags = value;
    else if (key === "联系人身份") result.contactIdentity = value;
    else if (key === "联系方式") result.contact = value;
    else if (key === "描述" || key === "房源描述") {
      descStart = match.index + match[0].length;
      break;
    }
    
    hasParsedTags = true;
  }

  if (hasParsedTags && descStart !== -1) {
    result.description = rawBody.substring(descStart).trim();
  } else if (hasParsedTags) {
    const lastMatch = [...rawBody.matchAll(pattern)].pop();
    if (lastMatch) {
      result.description = rawBody.substring(lastMatch.index! + lastMatch[0].length).trim();
    }
  }

  return result;
}

export function buildHouseBody(data: Partial<ParsedHouseData>): string {
  let body = "";
  
  if (data.houseType) body += `【房源类型】${data.houseType}\n`;
  if (data.price) body += `【价格】${data.price}\n`;
  if (data.areaSize) body += `【面积】${data.areaSize}\n`;
  if (data.layout) body += `【户型】${data.layout}\n`;
  if (data.location) body += `【位置】${data.location}\n`;
  if (data.decoration) body += `【装修】${data.decoration}\n`;
  if (data.floor) body += `【楼层】${data.floor}\n`;
  if (data.facing) body += `【朝向】${data.facing}\n`;
  if (data.facilities) body += `【设施】${data.facilities}\n`;
  if (data.payment) body += `【付款方式】${data.payment}\n`;
  if (data.tags) body += `【房源标签】${data.tags}\n`;
  if (data.contactIdentity) body += `【联系人身份】${data.contactIdentity}\n`;
  if (data.contact) body += `【联系方式】${data.contact}\n`;
  
  body += `\n【房源描述】\n${data.description || ""}`;
  
  return body.trim();
}
