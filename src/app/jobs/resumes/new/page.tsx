"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/AuthGuard";
import Link from "next/link";

export default function NewResumePage() {
  const [formData, setFormData] = useState({
    name: "",
    jobTitle: "",
    salary: "4000-6000元/月",
    experience: "1-3年",
    education: "大专",
    area: "杨林大学城",
    contact: "",
    intro: "",
    skills: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.jobTitle.trim() || !formData.contact.trim() || !formData.intro.trim()) {
      setMessage("⚠️ 请完整填写姓名、期望职位、联系电话和个人介绍");
      return;
    }

    setSubmitting(true);
    setMessage("正在发布求职简历...");

    try {
      const response = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          jobTitle: formData.jobTitle,
          expectedSalary: formData.salary,
          experience: formData.experience,
          education: formData.education,
          preferredArea: formData.area,
          contact: formData.contact,
          bio: formData.intro,
          skills: formData.skills,
        }),
      });

      const res = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(res.error || "发布求职简历失败，请稍后重试");
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setMessage("网络请求失败，请检查网络连接");
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <div style={{ minHeight: "100vh", background: "#F6F7F9", paddingBottom: "5rem" }}>
        <Navbar />

        <div className="shell content-shell" style={{ maxWidth: "640px", margin: "1rem auto", padding: "0 1rem" }}>
          {submitted ? (
            <div style={{ background: "white", borderRadius: "16px", padding: "3rem 1.5rem", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.03)", border: "1px solid #E5E7EB" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#EAF8F3", color: "#16A67A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", margin: "0 auto 1rem auto" }}>
                ✓
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#1F2937", margin: "0 0 8px 0" }}>
                求职简历发布成功！
              </h2>
              <p style={{ fontSize: "14px", color: "#6B7280", margin: "0 0 2rem 0", lineHeight: "1.6" }}>
                杨林本地招聘企业和 HR 浏览您的简历后将主动与您联系。
              </p>

              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <Link
                  href="/jobs"
                  style={{
                    background: "#16A67A",
                    color: "white",
                    padding: "12px 24px",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: "800",
                    textDecoration: "none",
                  }}
                >
                  去招聘大厅找工作
                </Link>
                <Link
                  href="/profile"
                  style={{
                    background: "#F3F4F6",
                    color: "#4B5563",
                    padding: "12px 24px",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: "700",
                    textDecoration: "none",
                  }}
                >
                  个人中心
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ background: "white", borderRadius: "16px", padding: "24px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)", border: "1px solid #E5E7EB" }}>
              <div style={{ marginBottom: "1.5rem" }}>
                <h1 style={{ fontSize: "20px", fontWeight: "900", color: "#1F2937", margin: "0 0 6px 0" }}>
                  发布求职意向
                </h1>
                <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>
                  填写您的求职意向与经历，让杨林本地好企业主动找到您
                </p>
              </div>

              {message && (
                <div style={{ background: "#FEE2E2", color: "#B91C1C", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: "700", marginBottom: "1.25rem" }}>
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* 姓名与期望职位 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                      您的姓名 <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="如：李晓明"
                      className="info-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                      期望职位 <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.jobTitle}
                      onChange={(e) => handleInputChange("jobTitle", e.target.value)}
                      placeholder="如：文员 / 普工 / 销售"
                      className="info-input"
                    />
                  </div>
                </div>

                {/* 期望薪资与工作经验 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                      期望薪资
                    </label>
                    <select
                      value={formData.salary}
                      onChange={(e) => handleInputChange("salary", e.target.value)}
                      className="info-select"
                    >
                      <option value="3000元以下">3000元以下</option>
                      <option value="3000-5000元/月">3000-5000元/月</option>
                      <option value="5000-8000元/月">5000-8000元/月</option>
                      <option value="8000-12000元/月">8000-12000元/月</option>
                      <option value="面议">面议</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                      工作经验
                    </label>
                    <select
                      value={formData.experience}
                      onChange={(e) => handleInputChange("experience", e.target.value)}
                      className="info-select"
                    >
                      <option value="应届生/无经验">应届生 / 无经验</option>
                      <option value="1年以内">1年以内</option>
                      <option value="1-3年">1-3年</option>
                      <option value="3-5年">3-5年</option>
                      <option value="5年以上">5年以上</option>
                    </select>
                  </div>
                </div>

                {/* 学历与工作地区 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                      学历要求
                    </label>
                    <select
                      value={formData.education}
                      onChange={(e) => handleInputChange("education", e.target.value)}
                      className="info-select"
                    >
                      <option value="高中及以下">高中及以下</option>
                      <option value="中专/职高">中专 / 职高</option>
                      <option value="大专">大专</option>
                      <option value="本科及以上">本科及以上</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                      期望工作地区
                    </label>
                    <select
                      value={formData.area}
                      onChange={(e) => handleInputChange("area", e.target.value)}
                      className="info-select"
                    >
                      <option value="杨林大学城">杨林大学城</option>
                      <option value="杨林经开区">杨林经开区</option>
                      <option value="杨林镇中心">杨林镇中心</option>
                      <option value="嵩明职教园">嵩明职教园</option>
                      <option value="嵩明县城">嵩明县城</option>
                    </select>
                  </div>
                </div>

                {/* 联系电话 */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                    联系电话 <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.contact}
                    onChange={(e) => handleInputChange("contact", e.target.value)}
                    placeholder="请输入您的手机号，方便企业 HR 致电"
                    className="info-input"
                  />
                </div>

                {/* 个人介绍与工作经历 */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                    个人介绍与工作经历 <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={formData.intro}
                    onChange={(e) => handleInputChange("intro", e.target.value)}
                    placeholder="介绍一下您过往的工作经历、擅长技能、求职意向及可到岗时间..."
                    className="info-textarea"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: "100%",
                    marginTop: "1rem",
                    background: "#16A67A",
                    color: "#ffffff",
                    border: "none",
                    padding: "14px",
                    borderRadius: "12px",
                    fontSize: "15px",
                    fontWeight: "800",
                    cursor: submitting ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 12px rgba(22, 166, 122, 0.25)",
                  }}
                >
                  {submitting ? "正在发布..." : "✅ 立即发布求职意向"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
