import fs from "fs";
import path from "path";

export interface HouseSourceAnalysis {
  filePath: string;
  sourceType: string;
  encoding: string;
  sizeBytes: number;
  totalRecords: number;
  validRecords: number;
  hasImages: boolean;
  hasPhone: boolean;
  sampleRecord?: any;
}

export function inspectHousePayloads() {
  console.log("🔍 正在执行 Stage 1 & Stage 2: 历史房产 (House) 资产只读扫描与数据结构分析...\n");

  const results: HouseSourceAnalysis[] = [];

  // 1. Scan publish_jobs_0723.py for any embedded house records or real estate listings
  const pyPath = "/var/www/iyanglin.com/legacy-assets/input/publish_jobs_0723.py";
  if (fs.existsSync(pyPath)) {
    const content = fs.readFileSync(pyPath, "utf-8");
    const stat = fs.statSync(pyPath);

    // Look for house related publishing calls or strings
    const houseMatches = content.match(/publish\(.*?(房源|出租|二手房|公寓|商铺|厂房|套房|两室|三室).*?\)/gs) || [];

    results.push({
      filePath: pyPath,
      sourceType: "Python Script Payload",
      encoding: "utf-8",
      sizeBytes: stat.size,
      totalRecords: houseMatches.length,
      validRecords: houseMatches.length,
      hasImages: content.includes("http://") || content.includes("https://"),
      hasPhone: /1[3-9]\d{9}/.test(content),
      sampleRecord: houseMatches[0] ? houseMatches[0].slice(0, 150) + "..." : "无特定匹配",
    });
  }

  // 2. Check JSON database backup files
  const backupJsonPath = "/var/backups/iyanglin/job-migration/yanglin_db_before_job_prod_001_1785117709959.json";
  if (fs.existsSync(backupJsonPath)) {
    const content = fs.readFileSync(backupJsonPath, "utf-8");
    const stat = fs.statSync(backupJsonPath);
    const json = JSON.parse(content);

    const houseList = json.House || json.houses || [];

    results.push({
      filePath: backupJsonPath,
      sourceType: "PostgreSQL JSON Snapshot Backup",
      encoding: "utf-8",
      sizeBytes: stat.size,
      totalRecords: houseList.length,
      validRecords: houseList.length,
      hasImages: houseList.some((h: any) => h.images && h.images.length > 0),
      hasPhone: houseList.some((h: any) => h.contact && /1[3-9]\d{9}/.test(h.contact)),
      sampleRecord: houseList[0] || null,
    });
  }

  console.log("=== 第一阶段：历史资产扫描结果 ===");
  results.forEach((r, idx) => {
    console.log(`\n[资产 #${idx + 1}] ${path.basename(r.filePath)}`);
    console.log(`- 绝对路径: ${r.filePath}`);
    console.log(`- 来源类型: ${r.sourceType}`);
    console.log(`- 编码格式: ${r.encoding}`);
    console.log(`- 文件大小: ${(r.sizeBytes / 1024).toFixed(2)} KB`);
    console.log(`- 数据条数: ${r.totalRecords}`);
    console.log(`- 包含图片: ${r.hasImages ? "✅ 是" : "❌ 否"}`);
    console.log(`- 包含联系方式: ${r.hasPhone ? "✅ 是" : "❌ 否"}`);
  });

  console.log("\n--------------------------------------------------");
  return results;
}

if (require.main === module) {
  inspectHousePayloads();
}
