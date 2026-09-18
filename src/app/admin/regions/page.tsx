"use client";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/admin/DataTable";

type RegionDef = {
  id: string;
  name: string;
  code: string;
  levelName: string;
  parentName: string;
  sort: number;
};

export default function RegionsPage() {
  const regions: RegionDef[] = [
    { id: "1", name: "云南省", code: "530000", levelName: "省级 (L1)", parentName: "中国", sort: 1 },
    { id: "2", name: "昆明市", code: "530100", levelName: "市级 (L2)", parentName: "云南省", sort: 1 },
    { id: "3", name: "嵩明县", code: "530124", levelName: "县级 (L3)", parentName: "昆明市", sort: 1 },
    { id: "4", name: "杨林镇", code: "530124101", levelName: "乡镇/片区 (L4)", parentName: "嵩明县", sort: 1 },
    { id: "5", name: "杨林大学城", code: "530124101001", levelName: "核心片区 (L4)", parentName: "杨林镇", sort: 2 },
    { id: "6", name: "杨林工业园区", code: "530124101002", levelName: "园区片区 (L4)", parentName: "杨林镇", sort: 3 },
  ];

  const columns: Column<RegionDef>[] = [
    {
      key: "name",
      header: "地区名称 / 行政代码",
      render: (r) => (
        <div>
          <div style={{ fontWeight: "bold", color: "#0f172a" }}>{r.name}</div>
          <div style={{ fontSize: "12px", color: "#64748b", fontFamily: "monospace" }}>Code: {r.code}</div>
        </div>
      ),
    },
    {
      key: "levelName",
      header: "层级级别",
      width: "140px",
      render: (r) => <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>{r.levelName}</span>,
    },
    {
      key: "parentName",
      header: "上级行政区划",
      width: "140px",
      render: (r) => <span style={{ fontSize: "13px", color: "#475569" }}>{r.parentName}</span>,
    },
    {
      key: "status",
      header: "状态",
      width: "100px",
      render: () => <StatusBadge status="ACTIVE" customLabel="启用" />,
    },
  ];

  return (
    <AdminLayout
      title="🗺️ 无限层级地区与片区控制中心"
      subtitle="维护云南省 -> 昆明市 -> 嵩明县 -> 杨林镇 -> 大学城/工业园区树形地区库。"
    >
      <DataTable columns={columns} data={regions} keyExtractor={(r) => r.id} />
    </AdminLayout>
  );
}
