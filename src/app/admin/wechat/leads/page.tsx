"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface Lead {
  id: string;
  openId: string;
  nickname: string | null;
  source: string;
  keyword: string | null;
  status: string;
  assignedTo: string | null;
  contactInfo: any;
  note: string | null;
  createdAt: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  NEW: { label: "新线索", color: "#f59e0b", bg: "#fef3c7" },
  CONTACTED: { label: "已联系", color: "#3b82f6", bg: "#dbeafe" },
  CONVERTED: { label: "已转化", color: "#10b981", bg: "#d1fae5" },
  INVALID: { label: "无效", color: "#6b7280", bg: "#f3f4f6" },
};

export default function WechatLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/admin/wechat/leads?${params}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setLeads(res.data);
          setTotal(res.pagination.total);
        }
      })
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/admin/wechat/leads", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确认删除该线索？")) return;
    const res = await fetch(`/api/admin/wechat/leads?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) fetchData();
    else alert(data.error);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <AdminLayout title="商业线索">
      <div style={{ padding: "20px", maxWidth: "1200px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1f2937", margin: 0 }}>🎯 商业线索管理</h2>
            <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>用户通过广告相关关键词自动采集的商业线索</p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {[{ v: "", l: "全部" }, { v: "NEW", l: "新线索" }, { v: "CONTACTED", l: "已联系" }, { v: "CONVERTED", l: "已转化" }, { v: "INVALID", l: "无效" }].map((f) => (
              <button
                key={f.v}
                onClick={() => { setStatusFilter(f.v); setPage(1); }}
                style={{
                  padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 500, cursor: "pointer", border: "1px solid #e5e7eb",
                  background: statusFilter === f.v ? "#3b82f6" : "white",
                  color: statusFilter === f.v ? "white" : "#374151",
                }}
              >
                {f.l}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: "#9ca3af", padding: "40px" }}>加载中...</div>
        ) : leads.length === 0 ? (
          <div style={{ textAlign: "center", color: "#9ca3af", padding: "60px", background: "white", borderRadius: "12px" }}>暂无线索</div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, background: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    {["用户", "来源", "触发关键词", "状态", "时间", "操作"].map((h) => (
                      <th key={h} style={{ padding: "12px 14px", fontSize: "12px", fontWeight: 600, color: "#6b7280", textAlign: "left", borderBottom: "1px solid #f0f0f0" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => {
                    const st = STATUS_MAP[lead.status] || STATUS_MAP.NEW;
                    return (
                      <tr key={lead.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ fontSize: "13px", fontWeight: 500, color: "#1f2937" }}>{lead.nickname || "未知"}</div>
                          <div style={{ fontSize: "11px", color: "#9ca3af", fontFamily: "monospace" }}>{lead.openId.slice(0, 16)}...</div>
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: "13px", color: "#6b7280" }}>{lead.source}</td>
                        <td style={{ padding: "12px 14px", fontSize: "13px", color: "#6b7280" }}>{lead.keyword || "—"}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ fontSize: "11px", padding: "2px 10px", borderRadius: "4px", background: st.bg, color: st.color, fontWeight: 500 }}>{st.label}</span>
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: "12px", color: "#6b7280" }}>{new Date(lead.createdAt).toLocaleString("zh-CN")}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ display: "flex", gap: "8px" }}>
                            {lead.status === "NEW" && (
                              <button onClick={() => updateStatus(lead.id, "CONTACTED")} style={{ fontSize: "12px", background: "none", border: "none", color: "#3b82f6", cursor: "pointer" }}>标记已联系</button>
                            )}
                            {lead.status === "CONTACTED" && (
                              <button onClick={() => updateStatus(lead.id, "CONVERTED")} style={{ fontSize: "12px", background: "none", border: "none", color: "#10b981", cursor: "pointer" }}>标记已转化</button>
                            )}
                            {(lead.status === "NEW" || lead.status === "CONTACTED") && (
                              <button onClick={() => updateStatus(lead.id, "INVALID")} style={{ fontSize: "12px", background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}>无效</button>
                            )}
                            <button onClick={() => handleDelete(lead.id)} style={{ fontSize: "12px", background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>删除</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "20px" }}>
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ padding: "6px 14px", borderRadius: "6px", border: "1px solid #e5e7eb", background: "white", cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.5 : 1, fontSize: "12px" }}>上一页</button>
                <span style={{ padding: "6px 14px", fontSize: "13px", color: "#6b7280" }}>{page} / {totalPages}（共{total}条）</span>
                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} style={{ padding: "6px 14px", borderRadius: "6px", border: "1px solid #e5e7eb", background: "white", cursor: page >= totalPages ? "not-allowed" : "pointer", opacity: page >= totalPages ? 0.5 : 1, fontSize: "12px" }}>下一页</button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
