/**
 * 招聘企业主数据治理通用工具类
 * 包含：核心品牌词清洗、资料完整度诊断、疑似重复企业算法、异常状态检测
 */

export interface CompletenessResult {
  score: number;
  level: "COMPLETE" | "INCOMPLETE" | "SEVERE";
  levelText: string;
  missingFields: string[];
}

export function getCoreBrand(name: string): string {
  if (!name) return "";
  return name
    .replace(/（[^）]*）|\([^)]*\)/g, "")
    .replace(/云南省?|昆明市?|嵩明县?|杨林经开区?|经济技术开发区?|官渡区?|盘龙区?|五华区?|西山区?/g, "")
    .replace(/有限责任公司|股份有限公司|有限公司|企业管理有限公司|商贸有限公司|发展有限公司|实业有限公司|经营部|厂/g, "")
    .trim();
}

/**
 * 计算企业资料完整度 (0-100%)
 */
export function computeCompleteness(comp: {
  name?: string | null;
  logo?: string | null;
  industry?: string | null;
  companySize?: string | null;
  companyType?: string | null;
  address?: string | null;
  description?: string | null;
  contactPhone?: string | null;
  contactName?: string | null;
  creditCode?: string | null;
  businessLicenseImage?: string | null;
}): CompletenessResult {
  const checks: { label: string; ok: boolean; weight: number }[] = [
    { label: "企业全称", ok: !!comp.name?.trim(), weight: 10 },
    { label: "企业Logo", ok: !!comp.logo?.trim(), weight: 10 },
    { label: "所属行业", ok: !!comp.industry?.trim(), weight: 10 },
    { label: "人员规模", ok: !!comp.companySize?.trim(), weight: 10 },
    { label: "企业性质", ok: !!comp.companyType?.trim(), weight: 10 },
    { label: "办公地址", ok: !!comp.address?.trim(), weight: 10 },
    { label: "企业简介", ok: !!comp.description && comp.description.trim().length >= 10, weight: 10 },
    { label: "联系人/电话", ok: !!(comp.contactPhone?.trim() || comp.contactName?.trim()), weight: 10 },
    { label: "统一信用代码", ok: !!comp.creditCode && comp.creditCode.trim().length >= 10, weight: 10 },
    { label: "营业执照图片", ok: !!comp.businessLicenseImage?.trim(), weight: 10 },
  ];

  let score = 0;
  const missingFields: string[] = [];

  for (const c of checks) {
    if (c.ok) {
      score += c.weight;
    } else {
      missingFields.push(c.label);
    }
  }

  let level: "COMPLETE" | "INCOMPLETE" | "SEVERE" = "SEVERE";
  let levelText = "严重缺失";

  if (score >= 80) {
    level = "COMPLETE";
    levelText = "资料完整";
  } else if (score >= 40) {
    level = "INCOMPLETE";
    levelText = "待完善";
  }

  return { score, level, levelText, missingFields };
}

export interface DuplicateInfo {
  candidateId: string;
  candidateName: string;
  reason: string;
}

/**
 * 批量检测企业列表中的疑似重复主体
 */
export function detectCompanyDuplicates(
  companies: Array<{
    id: string;
    name: string;
    creditCode?: string | null;
    contactPhone?: string | null;
    address?: string | null;
  }>
): Map<string, DuplicateInfo> {
  const result = new Map<string, DuplicateInfo>();

  // 1. 同统一社会信用代码检测
  const creditMap = new Map<string, (typeof companies)[0]>();
  for (const c of companies) {
    if (c.creditCode && c.creditCode.trim().length >= 10) {
      const code = c.creditCode.trim();
      if (creditMap.has(code)) {
        const prev = creditMap.get(code)!;
        result.set(c.id, { candidateId: prev.id, candidateName: prev.name, reason: "相同统一信用代码" });
        result.set(prev.id, { candidateId: c.id, candidateName: c.name, reason: "相同统一信用代码" });
      } else {
        creditMap.set(code, c);
      }
    }
  }

  // 2. 核心品牌词匹配与包含检测
  const items = companies.map((c) => ({
    comp: c,
    core: getCoreBrand(c.name),
  }));

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];
      if (a.comp.id === b.comp.id) continue;

      let isSuspected = false;
      let reason = "";

      if (a.core.length >= 2 && a.core === b.core) {
        isSuspected = true;
        reason = `核心简称相同[${a.core}]`;
      } else if (a.core.length >= 3 && b.core.length >= 3) {
        if (a.core.includes(b.core) || b.core.includes(a.core)) {
          isSuspected = true;
          reason = `简称包含关系[${a.core} <-> ${b.core}]`;
        }
      }

      if (isSuspected) {
        if (!result.has(a.comp.id)) {
          result.set(a.comp.id, { candidateId: b.comp.id, candidateName: b.comp.name, reason });
        }
        if (!result.has(b.comp.id)) {
          result.set(b.comp.id, { candidateId: a.comp.id, candidateName: a.comp.name, reason });
        }
      }
    }
  }

  return result;
}

/**
 * 诊断企业异常状态
 */
export function diagnoseCompanyIssues(comp: {
  isVerified: boolean;
  verificationStatus: string;
  businessLicenseImage?: string | null;
  isFeaturedEmployer: boolean;
  jobCount?: number;
  status: string;
  hasActiveJobs?: boolean;
}): string[] {
  const issues: string[] = [];

  if (comp.verificationStatus === "VERIFIED" && !comp.businessLicenseImage) {
    issues.push("已认证但无营业执照原件");
  }

  if (comp.isFeaturedEmployer && (comp.jobCount === 0 || comp.hasActiveJobs === false)) {
    issues.push("推荐企业当前无在招职位");
  }

  if (comp.status === "DISABLED" && (comp.jobCount || 0) > 0) {
    issues.push("企业已停用但存在关联职位");
  }

  return issues;
}
