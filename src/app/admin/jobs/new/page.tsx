"use client";

import { useEffect, useState, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

type Plan = { id: string; name: string; targetKind: string; priceCents: number; durationDays: number; enabled: boolean };

type CompanySummary = {
  id: string;
  name: string;
  shortName?: string | null;
  logo?: string | null;
  industry?: string | null;
  address?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  isVerified: boolean;
};

export default function AdminNewJobPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);

  // Company selection state
  const [selectedCompany, setSelectedCompany] = useState<CompanySummary | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CompanySummary[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef<any>(null);

  // Quick-create Company modal
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalForm, setModalForm] = useState({
    name: "",
    shortName: "",
    industry: "实体制造与商贸",
    address: "云南省昆明市嵩明县杨林经开区",
    contactName: "",
    contactPhone: "",
    creditCode: "",
  });

  useEffect(() => {
    fetch("/api/billing")
      .then((response) => response.json())
      .then((data) => setPlans((data.plans || []).filter((plan: Plan) => plan.enabled && plan.targetKind === "job")))
      .catch(() => setPlans([]));

    // Load initial top companies for quick picker
    fetch("/api/admin/companies?limit=8")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.companies) {
          setSearchResults(data.companies);
        }
      })
      .catch(() => {});

    // Check URL query for companyId
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const prefillCompanyId = urlParams.get("companyId");
      if (prefillCompanyId) {
        fetch(`/api/admin/companies/${prefillCompanyId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.company) {
              setSelectedCompany({
                id: data.company.id,
                name: data.company.name,
                shortName: data.company.shortName,
                logo: data.company.logo,
                industry: data.company.industry,
                address: data.company.address,
                contactName: data.company.contactName,
                contactPhone: data.company.contactPhone,
                isVerified: data.company.isVerified,
              });
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/admin/companies?q=${encodeURIComponent(val.trim())}&limit=10`);
        const json = await res.json();
        if (json.success && json.companies) {
          setSearchResults(json.companies);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearchLoading(false);
      }
    }, 250);
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalForm.name.trim()) {
      setModalError("请填写企业全称");
      return;
    }

    setModalLoading(true);
    setModalError("");
    try {
      const res = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modalForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setModalError(data.error || "创建企业失败");
        return;
      }

      // Auto select the new company
      setSelectedCompany(data.company);
      setShowModal(false);
      setModalForm({
        name: "",
        shortName: "",
        industry: "实体制造与商贸",
        address: "云南省昆明市嵩明县杨林经开区",
        contactName: "",
        contactPhone: "",
        creditCode: "",
      });
    } catch (err: any) {
      setModalError(err?.message || "网络请求异常");
    } finally {
      setModalLoading(false);
    }
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCompany) {
      setMessage("请在上方搜索并选择职位归属的企业主体");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const data = new FormData(event.currentTarget);
    const title = String(data.get("title") || "").trim();
    const body = String(data.get("body") || "").trim();
    const jobType = String(data.get("jobType") || "fulltime").trim();
    const area = String(data.get("area") || "杨林地区").trim();
    const salary = String(data.get("salary") || "面议").trim();
    const contactName = String(data.get("contactName") || "").trim();
    const contactPhone = String(data.get("contactPhone") || "").trim();
    const address = String(data.get("address") || "").trim();
    const billingPlanId = String(data.get("billingPlanId") || "").trim();

    if (!title || !body) {
      setMessage("请填写职位名称和职位描述");
      return;
    }

    setLoading(true);
    setMessage("正在提交发布...");
    try {
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "job",
          title,
          company: selectedCompany.name,
          companyId: selectedCompany.id,
          contact: contactPhone || selectedCompany.contactPhone || undefined,
          contactName: contactName || selectedCompany.contactName || undefined,
          address: address || selectedCompany.address || undefined,
          body,
          jobType,
          area,
          salary,
          status: "approved", // Admin direct publish
          billingPlanId: billingPlanId || undefined,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        setMessage(errJson.error || "提交失败，请稍后重试");
        return;
      }

      const result = await response.json();
      setMessage("招聘职位录入成功并已绑定企业主体！正在跳转...");
      setTimeout(() => {
        location.href = `/jobs/${result.item?.id || ""}`;
      }, 700);
    } catch (err) {
      setMessage("网络异常，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout
      title="录入新招聘职位"
      subtitle="绑定实体公司档案，职位将自动聚合在企业主页与名企招聘大厅。"
      actionButton={
        <button className="button button-primary" type="submit" form="job-form" disabled={loading} style={{ padding: "10px 24px", fontWeight: "700" }}>
          {loading ? "提交中..." : "立即发布职位"}
        </button>
      }
    >
      <div className="editor-shell" style={{ maxWidth: "100%", margin: 0, padding: 0 }}>

        {message && (
          <div style={{ padding: "12px 18px", borderRadius: "8px", marginBottom: "1.5rem", fontSize: "14px", fontWeight: "600", background: message.includes("成功") ? "#DCFCE7" : "#FEE2E2", color: message.includes("成功") ? "#166534" : "#991B1B", border: message.includes("成功") ? "1px solid #BBF7D0" : "1px solid #FECACA" }}>
            {message}
          </div>
        )}

        <form id="job-form" onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "start" }}>
          
          {/* 左侧主体字段 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* ── 核心：所属公司（最顶端） ── */}
            <div style={{ background: "#ffffff", borderRadius: "12px", border: "2px solid #BFDBFE", padding: "22px", boxShadow: "0 4px 12px rgba(25,103,210,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <label style={{ fontSize: "15px", fontWeight: "800", color: "#1E3A8A", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>🏢 所属招聘公司主体 *</span>
                  <span style={{ fontSize: "12px", color: "#3B82F6", fontWeight: "normal" }}>（必选）</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  style={{ background: "#EFF6FF", border: "1px solid #93C5FD", color: "#1D4ED8", fontSize: "12.5px", fontWeight: "700", padding: "4px 12px", borderRadius: "6px", cursor: "pointer" }}
                >
                  + 快速新建企业主体
                </button>
              </div>

              {selectedCompany ? (
                /* 已选中企业卡片 */
                <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: "10px", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "42px", height: "42px", borderRadius: "8px", background: "linear-gradient(135deg, #16A34A 0%, #15803D 100%)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "18px" }}>
                      {selectedCompany.name.slice(0, 1)}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "15px", fontWeight: "800", color: "#14532D" }}>{selectedCompany.name}</span>
                        {selectedCompany.isVerified && (
                          <span style={{ background: "#DCFCE7", color: "#166534", fontSize: "10.5px", fontWeight: "700", padding: "1px 6px", borderRadius: "3px" }}>已认证</span>
                        )}
                      </div>
                      <div style={{ fontSize: "12px", color: "#15803D", marginTop: "2px" }}>
                        <span>🏢 {selectedCompany.industry || "未设置行业"}</span> · <span>📍 {selectedCompany.address || "杨林"}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCompany(null)}
                    style={{ background: "#ffffff", border: "1px solid #86EFAC", color: "#166534", padding: "5px 12px", borderRadius: "6px", fontSize: "12.5px", fontWeight: "700", cursor: "pointer" }}
                  >
                    切换企业
                  </button>
                </div>
              ) : (
                /* 搜索选择企业输入框与下拉浮层 */
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="输入企业名称、信用代码或电话进行匹配搜索..."
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "14px", boxSizing: "border-box" }}
                  />
                  {searchLoading && (
                    <span style={{ position: "absolute", right: "12px", top: "11px", fontSize: "12px", color: "#94A3B8" }}>搜索中...</span>
                  )}

                  {showDropdown && searchResults.length > 0 && (
                    <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#ffffff", border: "1px solid #CBD5E1", borderRadius: "8px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", zIndex: 50, maxHeight: "280px", overflowY: "auto" }}>
                      <div style={{ padding: "8px 12px", fontSize: "12px", color: "#94A3B8", background: "#F8FAFC", borderBottom: "1px solid #F1F5F9" }}>
                        匹配到以下企业（点击直接选中）：
                      </div>
                      {searchResults.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedCompany(c);
                            setShowDropdown(false);
                            setSearchQuery("");
                          }}
                          style={{ padding: "10px 14px", borderBottom: "1px solid #F1F5F9", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#EFF6FF")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <div>
                            <div style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A" }}>{c.name}</div>
                            <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                              {c.industry || "实体企业"} · {c.address || "杨林经开区"}
                            </div>
                          </div>
                          {c.isVerified ? (
                            <span style={{ fontSize: "11px", background: "#DCFCE7", color: "#166534", padding: "1px 6px", borderRadius: "3px", fontWeight: "700" }}>已认证</span>
                          ) : (
                            <span style={{ fontSize: "11px", background: "#F1F5F9", color: "#64748B", padding: "1px 6px", borderRadius: "3px" }}>平台收录</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── 职位基础信息 ── */}
            <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "22px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#0F172A", marginBottom: "6px" }}>
                  职位名称 *
                </label>
                <input
                  name="title"
                  required
                  placeholder="例如：普工 / 数控车床操作工 / 行政专员"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#0F172A", marginBottom: "6px" }}>
                    薪资待遇
                  </label>
                  <input
                    name="salary"
                    defaultValue="面议"
                    placeholder="如: 4000-6000元/月"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "14px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#0F172A", marginBottom: "6px" }}>
                    工作片区
                  </label>
                  <input
                    name="area"
                    defaultValue="杨林经开区"
                    placeholder="如: 杨林经开区先进装备园"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "14px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#0F172A", marginBottom: "6px" }}>
                  具体工作地址（区分公司注册地）
                </label>
                <input
                  name="address"
                  placeholder="如: 嵩明县杨林经济技术开发区天创路8号生产车间"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#0F172A", marginBottom: "6px" }}>
                  职位详情描述 *
                </label>
                <textarea
                  name="body"
                  required
                  rows={10}
                  placeholder="介绍岗位职责、任职要求、上班时间、食宿条件与福利待遇..."
                  style={{ width: "100%", padding: "12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "14px", boxSizing: "border-box", lineHeight: 1.6 }}
                />
              </div>
            </div>

            {/* ── 岗位专属联系人 ── */}
            <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13.5px", fontWeight: "700", color: "#0F172A", marginBottom: "6px" }}>
                  招聘联系人
                </label>
                <input
                  name="contactName"
                  placeholder="如: 李主管 / 张经理"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13.5px", fontWeight: "700", color: "#0F172A", marginBottom: "6px" }}>
                  联系电话 / 手机号
                </label>
                <input
                  name="contactPhone"
                  placeholder="如: 13888888888"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>
            </div>

          </div>

          {/* 右侧属性面板 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "20px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#0F172A", margin: "0 0 14px 0" }}>岗位设置</h2>
              
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#64748B", marginBottom: "6px" }}>
                  用工性质
                </label>
                <select name="jobType" defaultValue="fulltime" style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "14px" }}>
                  <option value="fulltime">全职规范工</option>
                  <option value="parttime">小时工 / 兼职</option>
                  <option value="intern">实习生 / 应届见习</option>
                </select>
              </div>

              {plans.length > 0 && (
                <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #F1F5F9" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#64748B", marginBottom: "6px" }}>
                    推广加速套餐（可选）
                  </label>
                  <select name="billingPlanId" defaultValue="" style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13.5px" }}>
                    <option value="">普通免费发布</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - ¥{(p.priceCents / 100).toFixed(2)} ({p.durationDays}天)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div style={{ background: "#EFF6FF", borderRadius: "12px", border: "1px solid #BFDBFE", padding: "18px" }}>
              <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#1E40AF", marginBottom: "6px" }}>
                💡 为什么强制关联公司？
              </div>
              <p style={{ fontSize: "12.5px", color: "#1E3A8A", margin: 0, lineHeight: 1.6 }}>
                职位关联到正规公司主体后，求职者不仅能看到具体岗位，还能直达企业主页了解公司实力与在招全貌，大幅提升信任感与投递转化。
              </p>
            </div>
          </div>

        </form>
      </div>

      {/* ── 模态框：快速新建企业主体 ── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "520px", padding: "26px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0F172A" }}>
                ＋ 快速新建企业主体
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", fontSize: "20px", color: "#94A3B8", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div style={{ padding: "10px 14px", background: "#FEE2E2", color: "#991B1B", fontSize: "13px", borderRadius: "6px", marginBottom: "14px" }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateCompany} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#0F172A", marginBottom: "4px" }}>
                  企业全称 *
                </label>
                <input
                  required
                  value={modalForm.name}
                  onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                  placeholder="如: 云南沃莱德聚氨酯材料有限公司"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#0F172A", marginBottom: "4px" }}>
                    企业简称
                  </label>
                  <input
                    value={modalForm.shortName}
                    onChange={(e) => setModalForm({ ...modalForm, shortName: e.target.value })}
                    placeholder="如: 沃莱德新材料"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "14px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#0F172A", marginBottom: "4px" }}>
                    所属行业
                  </label>
                  <select
                    value={modalForm.industry}
                    onChange={(e) => setModalForm({ ...modalForm, industry: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "14px", boxSizing: "border-box" }}
                  >
                    <option value="实体制造与商贸">实体制造与商贸</option>
                    <option value="先进装备与机械制造">先进装备与机械制造</option>
                    <option value="绿色绿色食品制造">绿色绿色食品制造</option>
                    <option value="商业餐饮与新零售">商业餐饮与新零售</option>
                    <option value="数字经济与信息科技">数字经济与信息科技</option>
                    <option value="现代物流与仓储配送">现代物流与仓储配送</option>
                    <option value="城市服务与物业管理">城市服务与物业管理</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#0F172A", marginBottom: "4px" }}>
                  厂区/办公地址
                </label>
                <input
                  value={modalForm.address}
                  onChange={(e) => setModalForm({ ...modalForm, address: e.target.value })}
                  placeholder="如: 嵩明县杨林工业园区XX路"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#0F172A", marginBottom: "4px" }}>
                    负责人/HR姓名
                  </label>
                  <input
                    value={modalForm.contactName}
                    onChange={(e) => setModalForm({ ...modalForm, contactName: e.target.value })}
                    placeholder="如: 孙经理"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "14px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#0F172A", marginBottom: "4px" }}>
                    联系电话
                  </label>
                  <input
                    value={modalForm.contactPhone}
                    onChange={(e) => setModalForm({ ...modalForm, contactPhone: e.target.value })}
                    placeholder="如: 13999999999"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "14px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px", paddingTop: "14px", borderTop: "1px solid #F1F5F9" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: "8px 18px", borderRadius: "6px", border: "1px solid #CBD5E1", background: "#ffffff", color: "#64748B", fontWeight: "600", cursor: "pointer" }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  style={{ padding: "8px 22px", borderRadius: "6px", border: "none", background: "#1967D2", color: "#ffffff", fontWeight: "700", cursor: "pointer" }}
                >
                  {modalLoading ? "保存中..." : "保存并立即选中"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
