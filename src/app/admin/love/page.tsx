"use client";

import { useEffect, useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

type DatingGuest = {
  id: string;
  kind: "love";
  gender: string; // female | male
  nickname: string;
  birthYear: number;
  heightCm: number;
  education: string;
  occupation: string;
  income: string;
  maritalStatus: string;
  location: string;
  requirement: string;
  intro: string;
  contact: string;
  status: string;
  viewsCount: number;
  createdAt: string;
  photos: string[];
  oldId?: string | null;
};

const formatOccupationDisplay = (occ: any) => {
  if (!occ || occ === "0" || occ === 0 || String(occ).includes("代码 0") || String(occ).includes("代码0")) return "企事业单位/教育";
  if (occ === "1" || occ === 1 || String(occ).includes("代码 1") || String(occ).includes("代码1")) return "经开区企业/技术";
  if (occ === "2" || occ === 2 || String(occ).includes("代码 2") || String(occ).includes("代码2")) return "医疗卫生/健康";
  if (occ === "3" || occ === 3 || String(occ).includes("代码 3") || String(occ).includes("代码3")) return "IT/互联网/电商";
  if (occ === "4" || occ === 4 || String(occ).includes("代码 4") || String(occ).includes("代码4")) return "金融/财会/管理";
  if (occ === "5" || occ === 5 || String(occ).includes("代码 5") || String(occ).includes("代码5")) return "个体经商/创业";
  return String(occ).replace(/职业代码\s*\d+/g, "企事业单位/技术");
};

const formatMaritalDisplay = (status: any) => {
  if (!status || status === "0" || status === 0 || String(status).includes("状态 0") || String(status).includes("状态0")) return "未婚单身";
  if (status === "1" || status === 1 || String(status).includes("状态 1") || String(status).includes("状态1")) return "离异单身";
  if (status === "2" || status === 2 || String(status).includes("状态 2") || String(status).includes("状态2")) return "丧偶单身";
  return String(status).replace(/情感状态\s*\d+/g, "未婚单身");
};

export default function AdminLovePage() {
  const [guests, setGuests] = useState<DatingGuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState<"ALL" | "female" | "male">("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [selectedGuest, setSelectedGuest] = useState<DatingGuest | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const loadGuests = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/love?status=ALL");
      if (!res.ok) throw new Error("加载嘉宾数据失败");
      const data = await res.json();
      setGuests(data.items || []);
    } catch {
      setError("相亲嘉宾数据加载失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGuests();
  }, []);

  const stats = useMemo(() => {
    const total = guests.length;
    const females = guests.filter((g) => g.gender === "female").length;
    const males = guests.filter((g) => g.gender === "male").length;
    const approved = guests.filter((g) => g.status === "approved").length;
    return { total, females, males, approved };
  }, [guests]);

  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      const matchesGender = genderFilter === "ALL" || g.gender === genderFilter;
      const matchesStatus = statusFilter === "ALL" || g.status.toLowerCase() === statusFilter.toLowerCase();
      const q = query.toLowerCase().trim();
      const matchesQuery =
        !q ||
        g.nickname.toLowerCase().includes(q) ||
        g.occupation.toLowerCase().includes(q) ||
        g.location.toLowerCase().includes(q) ||
        g.contact.includes(q) ||
        (g.oldId && g.oldId.includes(q));

      return matchesGender && matchesStatus && matchesQuery;
    });
  }, [guests, genderFilter, statusFilter, query]);

  const totalPages = Math.ceil(filteredGuests.length / pageSize) || 1;
  const pagedGuests = filteredGuests.slice((page - 1) * pageSize, page * pageSize);

  const toggleStatus = async (guest: DatingGuest) => {
    const nextStatus = guest.status === "approved" ? "offline" : "approved";
    try {
      const res = await fetch("/api/love", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: guest.id, status: nextStatus }),
      });
      if (res.ok) {
        showMsg(nextStatus === "approved" ? "✅ 嘉宾已审核上架" : "⏸ 嘉宾已下线");
        loadGuests();
      } else {
        setError("操作失败");
      }
    } catch {
      setError("网络请求异常");
    }
  };

  const deleteGuest = async (id: string) => {
    if (!window.confirm("确定要永久删除该相亲嘉宾档案吗？")) return;
    try {
      const res = await fetch("/api/content", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        showMsg("🗑️ 嘉宾档案已删除");
        loadGuests();
      }
    } catch {
      setError("删除失败");
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <AdminLayout
      title="💖 相亲交友与征婚嘉宾管理大厅"
      subtitle="集中审核、管理与展示杨林及嵩明本地单身相亲嘉宾档案、写真相册、择偶标准与私密牵线联系方式。"
    >
      {/* 消息提示 */}
      {message && (
        <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "12px 18px", borderRadius: "10px", marginBottom: "1.25rem", fontWeight: "700" }}>
          {message}
        </div>
      )}
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "12px 18px", borderRadius: "10px", marginBottom: "1.25rem", fontWeight: "700" }}>
          ⚠️ {error}
        </div>
      )}

      {/* 4 大相亲数据指标卡 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ background: "white", borderRadius: "14px", padding: "1.25rem", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: "12.5px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>💖 全部相亲嘉宾</div>
          <div style={{ fontSize: "26px", fontWeight: "900", color: "#0f172a" }}>{stats.total} 位</div>
          <div style={{ fontSize: "11.5px", color: "#10b981", marginTop: "4px" }}>老站导入与新站登记</div>
        </div>

        <div style={{ background: "white", borderRadius: "14px", padding: "1.25rem", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: "12.5px", color: "#be185d", fontWeight: "600", marginBottom: "4px" }}>🌸 优质女嘉宾</div>
          <div style={{ fontSize: "26px", fontWeight: "900", color: "#db2777" }}>{stats.females} 位</div>
          <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "4px" }}>占比 {Math.round((stats.females / (stats.total || 1)) * 100)}%</div>
        </div>

        <div style={{ background: "white", borderRadius: "14px", padding: "1.25rem", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: "12.5px", color: "#1d4ed8", fontWeight: "600", marginBottom: "4px" }}>💼 青年男嘉宾</div>
          <div style={{ fontSize: "26px", fontWeight: "900", color: "#2563eb" }}>{stats.males} 位</div>
          <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "4px" }}>占比 {Math.round((stats.males / (stats.total || 1)) * 100)}%</div>
        </div>

        <div style={{ background: "white", borderRadius: "14px", padding: "1.25rem", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: "12.5px", color: "#15803d", fontWeight: "600", marginBottom: "4px" }}>🟢 正常展示征婚</div>
          <div style={{ fontSize: "26px", fontWeight: "900", color: "#16a34a" }}>{stats.approved} 位</div>
          <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "4px" }}>前台可浏览与牵线</div>
        </div>
      </div>

      {/* 筛选与搜索工具栏 */}
      <div
        style={{
          background: "white",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          padding: "1rem 1.25rem",
          marginBottom: "1.25rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        {/* 性别切换 Tab */}
        <div style={{ display: "inline-flex", background: "#f1f5f9", padding: "4px", borderRadius: "10px", gap: "4px" }}>
          <button
            onClick={() => { setGenderFilter("ALL"); setPage(1); }}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              border: "none",
              background: genderFilter === "ALL" ? "white" : "transparent",
              color: genderFilter === "ALL" ? "#0f172a" : "#64748b",
              fontWeight: genderFilter === "ALL" ? "800" : "600",
              boxShadow: genderFilter === "ALL" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            全部 ({stats.total})
          </button>
          <button
            onClick={() => { setGenderFilter("female"); setPage(1); }}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              border: "none",
              background: genderFilter === "female" ? "white" : "transparent",
              color: genderFilter === "female" ? "#db2777" : "#64748b",
              fontWeight: genderFilter === "female" ? "800" : "600",
              boxShadow: genderFilter === "female" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            🌸 女嘉宾 ({stats.females})
          </button>
          <button
            onClick={() => { setGenderFilter("male"); setPage(1); }}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              border: "none",
              background: genderFilter === "male" ? "white" : "transparent",
              color: genderFilter === "male" ? "#2563eb" : "#64748b",
              fontWeight: genderFilter === "male" ? "800" : "600",
              boxShadow: genderFilter === "male" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            💼 男嘉宾 ({stats.males})
          </button>
        </div>

        {/* 搜索与状态下拉 */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", flex: 1, justifyContent: "flex-end", minWidth: "280px" }}>
          <input
            type="text"
            placeholder="🔍 搜索嘉宾姓名 / 职业 / 常住地 / 电话..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "13px",
              outline: "none",
              minWidth: "240px",
              flex: 1,
              maxWidth: "340px",
              background: "#f8fafc",
            }}
          />

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "13px",
              background: "white",
              outline: "none",
            }}
          >
            <option value="ALL">全部状态</option>
            <option value="approved">已发布上架</option>
            <option value="offline">已下线</option>
            <option value="pending">待审核</option>
          </select>
        </div>
      </div>

      {/* 相亲嘉宾专业数据大表格 */}
      <div style={{ background: "white", borderRadius: "14px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div style={{ width: "100%", overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: "1280px", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: "700" }}>
                <th style={{ padding: "14px 18px", minWidth: "220px", whiteSpace: "nowrap" }}>相亲嘉宾</th>
                <th style={{ padding: "14px 18px", minWidth: "120px", whiteSpace: "nowrap" }}>身高 / 学历</th>
                <th style={{ padding: "14px 18px", minWidth: "180px", whiteSpace: "nowrap" }}>职业行业 / 月薪</th>
                <th style={{ padding: "14px 18px", minWidth: "160px", whiteSpace: "nowrap" }}>婚姻 / 常住地</th>
                <th style={{ padding: "14px 18px", minWidth: "130px", whiteSpace: "nowrap" }}>写真相册</th>
                <th style={{ padding: "14px 18px", minWidth: "140px", whiteSpace: "nowrap" }}>联系方式</th>
                <th style={{ padding: "14px 18px", minWidth: "150px", whiteSpace: "nowrap" }}>上传/登记时间</th>
                <th style={{ padding: "14px 18px", minWidth: "100px", whiteSpace: "nowrap" }}>状态</th>
                <th style={{ padding: "14px 18px", textAlign: "right", minWidth: "180px", whiteSpace: "nowrap" }}>管理操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ padding: "4rem", textAlign: "center", color: "#64748b" }}>
                    ⏳ 正在加载相亲嘉宾档案...
                  </td>
                </tr>
              ) : pagedGuests.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: "4rem", textAlign: "center", color: "#94a3b8" }}>
                    🔍 未检索到匹配的相亲嘉宾档案
                  </td>
                </tr>
              ) : (
                pagedGuests.map((g) => {
                  const isFemale = g.gender === "female";
                  const age = currentYear - (g.birthYear || 1995);
                  const occName = formatOccupationDisplay(g.occupation);
                  const maritalName = formatMaritalDisplay(g.maritalStatus);
                  const isApproved = g.status === "approved";
                  const firstPhoto = g.photos && g.photos.length > 0 ? g.photos[0] : null;

                  return (
                    <tr
                      key={g.id}
                      style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "white"; }}
                    >
                      {/* 嘉宾档案 */}
                      <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {firstPhoto ? (
                            <img
                              src={firstPhoto}
                              alt={g.nickname}
                              style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", border: `2px solid ${isFemale ? "#fbcfe8" : "#bfdbfe"}`, flexShrink: 0 }}
                              onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                background: isFemale ? "linear-gradient(135deg, #ec4899 0%, #be185d 100%)" : "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                                color: "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: "800",
                                fontSize: "15px",
                                flexShrink: 0,
                              }}
                            >
                              {g.nickname.slice(0, 1)}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: "800", color: "#0f172a", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                              <span>{g.nickname}</span>
                              <span style={{ fontSize: "11px", padding: "1px 6px", borderRadius: "10px", background: isFemale ? "#fdf2f8" : "#eff6ff", color: isFemale ? "#db2777" : "#2563eb", fontWeight: "700" }}>
                                {isFemale ? "女" : "男"} · {age}岁
                              </span>
                            </div>
                            <div style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: "2px" }}>
                              ID: #{g.oldId ? g.oldId.replace("LEGACY_DATING_", "") : g.id.slice(-6)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 身高 / 学历 */}
                      <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: "700", color: "#334155" }}>{g.heightCm || 165} cm</div>
                        <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>{g.education && g.education !== "未填写" ? g.education : "专科/本科"}</div>
                      </td>

                      {/* 职业 / 月薪 */}
                      <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: "700", color: "#0B7A75", fontSize: "13px" }}>{occName}</div>
                        <div style={{ fontSize: "11.5px", color: "#b45309", fontWeight: "600", marginTop: "2px" }}>{g.income && g.income !== "未填写" ? g.income : "5000-8000元/月"}</div>
                      </td>

                      {/* 婚姻 / 常住地 */}
                      <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: "700", color: "#334155" }}>{maritalName}</div>
                        <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>{g.location || "杨林本地"}</div>
                      </td>

                      {/* 写真相册 */}
                      <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                        {g.photos && g.photos.length > 0 ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 9px", borderRadius: "6px", background: "#fdf2f8", color: "#be185d", fontSize: "12px", fontWeight: "700", border: "1px solid #fbcfe8" }}>
                            <span>📸</span>
                            <span>{g.photos.length} 张写真</span>
                          </span>
                        ) : (
                          <span style={{ fontSize: "12px", color: "#94a3b8" }}>暂无照片</span>
                        )}
                      </td>

                      {/* 联系方式 */}
                      <td style={{ padding: "14px 18px", fontFamily: "monospace", color: "#334155", whiteSpace: "nowrap" }}>
                        {g.contact ? g.contact : "红娘牵线"}
                      </td>

                      {/* 上传/登记时间 */}
                      <td style={{ padding: "14px 18px", color: "#64748b", fontSize: "12.5px", whiteSpace: "nowrap" }}>
                        {new Date(g.createdAt).toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </td>

                      {/* 状态 */}
                      <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            padding: "3px 9px",
                            borderRadius: "14px",
                            fontSize: "12px",
                            fontWeight: "700",
                            background: isApproved ? "#ecfdf5" : "#fef2f2",
                            color: isApproved ? "#15803d" : "#b91c1c",
                            border: `1px solid ${isApproved ? "#bbf7d0" : "#fecaca"}`,
                          }}
                        >
                          {isApproved ? "已发布" : "已下线"}
                        </span>
                      </td>

                      {/* 操作 */}
                      <td style={{ padding: "14px 18px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <div style={{ display: "inline-flex", gap: "6px", justifyContent: "flex-end" }}>
                          <button
                            onClick={() => setSelectedGuest(g)}
                            style={{ padding: "5px 10px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                          >
                            👁️ 详情
                          </button>
                          <button
                            onClick={() => toggleStatus(g)}
                            style={{
                              padding: "5px 10px",
                              background: isApproved ? "#fffbeb" : "#f0fdf4",
                              border: `1px solid ${isApproved ? "#fde68a" : "#bbf7d0"}`,
                              color: isApproved ? "#b45309" : "#15803d",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer",
                            }}
                          >
                            {isApproved ? "下线" : "上架"}
                          </button>
                          <button
                            onClick={() => deleteGuest(g.id)}
                            style={{ padding: "5px 10px", background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 底部标准分页器 */}
        {totalPages > 1 && (
          <div style={{ padding: "14px 20px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", flexWrap: "wrap", gap: "12px" }}>
            <span style={{ fontSize: "13px", color: "#64748b" }}>
              共 <b>{filteredGuests.length}</b> 位相亲嘉宾 · 第 <b>{page}</b> / {totalPages} 页
            </span>

            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: "5px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: page <= 1 ? "#f1f5f9" : "white",
                  color: page <= 1 ? "#94a3b8" : "#334155",
                  fontSize: "12.5px",
                  fontWeight: "700",
                  cursor: page <= 1 ? "not-allowed" : "pointer",
                }}
              >
                ← 上一页
              </button>

              <span style={{ fontSize: "13px", fontWeight: "800", color: "#0B7A75", padding: "0 8px" }}>
                {page}
              </span>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: "5px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: page >= totalPages ? "#f1f5f9" : "white",
                  color: page >= totalPages ? "#94a3b8" : "#334155",
                  fontSize: "12.5px",
                  fontWeight: "700",
                  cursor: page >= totalPages ? "not-allowed" : "pointer",
                }}
              >
                下一页 →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 嘉宾详细档案模态框 */}
      {selectedGuest && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "white", width: "100%", maxWidth: "620px", borderRadius: "16px", padding: "1.75rem", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>{selectedGuest.nickname}</span>
                  <span style={{ fontSize: "12px", padding: "2px 8px", borderRadius: "10px", background: selectedGuest.gender === "female" ? "#fdf2f8" : "#eff6ff", color: selectedGuest.gender === "female" ? "#db2777" : "#2563eb" }}>
                    {selectedGuest.gender === "female" ? "女嘉宾" : "男嘉宾"} · {currentYear - (selectedGuest.birthYear || 1995)}岁
                  </span>
                </h3>
                <span style={{ fontSize: "12px", color: "#64748b", marginTop: "2px", display: "block" }}>
                  身高: {selectedGuest.heightCm}cm · 学历: {selectedGuest.education} · 婚姻: {formatMaritalDisplay(selectedGuest.maritalStatus)} · 常住地: {selectedGuest.location}
                </span>
              </div>
              <button onClick={() => setSelectedGuest(null)} style={{ border: "none", background: "none", fontSize: "20px", cursor: "pointer", color: "#94a3b8" }}>✕</button>
            </div>

            {/* 写真相册预览 */}
            {selectedGuest.photos && selectedGuest.photos.length > 0 && (
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>📸 嘉宾生活写真 ({selectedGuest.photos.length} 张)</div>
                <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "6px" }}>
                  {selectedGuest.photos.map((p, i) => (
                    <img
                      key={i}
                      src={p}
                      alt="写真"
                      style={{ width: "90px", height: "120px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                      onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "1rem", background: "#f8fafc", padding: "12px", borderRadius: "10px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>职业行业</span>
                <strong style={{ fontSize: "14px", color: "#0B7A75" }}>{formatOccupationDisplay(selectedGuest.occupation)}</strong>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>月薪收入</span>
                <strong style={{ fontSize: "14px", color: "#b45309" }}>{selectedGuest.income && selectedGuest.income !== "未填写" ? selectedGuest.income : "5000-8000元/月"}</strong>
              </div>
              <div style={{ gridColumn: "1 / -1", paddingTop: "6px", borderTop: "1px dashed #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11.5px", color: "#64748b" }}>🕒 档案上传/登记时间</span>
                <span style={{ fontSize: "12.5px", color: "#0f172a", fontWeight: "700", fontFamily: "monospace" }}>
                  {new Date(selectedGuest.createdAt).toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>🎯 择偶要求</div>
              <div style={{ background: "#fef3c7", border: "1px solid #fde68a", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", color: "#92400e", lineHeight: "1.6" }}>
                {selectedGuest.requirement || "暂无特殊要求，三观相合即可。"}
              </div>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>💬 个人自我介绍</div>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", color: "#334155", lineHeight: "1.6" }}>
                {selectedGuest.intro || "暂无自我介绍。"}
              </div>
            </div>

            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px 16px", borderRadius: "10px", marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "11px", color: "#166534", fontWeight: "700" }}>📞 私密联系方式（仅管理员与牵线可见）</div>
                <div style={{ fontSize: "15px", fontWeight: "800", color: "#14532d", marginTop: "2px" }}>{selectedGuest.contact}</div>
              </div>
            </div>

            <button onClick={() => setSelectedGuest(null)} style={{ width: "100%", padding: "10px", background: "#0f172a", color: "white", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "13.5px" }}>
              关闭档案窗口
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
