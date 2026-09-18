import fs from "fs";
import path from "path";

export function scanDatingAssets() {
  console.log("🔍 正在执行 第一阶段：相亲交友 (Dating / Love / 恋爱) 历史资产深度扫描...\n");

  const searchPaths = [
    "/var/www/iyanglin.com/legacy-assets/input",
    "/var/backups/iyanglin/job-migration",
    "/var/backups/iyanglin/house-migration",
    process.cwd(),
  ];

  const datingFiles: Array<{ path: string; size: number; encoding: string; fileType: string }> = [];

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
            lower.includes("dating") ||
            lower.includes("love") ||
            lower.includes("friend") ||
            lower.includes("xiangqin") ||
            lower.includes("jiaoyou")
          ) {
            const stat = fs.statSync(fullPath);
            datingFiles.push({
              path: fullPath,
              size: stat.size,
              encoding: "utf-8",
              fileType: path.extname(entry.name),
            });
          }
        }
      }
    } catch {
      // Ignore
    }
  }

  searchPaths.forEach((p) => searchDir(p));

  // Also include publish_jobs_0723.py
  const pyPath = "/var/www/iyanglin.com/legacy-assets/input/publish_jobs_0723.py";
  if (fs.existsSync(pyPath)) {
    const stat = fs.statSync(pyPath);
    datingFiles.push({
      path: pyPath,
      size: stat.size,
      encoding: "utf-8",
      fileType: ".py",
    });
  }

  console.log("=== 相亲交友历史资产扫描清单 ===");
  console.log(`- 共找到 ${datingFiles.length} 个相关离线资产文件:`);
  datingFiles.forEach((f, idx) => {
    console.log(`  [${idx + 1}] ${f.path} (${(f.size / 1024).toFixed(2)} KB)`);
  });

  console.log("\n--------------------------------------------------");
  return datingFiles;
}

if (require.main === module) {
  scanDatingAssets();
}
