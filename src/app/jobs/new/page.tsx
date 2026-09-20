"use client";

import { useEffect, useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import ImageUpload from "@/components/ImageUpload";
import { buildJobBody } from "@/lib/job-parser";
import AuthGuard from "@/components/AuthGuard";
import BillingCheckoutModal, {
  type BillingQuoteData,
  type UserBalances,
} from "@/components/billing/BillingCheckoutModal";

type Plan = { id: string; name: string; targetKind: string; priceCents: number; durationDays: number; enabled: boolean };

function yuan(cents: number) {
  const value = cents / 100;
  return value.toFixed(value % 1 === 0 ? 0 : 2);
}

export default function NewJobPage() {
  const [message, setMessage] = useState("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // 双轨入口：招聘(hire) 或 求职(resume)
  const [publishType, setPublishType] = useState<"hire" | "resume">("hire");

  // 统一通用字段
  const [title, setTitle] = useState("");
  const [contact, setContact] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [billingPlanId, setBillingPlanId] = useState("");

  // 企业招聘特定字段
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [myCompanies, setMyCompanies] = useState<any[]>([]);
  const [companySearch, setCompanySearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef<any>(null);

  // 快速新建企业主体弹窗
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyIndustry, setNewCompanyIndustry] = useState("实体制造与商贸");
  const [newCompanyAddress, setNewCompanyAddress] = useState("云南省昆明市嵩明县杨林经开区");
  const [createLoading, setCreateLoading] = useState(false);

  const [salary, setSalary] = useState("");
  const [jobType, setJobType] = useState("fulltime");
  const [area, setArea] = useState("杨林经开区");
  const [experience, setExperience] = useState("经验不限");
  const [education, setEducation] = useState("学历不限");
  const [benefits, setBenefits] = useState("");
  const [description, setDescription] = useState("");

  // 个人求职特定字段
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [skills, setSkills] = useState("");

  // 商业化计费状态
  const [quote, setQuote] = useState<BillingQuoteData | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [userBalances, setUserBalances] = useState<UserBalances>({ coins: 0, points: 0 });
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paidEntitlementId, setPaidEntitlementId] = useState("");

  const fetchQuote = async (companyIdOverride?: string) => {
    setQuoteLoading(true);
    try {
      const cId = companyIdOverride !== undefined ? companyIdOverride : (selectedCompany?.id || undefined);
      const res = await fetch("/api/billing/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module: "job",
          companyId: publishType === "hire" ? cId : undefined,
        }),
      });
      const data = await res.json();
      if (data.quote) {
        setQuote(data.quote);
      }
      if (data.userBalances) {
        setUserBalances(data.userBalances);
      }
    } catch (e) {
      console.error("获取报价失败:", e);
    } finally {
      setQuoteLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/billing")
      .then((res) => res.json())
      .then((data) => setPlans((data.plans || []).filter((plan: Plan) => plan.enabled && plan.targetKind === "job")))
      .catch(() => setPlans([]));

    // 获取当前用户所属企业
    fetch("/api/user/companies")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.myCompanies) {
          setMyCompanies(data.myCompanies);
          if (data.myCompanies.length === 1) {
            setSelectedCompany(data.myCompanies[0]);
          }
        }
      })
    // 检查并恢复草稿（如微信授权重定向后）
    if (typeof window !== "undefined") {
      try {
        const raw = sessionStorage.getItem("jobs_new_draft");
        if (raw) {
          const d = JSON.parse(raw);
          if (d.publishType) setPublishType(d.publishType);
          if (d.title) setTitle(d.title);
          if (d.contact) setContact(d.contact);
          if (d.images) setImages(d.images);
          if (d.billingPlanId) setBillingPlanId(d.billingPlanId);
          if (d.selectedCompany) setSelectedCompany(d.selectedCompany);
          if (d.salary) setSalary(d.salary);
          if (d.jobType) setJobType(d.jobType);
          if (d.area) setArea(d.area);
          if (d.experience) setExperience(d.experience);
          if (d.education) setEducation(d.education);
          if (d.benefits) setBenefits(d.benefits);
          if (d.description) setDescription(d.description);
          if (d.name) setName(d.name);
          if (d.age) setAge(d.age);
          if (d.skills) setSkills(d.skills);
          if (d.step) setStep(d.step);
        }

        if (sessionStorage.getItem("yanglin_checkout_auto_open") === "1") {
          sessionStorage.removeItem("yanglin_checkout_auto_open");
          setShowCheckoutModal(true);
        }
      } catch (e) {
        console.warn("恢复草稿失败", e);
      }
    }
  }, []);

  const handleSearchCompany = (val: string) => {
    setCompanySearch(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/user/companies?q=${encodeURIComponent(val.trim())}`);
        const data = await res.json();
        if (data.success && data.searchResults) {
          setSearchResults(data.searchResults);
          setShowDropdown(true);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setSearchLoading(false);
      }
    }, 250);
  };

  const handleCreateCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;

    setCreateLoading(true);
    try {
      const res = await fetch("/api/user/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCompanyName.trim(),
          industry: newCompanyIndustry,
          address: newCompanyAddress,
        }),
      });
      const data = await res.json();
      if (data.success && data.company) {
        setSelectedCompany(data.company);
        setShowCreateModal(false);
        setNewCompanyName("");
      } else {
        alert(data.error || "创建失败");
      }
    } catch (e) {
      alert("网络异常");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleNextStep1 = () => {
    if (publishType === "hire") {
      if (!selectedCompany) return setMessage("请选择或创建招聘企业主体");
      if (!title.trim()) return setMessage("请填写招聘岗位名称");
    }
    if (publishType === "resume" && !name.trim()) return setMessage("请填写您的姓名");
    setMessage("");
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (!description.trim()) return setMessage(publishType === "hire" ? "请填写岗位详情说明" : "请填写自我介绍与过往经历");
    if (!contact.trim()) return setMessage("请填写联系电话或微信号");
    setMessage("");
    setStep(3);
    fetchQuote();
  };

  const executeSubmit = async (entitlementIdToUse?: string) => {
    setMessage("正在提交中...");

    const finalTitle = publishType === "hire" ? title.trim() : `【求职】${name.trim()} - ${title.trim() || "期望岗位"}`;
    const finalCompany = publishType === "hire" ? (selectedCompany?.name || "杨林本地企业") : "个人求职";
    const finalJobType = publishType === "hire" ? jobType : "resume";

    const finalBody = buildJobBody({
      type: publishType === "resume" ? "resume" : "job",
      jobTitle: title.trim(),
      salary: salary.trim(),
      area: area,
      experience: experience,
      education: education,
      benefits: benefits.trim(),
      description: description.trim(),
      name: name.trim(),
      age: age.trim(),
      skills: skills.trim(),
      contact: contact.trim(),
    });

    try {
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "job",
          title: finalTitle,
          company: finalCompany,
          companyId: selectedCompany?.id || undefined,
          jobType: finalJobType,
          area: publishType === "hire" ? area : "求职",
          salary: salary.trim() || "面议",
          body: finalBody,
          contact: contact.trim(),
          status: "pending",
          images,
          billingPlanId: billingPlanId || undefined,
          entitlementId: entitlementIdToUse || paidEntitlementId || undefined,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = `/login?redirect=${encodeURIComponent("/jobs/new")}`;
          return;
        }

        // 拦截 402 强制收费
        if (response.status === 402) {
          const data = await response.json();
          if (data.quote) {
            setQuote(data.quote);
          }
          setShowCheckoutModal(true);
          setMessage("⚠️ 免费额度已用尽，请完成支付后发布");
          return;
        }

        const errData = await response.json().catch(() => null);
        return setMessage(errData?.error || "提交失败，请重试");
      }

      if (typeof window !== "undefined") {
        sessionStorage.removeItem("jobs_new_draft");
        sessionStorage.removeItem("yanglin_checkout_auto_open");
      }
      setMessage("");
      setStep(4);
    } catch (e: any) {
      console.error(e);
      setMessage("提交发生网络异常，请重试");
    }
  };

  const saveDraft = () => {
    if (typeof window === "undefined") return;
    try {
      const draft = {
        publishType,
        title,
        contact,
        images,
        billingPlanId,
        selectedCompany,
        salary,
        jobType,
        area,
        experience,
        education,
        benefits,
        description,
        name,
        age,
        skills,
        step,
      };
      sessionStorage.setItem("jobs_new_draft", JSON.stringify(draft));
    } catch (e) {
      console.warn("暂存草稿失败", e);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await executeSubmit();
  };

  const handlePaymentSuccess = async (entitlementId: string) => {
    setPaidEntitlementId(entitlementId);
    setShowCheckoutModal(false);
    setMessage("✅ 支付成功，已获得发布权益凭证，正在提交发布...");
    await executeSubmit(entitlementId);
  };

  const resetForm = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("jobs_new_draft");
      sessionStorage.removeItem("yanglin_checkout_auto_open");
    }
    setTitle(""); setSalary(""); setDescription(""); setContact(""); setImages([]); setBillingPlanId("");
    setName(""); setAge(""); setSkills(""); setBenefits("");
    setStep(1);
  };

  return (
    <AuthGuard>
      <main className="page-layout">
        <Navbar />

        <section className="page-header-compact" style={{ marginBottom: "24px" }}>
          <div className="shell">
            <div className="hero-header">
              <div className="hero-title-group">
                <span className="eyebrow-tag">{publishType === "hire" ? "企业招聘通道" : "个人求职通道"}</span>
                <h1 style={{ fontSize: "clamp(20px, 3.5vw, 26px)", wordBreak: "break-word" }}>
                  {publishType === "hire" ? "发布招聘职位 · 招募杨林本地人才" : "登记求职意向 · 快速入职杨林名企"}
                </h1>
                <p>
                  {publishType === "hire"
                    ? "直达职教园区数万应届毕业生与本地各行业精英人才"
                    : "让杨林经开区、大学城及周边数百家优质企业主动联系您"}
                </p>
              </div>
              <a href="/jobs" className="button button-secondary">← 返回招聘大厅</a>
            </div>
          </div>
        </section>

        <div className="shell shell-compact" style={{ paddingBottom: "64px" }}>
          {/* 模式选择与步骤条 */}
          {step < 4 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
              <div
                onClick={() => { setPublishType("hire"); setStep(1); }}
                style={{
                  padding: "16px 20px",
                  borderRadius: "14px",
                  border: publishType === "hire" ? "2px solid #1967D2" : "1px solid var(--line)",
                  background: publishType === "hire" ? "#EFF6FF" : "white",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ fontSize: "16px", fontWeight: "800", color: publishType === "hire" ? "#1D4ED8" : "var(--ink)", marginBottom: "4px" }}>
                  🏢 我是企业 / 雇主 · 招人才
                </div>
                <div style={{ fontSize: "12.5px", color: "var(--muted)" }}>绑定企业档案，发布全职、兼职招聘</div>
              </div>

              <div
                onClick={() => { setPublishType("resume"); setStep(1); }}
                style={{
                  padding: "16px 20px",
                  borderRadius: "14px",
                  border: publishType === "resume" ? "2px solid var(--brand)" : "1px solid var(--line)",
                  background: publishType === "resume" ? "#f0fdf4" : "white",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ fontSize: "16px", fontWeight: "800", color: publishType === "resume" ? "#16a34a" : "var(--ink)", marginBottom: "4px" }}>
                  👤 我是求职者 · 找好工作
                </div>
                <div style={{ fontSize: "12.5px", color: "var(--muted)" }}>登记意向简历，让数百家优质名企联系您</div>
              </div>
            </div>
          )}

          {message && (
            <div style={{ marginBottom: "16px", padding: "14px 18px", borderRadius: "12px", background: "#fee2e2", color: "#991b1b", fontSize: "14px", fontWeight: "600" }}>
              ⚠️ {message}
            </div>
          )}

          {/* Step 1: 基本信息 */}
          {step === 1 && (
            <div className="info-step-card" style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid var(--line)" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "16px", color: "var(--brand-dark)" }}>
                {publishType === "hire" ? "第一步：确认招聘企业与岗位基础" : "第一步：填写求职意向与个人背景"}
              </h2>

              {publishType === "hire" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  
                  {/* ── 核心：所属企业选择卡片 ── */}
                  <div style={{ background: "#F8FAFC", borderRadius: "12px", border: "1.5px solid #BFDBFE", padding: "16px 18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <label style={{ fontSize: "14px", fontWeight: "800", color: "#1E3A8A" }}>
                        🏢 招聘企业主体 <span style={{ color: "#EF4444" }}>*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(true)}
                        style={{ background: "#EFF6FF", border: "1px solid #93C5FD", color: "#1D4ED8", fontSize: "12px", fontWeight: "700", padding: "3px 10px", borderRadius: "6px", cursor: "pointer" }}
                      >
                        + 新建企业档案
                      </button>
                    </div>

                    {selectedCompany ? (
                      <div style={{ background: "#ffffff", border: "1px solid #86EFAC", borderRadius: "8px", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "36px", height: "36px", borderRadius: "6px", background: "linear-gradient(135deg, #16A34A 0%, #15803D 100%)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "16px" }}>
                            {selectedCompany.name.slice(0, 1)}
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontSize: "14px", fontWeight: "800", color: "#0F172A" }}>{selectedCompany.name}</span>
                              {selectedCompany.isVerified && (
                                <span style={{ background: "#DCFCE7", color: "#166534", fontSize: "10px", fontWeight: "700", padding: "1px 6px", borderRadius: "3px" }}>已认证</span>
                              )}
                            </div>
                            <div style={{ fontSize: "12px", color: "#64748B" }}>
                              {selectedCompany.industry || "实体企业"} · {selectedCompany.address || "杨林经开区"}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedCompany(null)}
                          style={{ background: "#F1F5F9", border: "1px solid #CBD5E1", color: "#475569", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                        >
                          切换
                        </button>
                      </div>
                    ) : (
                      <div style={{ position: "relative" }}>
                        {myCompanies.length > 0 && (
                          <div style={{ marginBottom: "8px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "12px", color: "#64748B", lineHeight: "24px" }}>我的企业：</span>
                            {myCompanies.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => setSelectedCompany(c)}
                                style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1E40AF", fontSize: "12px", padding: "2px 8px", borderRadius: "4px", cursor: "pointer" }}
                              >
                                {c.name}
                              </button>
                            ))}
                          </div>
                        )}

                        <input
                          className="info-input"
                          value={companySearch}
                          onChange={(e) => handleSearchCompany(e.target.value)}
                          onFocus={() => setShowDropdown(true)}
                          placeholder="搜索企业全称选择归属公司..."
                        />
                        {searchLoading && <span style={{ fontSize: "12px", color: "#94A3B8" }}>正在查找企业...</span>}

                        {showDropdown && searchResults.length > 0 && (
                          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#ffffff", border: "1px solid #CBD5E1", borderRadius: "8px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", zIndex: 50, maxHeight: "200px", overflowY: "auto" }}>
                            {searchResults.map((c) => (
                              <div
                                key={c.id}
                                onClick={() => {
                                  setSelectedCompany(c);
                                  setShowDropdown(false);
                                  setCompanySearch("");
                                }}
                                style={{ padding: "8px 12px", borderBottom: "1px solid #F1F5F9", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                              >
                                <span style={{ fontSize: "13.5px", fontWeight: "600" }}>{c.name}</span>
                                <span style={{ fontSize: "11px", color: "#64748B" }}>{c.industry || "实体企业"}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: "700", marginBottom: "8px" }}>
                      招聘岗位名称 <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <input
                      className="info-input"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="例如：车间操作工 / 仓储主管 / 运营专员"
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "14px", fontWeight: "700", marginBottom: "8px" }}>工作片区</label>
                      <select className="info-select" value={area} onChange={(e) => setArea(e.target.value)}>
                        <option value="杨林经开区">📍 嵩明杨林经开区</option>
                        <option value="杨林职教园区">📍 职教园区(大学城)</option>
                        <option value="杨林集镇">📍 杨林集镇</option>
                        <option value="嵩明县城">📍 嵩明主城区</option>
                        <option value="昆明其他">📍 昆明周边</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "14px", fontWeight: "700", marginBottom: "8px" }}>用工类别</label>
                      <select className="info-select" value={jobType} onChange={(e) => setJobType(e.target.value)}>
                        <option value="fulltime">全职规范用工</option>
                        <option value="parttime">小时工 / 兼职</option>
                        <option value="intern">实习 / 应届见习</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "14px", fontWeight: "700", marginBottom: "8px" }}>薪资范围</label>
                      <input
                        className="info-input"
                        value={salary}
                        onChange={(e) => setSalary(e.target.value)}
                        placeholder="例如：4500-6000元/月、面议"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "14px", fontWeight: "700", marginBottom: "8px" }}>经验要求</label>
                      <select className="info-select" value={experience} onChange={(e) => setExperience(e.target.value)}>
                        <option value="经验不限">经验不限</option>
                        <option value="1年以内">1年以内</option>
                        <option value="1-3年">1-3年</option>
                        <option value="3-5年">3-5年</option>
                        <option value="5年以上">5年以上</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: "700", marginBottom: "8px" }}>您的姓名 <span style={{ color: "var(--danger)" }}>*</span></label>
                    <input className="info-input" value={name} onChange={e => setName(e.target.value)} placeholder="例如：李小华" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "14px", fontWeight: "700", marginBottom: "8px" }}>期望职位</label>
                      <input className="info-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="例如：行政文员、配送员" />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "14px", fontWeight: "700", marginBottom: "8px" }}>期望月薪</label>
                      <input className="info-input" value={salary} onChange={e => setSalary(e.target.value)} placeholder="例如：3500-5000元" />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
                <button className="button button-primary" onClick={handleNextStep1}>下一步：补充说明 &gt;</button>
              </div>
            </div>
          )}

          {/* Step 2: 详情描述 */}
          {step === 2 && (
            <div className="info-step-card" style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid var(--line)" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "16px", color: "var(--brand-dark)" }}>
                第二步：详细内容与联系方式
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: "700", marginBottom: "8px" }}>
                    {publishType === "hire" ? "职位要求与福利待遇 *" : "自我评价与工作经历 *"}
                  </label>
                  <textarea
                    className="info-textarea"
                    rows={8}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder={publishType === "hire" ? "介绍具体工作内容、岗位任职要求、作息时间与包吃住等福利..." : "介绍您的过往工作经历、技能特长与到岗时间..."}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: "700", marginBottom: "8px" }}>
                    联系电话 / 微信号 <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <input className="info-input" value={contact} onChange={e => setContact(e.target.value)} placeholder="例如：13888888888 或 微信号" />
                </div>
              </div>

              <div style={{ marginTop: "24px", display: "flex", justifyContent: "space-between" }}>
                <button className="button button-secondary" onClick={() => setStep(1)}>&lt; 上一步</button>
                <button className="button button-primary" onClick={handleNextStep2}>下一步：预览提交 &gt;</button>
              </div>
            </div>
          )}

          {/* Step 3: 预览并提交 */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="info-step-card" style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid var(--line)" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "16px", color: "var(--brand-dark)" }}>
                第三步：核对并提交发布
              </h2>

              {/* 商业化计费额度与价格核算卡片 */}
              <div style={{ marginBottom: "20px" }}>
                {quoteLoading ? (
                  <div style={{ padding: "14px", background: "#F1F5F9", borderRadius: "12px", fontSize: "13px", color: "#64748B", textAlign: "center" }}>
                    🔄 正在核算当前企业/个人发布配额与最新收费策略...
                  </div>
                ) : quote ? (
                  quote.isFree ? (
                    <div style={{ padding: "14px 18px", background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "22px" }}>🎁</span>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: "700", color: "#065F46" }}>
                            {quote.freeReason === "GLOBAL_FREE_CAMPAIGN" ? "全站限时免费活动进行中" : "当前享受免费发布特权"}
                          </div>
                          <div style={{ fontSize: "12px", color: "#047857" }}>
                            {quote.freeReason === "GLOBAL_FREE_CAMPAIGN"
                              ? "平台开站回馈活动，免收任何发帖费"
                              : `该企业主体周期内剩余免费额度：${quote.quotaRemaining} 条 (总计 ${quote.freeQuotaTotal} 条)`}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: "800", background: "#10B981", color: "white", padding: "4px 12px", borderRadius: "20px" }}>
                        本次免费
                      </span>
                    </div>
                  ) : paidEntitlementId ? (
                    <div style={{ padding: "14px 18px", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "22px" }}>✅</span>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: "700", color: "#1D4ED8" }}>已就绪有效发布权益凭证</div>
                          <div style={{ fontSize: "12px", color: "#2563EB" }}>凭证已绑定至草稿，提交后将自动核销并完成发布</div>
                        </div>
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: "800", background: "#2563EB", color: "white", padding: "4px 12px", borderRadius: "20px" }}>
                        权益已就绪
                      </span>
                    </div>
                  ) : (
                    <div style={{ padding: "14px 18px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "22px" }}>⚠️</span>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: "700", color: "#92400E" }}>
                            免费发布额度已用尽 (0/{quote.freeQuotaTotal}条)
                          </div>
                          <div style={{ fontSize: "12px", color: "#B45309" }}>
                            发布单价：{quote.priceRmbDisplay} / 次 {quote.allowCoin && `(或 ${quote.priceCoinsDisplay})`}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCheckoutModal(true)}
                        style={{
                          background: "#D97706",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          padding: "8px 16px",
                          fontSize: "13px",
                          fontWeight: "700",
                          cursor: "pointer",
                          boxShadow: "0 2px 4px rgba(217, 119, 6, 0.2)",
                        }}
                      >
                        💳 立即结算 / 选择介质
                      </button>
                    </div>
                  )
                ) : null}
              </div>

              <div style={{ background: "#F8FAFC", borderRadius: "12px", padding: "18px", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px" }}>
                {publishType === "hire" && (
                  <div><b>招聘企业：</b> {selectedCompany?.name || "杨林企业"}</div>
                )}
                <div><b>职位标题：</b> {title}</div>
                <div><b>薪资待遇：</b> {salary || "面议"}</div>
                <div><b>工作地点：</b> {area}</div>
                <div><b>联系方式：</b> {contact}</div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button type="button" className="button button-secondary" onClick={() => setStep(2)}>&lt; 返回修改</button>
                <button type="submit" className="button button-primary">确认提交发布</button>
              </div>
            </form>
          )}

          {/* Step 4: 提交完成 */}
          {step === 4 && (
            <div className="info-step-card" style={{ background: "white", padding: "36px 24px", borderRadius: "16px", border: "1px solid var(--line)", textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "var(--brand-dark)", marginBottom: "8px" }}>发布提交成功！</h2>
              <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "24px" }}>
                已为您提交审核并关联企业档案。审核通过后将第一时间在职位详情、名企大厅与企业主页同步展示。
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
                <a href="/jobs" className="button button-secondary">返回招聘大厅</a>
                <button onClick={resetForm} className="button button-primary">继续发布新职位</button>
              </div>
            </div>
          )}
        </div>

        {/* ── 快速新建企业主体弹窗 ── */}
        {showCreateModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
            <div style={{ background: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "480px", padding: "24px" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "17px", fontWeight: "800" }}>＋ 新建企业档案</h3>
              <form onSubmit={handleCreateCompanySubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "4px" }}>企业全称 *</label>
                  <input
                    required
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    placeholder="如: 云南沃莱德新材料科技有限公司"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "4px" }}>所属行业</label>
                  <select
                    value={newCompanyIndustry}
                    onChange={(e) => setNewCompanyIndustry(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", boxSizing: "border-box" }}
                  >
                    <option value="实体制造与商贸">实体制造与商贸</option>
                    <option value="先进装备与机械制造">先进装备与机械制造</option>
                    <option value="绿色绿色食品制造">绿色绿色食品制造</option>
                    <option value="商业餐饮与新零售">商业餐饮与新零售</option>
                    <option value="现代物流与仓储配送">现代物流与仓储配送</option>
                    <option value="数字经济与信息科技">数字经济与信息科技</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "4px" }}>办公或厂区地址</label>
                  <input
                    value={newCompanyAddress}
                    onChange={(e) => setNewCompanyAddress(e.target.value)}
                    placeholder="如: 嵩明县杨林工业园区"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                  <button type="button" onClick={() => setShowCreateModal(false)} className="button button-secondary" style={{ padding: "6px 14px" }}>
                    取消
                  </button>
                  <button type="submit" disabled={createLoading} className="button button-primary" style={{ padding: "6px 18px" }}>
                    {createLoading ? "保存中..." : "保存并选中"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 商业化支付收银台弹窗 */}
        <BillingCheckoutModal
          isOpen={showCheckoutModal}
          quote={quote}
          userBalances={userBalances}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowCheckoutModal(false)}
          onSaveDraft={saveDraft}
        />
      </main>
    </AuthGuard>
  );
}
