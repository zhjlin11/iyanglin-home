import { ParsedJobRecord } from "./inspect-jobs";

export interface NormalizedJob {
  oldId: string;
  title: string;
  company: string;
  body: string;
  salary: string;
  area: string;
  jobType: string;
  status: "APPROVED" | "PENDING";
  maskedPhone: string;
  rawPhone: string;
}

export function normalizeJobRecord(raw: ParsedJobRecord): NormalizedJob {
  let salary = "面议";
  if (raw.description.includes("4000-6000")) salary = "4000-6000元/月";
  else if (raw.description.includes("3500-4000")) salary = "3500-4000元/月";
  else if (raw.description.includes("3000-4000")) salary = "3000-4000元/月";
  else if (raw.description.includes("5500-8000")) salary = "5500-8000元/月";
  else if (raw.description.includes("6000-7000")) salary = "6000-7000元/月";

  let area = "杨林工业园区";
  if (raw.companyName.includes("大学城") || raw.description.includes("大学城")) {
    area = "杨林大学城";
  } else if (raw.companyName.includes("经开区")) {
    area = "杨林经开区";
  }

  const rawPhone = raw.phone ? raw.phone.trim() : "";
  const maskedPhone = rawPhone ? rawPhone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2") : "";

  let cleanDesc = raw.description || "";
  cleanDesc = cleanDesc
    .replace(/【联系电话】[：:]\s*(暂无电话|无|未提供)?/g, "")
    .replace(/1[3-9]\d{9}/g, "")
    .trim();

  let body = `【岗位】${raw.jobTitle}\n【公司】${raw.companyName}`;
  if (rawPhone && rawPhone.length >= 11) {
    body += `\n【联系方式】${rawPhone}`;
  }
  body += `\n\n【描述】\n${cleanDesc}`;

  return {
    oldId: `LEGACY_JOB_0723_${raw.index}`,
    title: raw.jobTitle,
    company: raw.companyName,
    body,
    salary,
    area,
    jobType: "fulltime",
    status: "APPROVED",
    maskedPhone,
    rawPhone,
  };
}
