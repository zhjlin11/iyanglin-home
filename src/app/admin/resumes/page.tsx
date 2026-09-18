"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

type ResumeItem = {
  id: string;
  name: string;
  gender: string;
  birthYear: number;
  education: string;
  experience: string;
  targetJob: string;
  targetSalary: string;
  targetArea: string;
  jobStatus: string;
  skills?: string;
  intro: string;
  phone: string;
  wechat?: string;
  status: string;
  isTop: boolean;
  viewsCount: number;
  createdAt: string;
};

export default function AdminResumesPage() {
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [eduFilter, setEduFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [selectedResume, setSelectedResume] = useState<ResumeItem | null>(null);
  const [message, setMessage] = useState("");

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        keyword,
        status: statusFilter,
        education: eduFilter,
        page: String(page),
        pageSize: "20",
      });
      const res = await fetch(`/api/admin/resumes?${q}`);
      const data = await res.json();
      if (data.resumes) {
        setResumes(data.resumes);
        setTotal(data.total);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchResumes();
  }, [page, statusFilter, eduFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchResumes();
  };

  const toggleTop = async (item: ResumeItem) => {
    const res = await fetch("/api/admin/resumes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, isTop: !item.isTop }),
    });
    if (res.ok) {
      showMsg(item.isTop ? "已取消置顶" : "⭐ 已成功置顶该简历");
      fetchResumes();
    }
  };

  const toggleStatus = async (item: ResumeItem) => {
    const newStatus = item.status === "APPROVED" ? "OFFLINE" : "APPROVED";
    const res = await fetch("/api/admin/resumes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, status: newStatus }),
    });
    if (res.ok) {
      showMsg(newStatus === "APPROVED" ? "✅ 简历已审核上架" : "⏸ 简历已下线");
      fetchResumes();
    }
  };

  const deleteResume = async (id: string) => {
    if (!window.confirm("确定要永久删除该简历档案吗？")) return;
    const res = await fetch("/api/admin/resumes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      showMsg("🗑️ 简历已删除");
      fetchResumes();
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <AdminLayout
      title="👤 人才简历库管理大厅"
      subtitle="集中管理杨林职教园区及全县求职人才档案、技能特长、求职意向与联系方式。"
    >
      {message && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          padding: "12px 20px", borderRadius: "10px", fontSize: "14px", fontWeight: "bold",
          background: message.startsWith("✅") || message.startsWith("⭐") ? "#ecfdf5" : "#fef2f2",
          color: message.startsWith("✅") || message.startsWith("⭐") ? "#065f46" : "#991b1b",
          border: "1px solid #cbd5e1", boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}>
          {message}
        </div>
      )}

      {/* 统计指标 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "1.5rem" }}>
        <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "bold" }}>总人才简历</div>
          <div style={{ fontSize: "1.6rem", fontWeight: "bold", color: "#0f172a" }}>{total}</div>
        </div>
        <div style={{ background: "#ecfdf5", padding: "12px 16px", borderRadius: "10px", border: "1px solid #a7f3d0" }}>
          <div style={{ fontSize: "11px", color: "#065f46", fontWeight: "bold" }}>正常求职中</div>
          <div style={{ fontSize: "1.6rem", fontWeight: "bold", color: "#065f46" }}>
            {resumes.filter((r) => r.status === "APPROVED").length}
          </div>
        </div>
        <div style={{ background: "#fef3c7", padding: "12px 16px", borderRadius: "10px", border: "1px solid #fde68a" }}>
          <div style={{ fontSize: "11px", color: "#92400e", fontWeight: "bold" }}>黄金置顶人才</div>
          <div style={{ fontSize: "1.6rem", fontWeight: "bold", color: "#92400e" }}>
            {resumes.filter((r) => r.isTop).length}
          </div>
        </div>
        <div style={{ background: "#eff6ff", padding: "12px 16px", borderRadius: "10px", border: "1px solid #bfdbfe" }}>
          <div style={{ fontSize: "11px", color: "#1e40af", fontWeight: "bold" }}>大专/本科及以上</div>
          <div style={{ fontSize: "1.6rem", fontWeight: "bold", color: "#1e40af" }}>
            {resumes.filter((r) => r.education === "大专" || r.education === "本科").length}
          </div>
        </div>
      </div>

      {/* 搜索与筛选工具栏 */}
      <div style={{ background: "white", padding: "1rem 1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px", flex: 1, minWidth: "280px" }}>
          <input
            type="text"
            placeholder="搜索人才姓名、期望职位、专业技能、联系电话..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ flex: 1, padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none" }}
          />
          <button type="submit" style={{ padding: "8px 16px", background: "#0B7A75", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}>
            🔍 查询
          </button>
        </form>

        <div style={{ display: "flex", gap: "8px" }}>
          <select value={eduFilter} onChange={(e) => { setEduFilter(e.target.value); setPage(1); }} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}>
            <option value="ALL">全部学历</option>
            <option value="本科">本科</option>
            <option value="大专">大专</option>
            <option value="高中/中专">高中/中专</option>
            <option value="初中及以下">初中及以下</option>
          </select>

          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}>
            <option value="ALL">全部状态</option>
            <option value="APPROVED">已发布</option>
            <option value="OFFLINE">已下线</option>
          </select>
        </div>
      </div>

      {/* 简历数据表格 */}
      <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ width: "100%", overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: "1050px", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: "700" }}>
                <th style={{ padding: "12px 16px" }}>求职人才</th>
                <th style={{ padding: "12px 16px" }}>期望职位</th>
                <th style={{ padding: "12px 16px" }}>期望薪资</th>
                <th style={{ padding: "12px 16px" }}>学历 / 经验</th>
                <th style={{ padding: "12px 16px" }}>求职状态</th>
                <th style={{ padding: "12px 16px" }}>联系电话</th>
                <th style={{ padding: "12px 16px", minWidth: "140px" }}>上传时间</th>
                <th style={{ padding: "12px 16px" }}>状态</th>
                <th style={{ padding: "12px 16px", textAlign: "right", minWidth: "200px" }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>正在检索人才档案...</td>
                </tr>
              ) : resumes.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>未检索到符合条件的人才简历</td>
                </tr>
              ) : (
                resumes.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{
                          width: "34px", height: "34px", borderRadius: "50%",
                          background: r.gender === "female" ? "#fce7f3" : "#dbeafe",
                          color: r.gender === "female" ? "#be185d" : "#1d4ed8",
                          display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "13px",
                          flexShrink: 0,
                        }}>
                          {r.name.slice(0, 1)}
                        </span>
                        <div>
                          <div style={{ fontWeight: "bold", color: "#0f172a", display: "flex", alignItems: "center", gap: "4px" }}>
                            {r.name}
                            {r.isTop && <span style={{ fontSize: "10px", padding: "1px 4px", borderRadius: "3px", background: "#fef3c7", color: "#92400e", fontWeight: "bold" }}>置顶</span>}
                          </div>
                          <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                            {r.gender === "female" ? "女" : "男"} · {currentYear - r.birthYear}岁
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: "bold", color: "#0B7A75" }}>{r.targetJob}</td>
                    <td style={{ padding: "12px 16px", fontWeight: "bold", color: "#b45309" }}>{r.targetSalary}</td>
                    <td style={{ padding: "12px 16px", color: "#475569", whiteSpace: "nowrap" }}>
                      {r.education} · {r.experience}
                    </td>
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold",
                        background: r.jobStatus === "LOOKING" ? "#dcfce7" : "#f1f5f9",
                        color: r.jobStatus === "LOOKING" ? "#15803d" : "#475569",
                      }}>
                        {r.jobStatus === "LOOKING" ? "随时到岗" : r.jobStatus === "OPEN" ? "在职看机会" : "暂不找工作"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace", color: "#334155", whiteSpace: "nowrap" }}>{r.phone}</td>
                    
                    {/* 上传时间列 */}
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <div style={{ color: "#334155", fontSize: "12.5px", fontWeight: "600" }}>
                        {new Date(r.createdAt).toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>

                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold",
                        background: r.status === "APPROVED" ? "#ecfdf5" : "#fee2e2",
                        color: r.status === "APPROVED" ? "#065f46" : "#b91c1c",
                      }}>
                        {r.status === "APPROVED" ? "已发布" : "已下线"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                      <div style={{ display: "inline-flex", gap: "6px", justifyContent: "flex-end" }}>
                        <button onClick={() => setSelectedResume(r)} style={{ padding: "4px 8px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}>
                          👁️ 详情
                        </button>
                        <button onClick={() => toggleTop(r)} style={{ padding: "4px 8px", background: r.isTop ? "#fef3c7" : "white", border: "1px solid #cbd5e1", color: r.isTop ? "#92400e" : "#475569", borderRadius: "6px", fontSize: "11px", cursor: "pointer" }}>
                          {r.isTop ? "降顶" : "置顶"}
                        </button>
                        <button onClick={() => toggleStatus(r)} style={{ padding: "4px 8px", background: "white", border: "1px solid #cbd5e1", color: r.status === "APPROVED" ? "#dc2626" : "#16a34a", borderRadius: "6px", fontSize: "11px", cursor: "pointer" }}>
                          {r.status === "APPROVED" ? "下线" : "上架"}
                        </button>
                        <button onClick={() => deleteResume(r.id)} style={{ padding: "4px 8px", background: "#fee2e2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: "6px", fontSize: "11px", cursor: "pointer" }}>
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 简历详细档案抽屉/模态框 */}
      {selectedResume && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
        }}>
          <div style={{
            background: "white", width: "100%", maxWidth: "600px", borderRadius: "16px",
            padding: "1.75rem", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
            maxHeight: "90vh", overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{
                  width: "48px", height: "48px", borderRadius: "50%",
                  background: selectedResume.gender === "female" ? "#fce7f3" : "#dbeafe",
                  color: selectedResume.gender === "female" ? "#be185d" : "#1d4ed8",
                  display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "18px",
                }}>
                  {selectedResume.name.slice(0, 1)}
                </span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#0f172a" }}>{selectedResume.name} 的求职档案</h3>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    {selectedResume.gender === "female" ? "女性" : "男性"} · {currentYear - selectedResume.birthYear}岁 · {selectedResume.education} · 工作经验: {selectedResume.experience}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedResume(null)} style={{ border: "none", background: "none", fontSize: "20px", cursor: "pointer", color: "#94a3b8" }}>✕</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "1rem", background: "#f8fafc", padding: "12px", borderRadius: "10px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>期望职位</span>
                <strong style={{ fontSize: "14px", color: "#0B7A75" }}>{selectedResume.targetJob}</strong>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>期望薪资</span>
                <strong style={{ fontSize: "14px", color: "#b45309" }}>{selectedResume.targetSalary}</strong>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>期望工作地</span>
                <span style={{ fontSize: "13px", color: "#334155" }}>{selectedResume.targetArea}</span>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>求职状态</span>
                <span style={{ fontSize: "13px", color: "#15803d", fontWeight: "bold" }}>
                  {selectedResume.jobStatus === "LOOKING" ? "离职-随时到岗" : selectedResume.jobStatus === "OPEN" ? "在职-看新机会" : "暂不找工作"}
                </span>
              </div>
              <div style={{ gridColumn: "1 / -1", paddingTop: "6px", borderTop: "1px dashed #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11.5px", color: "#64748b" }}>🕒 简历上传/登记时间</span>
                <span style={{ fontSize: "12.5px", color: "#0f172a", fontWeight: "700", fontFamily: "monospace" }}>
                  {new Date(selectedResume.createdAt).toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>
            </div>

            {selectedResume.skills && (
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ fontSize: "12px", fontWeight: "bold", color: "#475569", marginBottom: "4px" }}>专业技能 / 证书荣誉</div>
                <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", color: "#1e40af" }}>
                  {selectedResume.skills}
                </div>
              </div>
            )}

            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "12px", fontWeight: "bold", color: "#475569", marginBottom: "4px" }}>自我介绍与工作履历</div>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px", borderRadius: "8px", fontSize: "13px", color: "#334155", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                {selectedResume.intro}
              </div>
            </div>

            <div style={{ background: "#fef3c7", border: "1px solid #fde68a", padding: "12px", borderRadius: "8px", marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "11px", color: "#92400e", fontWeight: "bold" }}>📞 联系电话</div>
                <div style={{ fontSize: "15px", fontWeight: "bold", color: "#78350f" }}>{selectedResume.phone}</div>
              </div>
              {selectedResume.wechat && (
                <div>
                  <div style={{ fontSize: "11px", color: "#92400e", fontWeight: "bold" }}>💬 微信</div>
                  <div style={{ fontSize: "14px", fontWeight: "bold", color: "#78350f" }}>{selectedResume.wechat}</div>
                </div>
              )}
            </div>

            <button onClick={() => setSelectedResume(null)} style={{ width: "100%", padding: "10px", background: "#0f172a", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
              关闭档案窗口
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
