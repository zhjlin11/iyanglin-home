"use client";

import { useEffect, useState, useMemo } from "react";
import Navbar from "@/components/Navbar";

type PhoneEntry = {
  id: string;
  name: string;
  phone: string;
  address?: string;
  description?: string;
  isHot: boolean;
};

type PhoneCategory = {
  id: string;
  name: string;
  icon?: string;
  phones: PhoneEntry[];
};

export default function BianminPage() {
  const [categories, setCategories] = useState<PhoneCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/bianmin")
      .then((r) => r.json())
      .then((data) => {
        setCategories(data.categories || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const allPhones = useMemo(() => {
    return categories.flatMap((cat) =>
      cat.phones.map((p) => ({ ...p, categoryName: cat.name, categoryIcon: cat.icon }))
    );
  }, [categories]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allPhones.filter((p) => {
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q) ||
        (p.address || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        (p.categoryName || "").toLowerCase().includes(q);
      const matchCategory =
        activeCategory === "all" ||
        categories.find((c) => c.id === activeCategory)?.phones.some((ph) => ph.id === p.id);
      return matchSearch && matchCategory;
    });
  }, [allPhones, categories, search, activeCategory]);

  const hotPhones = useMemo(() => allPhones.filter((p) => p.isHot), [allPhones]);

  const handleCopy = (phone: string, id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickKeywords = ["报警", "消防", "救护车", "杨林派出所", "供电", "卫生院", "顺丰", "自来水", "公交"];

  return (
    <div className="support-page bianmin-channel" style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <Navbar />

      {/* 顶部现代化高奢民生 Hero 大横幅 */}
      <section
        style={{
          background: "linear-gradient(135deg, #064e3b 0%, #0d9488 50%, #0284c7 100%)",
          color: "white",
          padding: "3rem 1rem 3.5rem 1rem",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 4px 25px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ maxWidth: "860px", margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.18)", padding: "4px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "bold", backdropFilter: "blur(10px)", marginBottom: "1rem", border: "1px solid rgba(255,255,255,0.3)" }}>
            <span>📞</span> 嵩明·杨林便民服务数字化黄页 · 已收录 {allPhones.length} 个本地热线
          </div>

          <h1 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: "800", margin: "0 0 0.75rem 0", letterSpacing: "0.5px" }}>
            杨林便民电话百事通
          </h1>
          <p style={{ fontSize: "14.5px", opacity: 0.95, margin: "0 0 1.75rem 0", lineHeight: "1.6" }}>
            一键直拨本地急救报警、政务大厅、水电维修、快递外卖与教育医疗便民热线
          </p>

          {/* 拟态高对比度搜索框 */}
          <div
            style={{
              background: "white",
              padding: "6px 8px 6px 16px",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
              maxWidth: "560px",
              margin: "0 auto",
            }}
          >
            <span style={{ fontSize: "18px" }}>🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索单位名称、服务热线或所在片区..."
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "14.5px",
                color: "#0f172a",
                background: "transparent",
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{ background: "#f1f5f9", border: "none", width: "24px", height: "24px", borderRadius: "50%", cursor: "pointer", color: "#64748b", fontSize: "12px" }}
              >
                ✕
              </button>
            )}
            <button
              style={{
                padding: "9px 20px",
                background: "#047857",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontWeight: "bold",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              查找
            </button>
          </div>

          {/* 快捷热搜关键词 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", flexWrap: "wrap", marginTop: "1rem", fontSize: "12px" }}>
            <span style={{ opacity: 0.85 }}>🔥 热门速查:</span>
            {quickKeywords.map((kw) => (
              <button
                key={kw}
                onClick={() => setSearch(kw)}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "white",
                  padding: "2px 10px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontSize: "12px",
                  backdropFilter: "blur(5px)",
                }}
              >
                {kw}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 主体内容容器 */}
      <main style={{ maxWidth: "1280px", margin: "-1.5rem auto 4rem auto", padding: "0 1rem", position: "relative", zIndex: 2 }}>
        {/* 分类快捷筛选胶囊 */}
        <div
          style={{
            background: "white",
            padding: "1rem 1.25rem",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
            marginBottom: "1.5rem",
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          <button
            onClick={() => setActiveCategory("all")}
            style={{
              padding: "8px 18px",
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: activeCategory === "all" ? "bold" : "500",
              background: activeCategory === "all" ? "#047857" : "#f8fafc",
              color: activeCategory === "all" ? "white" : "#475569",
              border: activeCategory === "all" ? "none" : "1px solid #e2e8f0",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
          >
            🌟 全部热线 ({allPhones.length})
          </button>
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "12px",
                  fontSize: "13px",
                  fontWeight: isActive ? "bold" : "500",
                  background: isActive ? "#047857" : "#f8fafc",
                  color: isActive ? "white" : "#475569",
                  border: isActive ? "none" : "1px solid #e2e8f0",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s",
                }}
              >
                <span>{cat.icon || "📞"}</span>
                <span>{cat.name}</span>
                <span style={{ fontSize: "11px", opacity: isActive ? 0.9 : 0.6 }}>({cat.phones.length})</span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={{ padding: "5rem 1rem", textAlign: "center", color: "#64748b" }}>
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>⏳</div>
            <div style={{ fontWeight: "bold" }}>正在载入杨林便民热线数据...</div>
          </div>
        ) : categories.length === 0 ? (
          <div style={{ background: "white", padding: "4rem 1.5rem", borderRadius: "16px", border: "1px solid #e2e8f0", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>📞</div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: "0 0 0.5rem 0", color: "#0f172a" }}>便民热线整理中</h3>
            <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>管理员正在更新最新便民联系方式，敬请期待。</p>
          </div>
        ) : (
          <>
            {/* 常用高频紧急与便民热门电话专区 (仅在未搜索且全部分类时突出展示) */}
            {!search && activeCategory === "all" && hotPhones.length > 0 && (
              <section style={{ marginBottom: "2.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "20px" }}>🚨</span>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: "800", margin: 0, color: "#0f172a" }}>常用紧急与高频热线</h2>
                  </div>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>24小时全天候响应服务</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                  {hotPhones.map((p) => {
                    const isCopied = copiedId === p.id;
                    return (
                      <div
                        key={p.id}
                        style={{
                          background: "white",
                          borderRadius: "14px",
                          border: "1px solid #fde68a",
                          padding: "1.25rem",
                          boxShadow: "0 4px 15px rgba(245, 158, 11, 0.08)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          transition: "transform 0.15s, box-shadow 0.15s",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0, paddingRight: "10px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                            <span style={{ fontWeight: "800", fontSize: "15px", color: "#0f172a" }}>{p.name}</span>
                            <span style={{ background: "#fef3c7", color: "#b45309", padding: "1px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "bold" }}>HOT</span>
                          </div>
                          {p.address && <div style={{ fontSize: "12px", color: "#64748b" }}>📍 {p.address}</div>}
                          {p.description && <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>{p.description}</div>}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", flexShrink: 0 }}>
                          <div style={{ fontSize: "1.15rem", fontWeight: "800", color: "#047857", fontFamily: "monospace" }}>
                            {p.phone}
                          </div>
                          <div style={{ display: "flex", gap: "4px" }}>
                            <button
                              onClick={(e) => handleCopy(p.phone, p.id, e)}
                              style={{
                                padding: "4px 8px",
                                background: isCopied ? "#dcfce7" : "#f1f5f9",
                                color: isCopied ? "#166534" : "#475569",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: "bold",
                                cursor: "pointer",
                              }}
                            >
                              {isCopied ? "已复制 ✓" : "复制"}
                            </button>
                            <a
                              href={`tel:${p.phone}`}
                              style={{
                                padding: "4px 12px",
                                background: "#047857",
                                color: "white",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: "bold",
                                textDecoration: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "2px",
                              }}
                            >
                              <span>📞</span> 拨打
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 搜索/分类筛选模式展示 */}
            {search || activeCategory !== "all" ? (
              <section>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: "bold", margin: 0, color: "#334155" }}>
                    {search ? `🔍 搜索 "${search}" 的结果 (${filtered.length})` : `📁 分类筛选结果 (${filtered.length})`}
                  </h2>
                  {search && (
                    <button onClick={() => setSearch("")} style={{ background: "transparent", border: "none", color: "#047857", fontSize: "13px", cursor: "pointer", fontWeight: "bold" }}>
                      清空搜索
                    </button>
                  )}
                </div>

                {filtered.length === 0 ? (
                  <div style={{ background: "white", padding: "4rem 1.5rem", borderRadius: "16px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🔎</div>
                    <div style={{ fontWeight: "bold", color: "#334155" }}>未找到与 "{search}" 匹配的热线</div>
                    <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>请尝试更换搜索词，或切换上方分类查看全部电话。</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                    {filtered.map((p) => {
                      const isCopied = copiedId === p.id;
                      return (
                        <div
                          key={p.id}
                          style={{
                            background: "white",
                            borderRadius: "14px",
                            border: "1px solid #e2e8f0",
                            padding: "1.15rem",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0, paddingRight: "10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                              <span style={{ fontWeight: "bold", fontSize: "14.5px", color: "#0f172a" }}>{p.name}</span>
                              {p.isHot && <span style={{ background: "#fef3c7", color: "#b45309", padding: "1px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "bold" }}>HOT</span>}
                            </div>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>
                              {p.categoryIcon} {p.categoryName} {p.address ? `· 📍 ${p.address}` : ""}
                            </div>
                            {p.description && <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>{p.description}</div>}
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", flexShrink: 0 }}>
                            <div style={{ fontSize: "1.05rem", fontWeight: "800", color: "#047857", fontFamily: "monospace" }}>
                              {p.phone}
                            </div>
                            <div style={{ display: "flex", gap: "4px" }}>
                              <button
                                onClick={(e) => handleCopy(p.phone, p.id, e)}
                                style={{
                                  padding: "3px 7px",
                                  background: isCopied ? "#dcfce7" : "#f1f5f9",
                                  color: isCopied ? "#166534" : "#475569",
                                  border: "none",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  cursor: "pointer",
                                }}
                              >
                                {isCopied ? "已复制" : "复制"}
                              </button>
                              <a
                                href={`tel:${p.phone}`}
                                style={{
                                  padding: "3px 10px",
                                  background: "#047857",
                                  color: "white",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontWeight: "bold",
                                  textDecoration: "none",
                                }}
                              >
                                拨打
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            ) : (
              /* 全量分组展示 */
              <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
                {categories.map((cat) => (
                  <section key={cat.id}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "2px solid #e2e8f0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "20px" }}>{cat.icon || "📞"}</span>
                        <h2 style={{ fontSize: "1.2rem", fontWeight: "800", margin: 0, color: "#0f172a" }}>{cat.name}</h2>
                        <span style={{ background: "#f1f5f9", color: "#64748b", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "bold" }}>
                          {cat.phones.length} 条热线
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                      {cat.phones.map((p) => {
                        const isCopied = copiedId === p.id;
                        return (
                          <div
                            key={p.id}
                            style={{
                              background: "white",
                              borderRadius: "14px",
                              border: "1px solid #e2e8f0",
                              padding: "1.15rem",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              transition: "all 0.15s",
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0, paddingRight: "10px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                                <span style={{ fontWeight: "bold", fontSize: "14.5px", color: "#0f172a" }}>{p.name}</span>
                                {p.isHot && <span style={{ background: "#fef3c7", color: "#b45309", padding: "1px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "bold" }}>HOT</span>}
                              </div>
                              {p.address && <div style={{ fontSize: "12px", color: "#64748b" }}>📍 {p.address}</div>}
                              {p.description && <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>{p.description}</div>}
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", flexShrink: 0 }}>
                              <div style={{ fontSize: "1.05rem", fontWeight: "800", color: "#047857", fontFamily: "monospace" }}>
                                {p.phone}
                              </div>
                              <div style={{ display: "flex", gap: "4px" }}>
                                <button
                                  onClick={(e) => handleCopy(p.phone, p.id, e)}
                                  style={{
                                    padding: "3px 7px",
                                    background: isCopied ? "#dcfce7" : "#f1f5f9",
                                    color: isCopied ? "#166534" : "#475569",
                                    border: "none",
                                    borderRadius: "6px",
                                    fontSize: "11px",
                                    cursor: "pointer",
                                  }}
                                >
                                  {isCopied ? "已复制" : "复制"}
                                </button>
                                <a
                                  href={`tel:${p.phone}`}
                                  style={{
                                    padding: "3px 10px",
                                    background: "#047857",
                                    color: "white",
                                    borderRadius: "6px",
                                    fontSize: "11px",
                                    fontWeight: "bold",
                                    textDecoration: "none",
                                  }}
                                >
                                  拨打
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
