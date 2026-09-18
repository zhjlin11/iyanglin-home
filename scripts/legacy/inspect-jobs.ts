import fs from "fs";
import path from "path";

export interface ParsedJobRecord {
  index: number;
  companyName: string;
  jobTitle: string;
  description: string;
  phone: string;
  address: string;
  cat1: number;
  cat2: number;
  salaryId: number;
  educationId: number;
  experienceId: number;
  welfares?: string;
  sourceSection: string;
}

export function parseJobsFromScript(): { jobs: ParsedJobRecord[]; rawCount: number; successCount: number } {
  const possiblePaths = [
    path.resolve(process.cwd(), "legacy-assets", "input", "publish_jobs_0723.py"),
    path.resolve(process.cwd(), "publish_jobs_0723.py"),
    path.resolve(process.cwd(), "..", "publish_jobs_0723.py"),
  ];

  let pyPath = "";
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      pyPath = p;
      break;
    }
  }

  if (!pyPath) {
    throw new Error(`无法找到招聘数据源文件 publish_jobs_0723.py (已搜索: ${possiblePaths.join(", ")})`);
  }

  const content = fs.readFileSync(pyPath, "utf-8");
  const jobs: ParsedJobRecord[] = [];

  // Parse company -> phone map from get_or_create("CompanyName", "137XXXXXXXX", ...)
  const companyPhoneMap: Record<string, string> = {};
  const getOrCreateRegex = /get_or_create\s*\(\s*"([^"]+)"\s*,\s*"([^"]+)"/g;
  let gcMatch;
  while ((gcMatch = getOrCreateRegex.exec(content)) !== null) {
    const cname = gcMatch[1].trim();
    const phone = gcMatch[2].trim();
    if (phone.match(/^1[3-9]\d{9}$/)) {
      companyPhoneMap[cname] = phone;
    }
  }

  const publishRegex = /publish\s*\(\s*cid\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([\s\S]*?)"\s*,\s*(\d+)\s*,\s*(\d+)/g;

  let index = 1;
  let match;

  while ((match = publishRegex.exec(content)) !== null) {
    const companyName = match[1].trim();
    const jobTitle = match[2].trim();
    const description = match[3].replace(/\\n/g, "\n").trim();
    const cat1 = parseInt(match[4], 10);
    const cat2 = parseInt(match[5], 10);

    const descPhoneMatch = description.match(/1[3-9]\d{9}/);
    const phone = descPhoneMatch ? descPhoneMatch[0] : (companyPhoneMap[companyName] || "");

    jobs.push({
      index: index++,
      companyName,
      jobTitle,
      description,
      phone,
      address: "杨林地区",
      cat1,
      cat2,
      salaryId: 3339,
      educationId: 0,
      experienceId: 0,
      sourceSection: path.basename(pyPath),
    });
  }

  return {
    jobs,
    rawCount: jobs.length,
    successCount: jobs.length,
  };
}

if (require.main === module) {
  const result = parseJobsFromScript();
  const phoneCount = result.jobs.filter((j) => !!j.phone).length;
  console.log(`✅ 招聘数据静态解析完成: 精确解析 ${result.successCount} 条岗位记录，其中包含有效手机号 ${phoneCount} 条！`);
}
