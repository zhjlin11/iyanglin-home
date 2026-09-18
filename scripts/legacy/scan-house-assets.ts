import fs from "fs";
import path from "path";

export function scanHouseAssets() {
  console.log("🔍 正在扫描服务器上的所有历史房产楼市 (House) 相关资产...\n");

  const searchPaths = [
    "/var/www",
    "/root",
    "/home/ubuntu",
    "/tmp",
    "/var/backups",
    process.cwd(),
  ];

  const houseFiles: Array<{ path: string; size: number; encoding: string; fileType: string }> = [];

  function searchDir(dir: string, depth = 0) {
    if (depth > 4 || !fs.existsSync(dir)) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!["node_modules", ".git", ".next"].includes(entry.name)) {
            searchDir(fullPath, depth + 1);
          }
        } else if (entry.isFile()) {
          const lower = entry.name.toLowerCase();
          if (
            lower.includes("house") ||
            lower.includes("fang") ||
            lower.includes("cats9") ||
            lower.includes("publish_house")
          ) {
            const stat = fs.statSync(fullPath);
            houseFiles.push({
              path: fullPath,
              size: stat.size,
              encoding: "utf-8",
              fileType: path.extname(entry.name),
            });
          }
        }
      }
    } catch {
      // Ignore permission or missing directory errors
    }
  }

  searchPaths.forEach((p) => searchDir(p));

  console.log("=== 历史房产资产扫描清单 ===");
  console.log(`- 共找到 ${houseFiles.length} 个潜在相关历史文件:`);
  houseFiles.forEach((f, idx) => {
    console.log(`  [${idx + 1}] ${f.path} (${(f.size / 1024).toFixed(2)} KB)`);
  });
  console.log("--------------------------------------------------");
  return houseFiles;
}

if (require.main === module) {
  scanHouseAssets();
}
