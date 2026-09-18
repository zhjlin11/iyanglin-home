import fs from "fs";

export function inspectHouseSource() {
  console.log("🔍 正在详细解析老站房产 (House) 离线历史资产数据...\n");

  const backupPath = "/home/ubuntu/server/backups/backup-2026-04-07.json";
  if (fs.existsSync(backupPath)) {
    const raw = fs.readFileSync(backupPath, "utf-8");
    const json = JSON.parse(raw);
    console.log(`- 找到备份 JSON 文件: ${backupPath}`);
    console.log(`- 包含的主要键名:`, Object.keys(json));
    if (json.data) {
      console.log(`- data 对象中的子键名:`, Object.keys(json.data));
      if (json.data.houses) {
        console.log(`- json.data.houses 记录数:`, json.data.houses.length);
        if (json.data.houses.length > 0) {
          console.log("\n【样本房产记录 #1 结构分析】");
          console.log(JSON.stringify(json.data.houses[0], null, 2));
        }
      }
      if (json.data.house) {
        console.log(`- json.data.house 记录数:`, json.data.house.length);
      }
      if (json.data.listings) {
        const houses = json.data.listings.filter((l: any) => l.kind === "house" || l.category === "house" || l.type === "house");
        console.log(`- json.data.listings 中过滤出的房产记录数:`, houses.length);
        if (houses.length > 0) {
          console.log("\n【样本房产记录 #1 结构分析】");
          console.log(JSON.stringify(houses[0], null, 2));
        }
      }
    }
  }
}

if (require.main === module) {
  inspectHouseSource();
}
