import { prisma } from "./prisma";

export interface InfoAreaItem {
  name: string;
  slug: string;
  sort: number;
  enabled: boolean;
}

export const DEFAULT_INFO_AREAS: InfoAreaItem[] = [
  { name: "杨林经开区", slug: "jingkaiqu", sort: 1, enabled: true },
  { name: "杨林大学城", slug: "daxuecheng", sort: 2, enabled: true },
  { name: "杨林老镇", slug: "laozhen", sort: 3, enabled: true },
  { name: "嵩明主城区", slug: "songming", sort: 4, enabled: true },
  { name: "长水机场周边", slug: "jichang", sort: 5, enabled: true },
  { name: "其他区域", slug: "other", sort: 6, enabled: true },
];

/**
 * 获取启用的区域列表 (优先从数据库 Region 读取，如果未录入则使用默认片区)
 */
export async function getEnabledInfoAreas(): Promise<InfoAreaItem[]> {
  try {
    const dbRegions = await prisma.region.findMany({
      where: { enabled: true },
      orderBy: { sort: "asc" },
    });

    if (dbRegions && dbRegions.length > 0) {
      // 提取乡镇与片区级区域 (level >= 3 或包含杨林/嵩明)
      const relevant = dbRegions.filter(
        (r) => r.level >= 3 || r.name.includes("杨林") || r.name.includes("嵩明")
      );
      if (relevant.length > 0) {
        return relevant.map((r, idx) => ({
          name: r.name,
          slug: r.code || `area-${idx}`,
          sort: r.sort || idx,
          enabled: r.enabled,
        }));
      }
    }
  } catch (err) {
    console.error("[getEnabledInfoAreas Error]:", err);
  }

  return DEFAULT_INFO_AREAS;
}

/**
 * 区域名称快速规范化
 */
export function normalizeAreaName(areaName?: string | null): string {
  if (!areaName || !areaName.trim()) return "杨林经开区";
  const a = areaName.trim();
  if (a.includes("大学城")) return "杨林大学城";
  if (a.includes("经开") || a.includes("工业园")) return "杨林经开区";
  if (a.includes("老镇") || a.includes("杨林镇") || a.includes("老街")) return "杨林老镇";
  if (a.includes("嵩明") || a.includes("县城")) return "嵩明主城区";
  if (a.includes("机场") || a.includes("长水")) return "长水机场周边";
  return a;
}
