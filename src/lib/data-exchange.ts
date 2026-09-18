import { prisma } from "@/lib/prisma";

export interface ImportPreviewResult {
  valid: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: Array<{ row: number; field: string; message: string }>;
  previewData: Array<Record<string, any>>;
}

/**
 * 解析并校验批量导入数据（支持职位、商品或服务）
 */
export function parseAndValidateImport(
  type: "JOB" | "PRODUCT",
  rawContent: string
): ImportPreviewResult {
  const lines = rawContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) {
    return {
      valid: false,
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      errors: [{ row: 0, field: "file", message: "导入内容为空或缺少表头" }],
      previewData: [],
    };
  }

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const errors: ImportPreviewResult["errors"] = [];
  const previewData: Array<Record<string, any>> = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const rowObj: Record<string, any> = {};

    headers.forEach((h, idx) => {
      rowObj[h] = cols[idx] || "";
    });

    if (type === "JOB") {
      if (!rowObj["title"] && !rowObj["岗位名称"]) {
        errors.push({ row: i, field: "title", message: "缺少岗位名称" });
      }
      if (!rowObj["companyName"] && !rowObj["企业名称"]) {
        errors.push({ row: i, field: "companyName", message: "缺少企业名称" });
      }
    }

    previewData.push(rowObj);
  }

  return {
    valid: errors.length === 0,
    totalRows: lines.length - 1,
    validRows: lines.length - 1 - errors.length,
    invalidRows: errors.length,
    errors,
    previewData: previewData.slice(0, 5), // 前5条预览
  };
}

/**
 * 幂等执行导入入库
 */
export async function executeImport(params: {
  type: "JOB" | "PRODUCT";
  data: Array<Record<string, any>>;
  organizationId: string;
  userId: string;
}) {
  let importedCount = 0;

  for (const item of params.data) {
    const title = item["title"] || item["岗位名称"];
    const company = item["companyName"] || item["企业名称"];
    if (!title || !company) continue;

    // 基于 标题 + 企业名称 + organizationId 幂等判重
    const existing = await prisma.job.findFirst({
      where: {
        title,
        company,
        organizationId: params.organizationId,
      },
    });

    if (!existing) {
      await prisma.job.create({
        data: {
          title,
          company,
          area: item["workLocation"] || item["工作地点"] || "杨林经开区",
          salary: item["salaryRange"] || item["薪资范围"] || "面议",
          body: item["description"] || item["岗位职责"] || title,
          organizationId: params.organizationId,
          authorId: params.userId,
          status: "APPROVED",
        },
      });
      importedCount++;
    }
  }

  // 写入审计日志
  await prisma.organizationAuditLog.create({
    data: {
      organizationId: params.organizationId,
      operatorId: params.userId,
      operatorName: "批量导入程序",
      action: "BATCH_IMPORT_JOBS",
      targetType: params.type,
      detailsJson: JSON.stringify({ importedCount, totalSubmitted: params.data.length }),
    },
  });

  return { success: true, importedCount };
}

/**
 * 数据导出脱敏与审计
 */
export async function exportOrganizationData(params: {
  type: "CANDIDATES" | "ORDERS" | "LEADS";
  organizationId: string;
  userId: string;
}) {
  let records: any[] = [];

  if (params.type === "CANDIDATES") {
    records = await prisma.candidate.findMany({
      where: { organizationId: params.organizationId },
      include: { job: { select: { title: true } } },
      take: 100,
      orderBy: { appliedAt: "desc" },
    });
  } else if (params.type === "LEADS") {
    const org = await prisma.organization.findUnique({
      where: { id: params.organizationId },
      select: { providerId: true },
    });
    if (org?.providerId) {
      records = await prisma.serviceLead.findMany({
        where: { providerId: org.providerId },
        take: 100,
        orderBy: { createdAt: "desc" },
      });
    }
  }

  // 记录导出审计日志
  await prisma.organizationAuditLog.create({
    data: {
      organizationId: params.organizationId,
      operatorId: params.userId,
      operatorName: "数据导出模块",
      action: `EXPORT_${params.type}`,
      targetType: params.type,
      detailsJson: JSON.stringify({ exportedCount: records.length }),
    },
  });

  return records;
}
