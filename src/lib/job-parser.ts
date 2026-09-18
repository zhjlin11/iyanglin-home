export type ParsedJobData = {
  type: "job" | "resume";
  jobTitle?: string;
  salary?: string;
  area?: string;
  experience?: string;
  education?: string;
  benefits?: string;
  description: string;
  contact?: string;
  
  // Resume specific
  name?: string;
  age?: string;
  skills?: string;
  intro?: string;
};

export function parseJobBody(rawBody: string): ParsedJobData {
  const result: ParsedJobData = { type: "job", description: rawBody };
  
  if (!rawBody) return result;

  // Pattern to match 【Key】Value pairs
  const pattern = /【(.*?)】([^\n【]*)/g;
  let match;
  
  let descStart = -1;
  let hasParsedType = false;

  while ((match = pattern.exec(rawBody)) !== null) {
    const key = match[1].trim();
    const value = match[2].trim();

    if (key === "类型") {
      result.type = value === "求职" ? "resume" : "job";
      hasParsedType = true;
    } else if (key === "岗位" || key === "求职岗位") result.jobTitle = value;
    else if (key === "薪资" || key === "期望薪资") result.salary = value;
    else if (key === "区域") result.area = value;
    else if (key === "经验") result.experience = value;
    else if (key === "学历") result.education = value;
    else if (key === "福利") result.benefits = value;
    else if (key === "姓名") result.name = value;
    else if (key === "年龄") result.age = value;
    else if (key === "技能") result.skills = value;
    else if (key === "联系方式") result.contact = value;
    else if (key === "描述" || key === "自我介绍") {
      // The rest of the body is description
      descStart = match.index + match[0].length;
      break;
    }
  }

  if (hasParsedType && descStart !== -1) {
    result.description = rawBody.substring(descStart).trim();
  } else if (hasParsedType) {
    // If we parsed tags but didn't explicitly find a 【描述】tag, assume the remainder without tags is description
    const lastMatch = [...rawBody.matchAll(pattern)].pop();
    if (lastMatch) {
      result.description = rawBody.substring(lastMatch.index! + lastMatch[0].length).trim();
    }
  }

  return result;
}

export function buildJobBody(data: Partial<ParsedJobData>): string {
  let body = `【类型】${data.type === "resume" ? "求职" : "招聘"}\n`;
  
  if (data.type === "resume") {
    if (data.name) body += `【姓名】${data.name}\n`;
    if (data.age) body += `【年龄】${data.age}\n`;
    if (data.jobTitle) body += `【求职岗位】${data.jobTitle}\n`;
    if (data.salary) body += `【期望薪资】${data.salary}\n`;
    if (data.experience) body += `【经验】${data.experience}\n`;
    if (data.education) body += `【学历】${data.education}\n`;
    if (data.skills) body += `【技能】${data.skills}\n`;
    if (data.contact) body += `【联系方式】${data.contact}\n`;
    body += `\n【自我介绍】\n${data.description || ""}`;
  } else {
    if (data.jobTitle) body += `【岗位】${data.jobTitle}\n`;
    if (data.salary) body += `【薪资】${data.salary}\n`;
    if (data.area) body += `【区域】${data.area}\n`;
    if (data.experience) body += `【经验】${data.experience}\n`;
    if (data.education) body += `【学历】${data.education}\n`;
    if (data.benefits) body += `【福利】${data.benefits}\n`;
    if (data.contact) body += `【联系方式】${data.contact}\n`;
    body += `\n【描述】\n${data.description || ""}`;
  }
  
  return body.trim();
}
