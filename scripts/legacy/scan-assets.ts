import fs from "fs";
import path from "path";
import crypto from "crypto";
import { PATHS, ALLOWED_EXTENSIONS } from "./config";
import { AssetFileManifest } from "./types";

function ensureDirs() {
  Object.values(PATHS).forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

function computeSha256(filePath: string): string {
  try {
    const data = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(data).digest("hex");
  } catch (e) {
    return "";
  }
}

function guessModule(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.includes("job")) return "Job (招聘)";
  if (lower.includes("house")) return "House (房产)";
  if (lower.includes("shop") || lower.includes("company") || lower.includes("mall")) return "Shop (商家)";
  if (lower.includes("cat")) return "Category (分类字典)";
  if (lower.includes("news") || lower.includes("article")) return "Article (资讯)";
  if (lower.includes("event") || lower.includes("active")) return "Event (活动)";
  if (lower.includes("love")) return "DatingProfile (相亲)";
  if (lower.includes("post") || lower.includes("tieba")) return "Post (社区)";
  if (lower.includes("user")) return "User (用户)";
  return "General / Mixed Assets";
}

export function scanAllAssets(): AssetFileManifest[] {
  ensureDirs();

  const results: AssetFileManifest[] = [];
  const searchPaths = [
    PATHS.input,
    path.resolve(process.cwd(), ".."), // e:\Code\远程服务器
  ];

  for (const rootPath of searchPaths) {
    if (!fs.existsSync(rootPath)) continue;

    try {
      const files = fs.readdirSync(rootPath);
      for (const file of files) {
        const fullPath = path.join(rootPath, file);
        const stat = fs.statSync(fullPath);
        if (stat.isFile()) {
          const ext = path.extname(file).toLowerCase();
          if (ALLOWED_EXTENSIONS.includes(ext) || file.endsWith(".json") || file.endsWith(".py") || file.endsWith(".sql")) {
            results.push({
              absolutePath: fullPath,
              relativePath: path.relative(process.cwd(), fullPath),
              filename: file,
              extension: ext,
              sizeBytes: stat.size,
              sha256: stat.size < 10 * 1024 * 1024 ? computeSha256(fullPath) : "LARGE_FILE_SKIPPED",
              suspectedModule: guessModule(file),
              isReadable: true,
              evidenceType: rootPath.includes("input") ? "[人工提供副本确认]" : "[历史备份确认]",
            });
          }
        }
      }
    } catch (e) {}
  }

  // Save manifests
  const manifestPath = path.join(PATHS.manifests, "assets-manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(results, null, 2), "utf-8");

  // Save markdown summary
  const mdSummaryPath = path.join(PATHS.reports, "asset-inventory.md");
  const mdContent = `# 老站历史资产离线扫描报告

- 扫描文件总数：**${results.length}**
- 扫描时间：**${new Date().toLocaleString("zh-CN")}**

| 文件名 | 大小 (KB) | 猜想模块 | 证据类型 |
|---|---|---|---|
${results.map((r) => `| \`${r.filename}\` | ${(r.sizeBytes / 1024).toFixed(1)} KB | ${r.suspectedModule} | ${r.evidenceType} |`).join("\n")}
`;

  fs.writeFileSync(mdSummaryPath, mdContent, "utf-8");
  console.log(`✅ 资产扫描完成，生成 ${results.length} 个文件记录，已存至 ${mdSummaryPath}`);

  return results;
}

if (require.main === module) {
  scanAllAssets();
}
