"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import ImageUpload from "@/components/ImageUpload";
import { buildActivityBody } from "@/lib/activity-parser";

const activityCategories = [
  { id: "outdoor", label: "🌲 户外徒步/探险", desc: "登山 / 徒步 / 骑行" },
  { id: "camping", label: "⛺ 草坪露营/派对", desc: "野营 / 烧烤 / 音乐" },
  { id: "game", label: "🎮 电子竞技/桌游", desc: "开黑 / 剧本杀 / 联机" },
  { id: "salon", label: "💡 创业沙龙/讲座", desc: "交流 / 技能 / 读书" },
  { id: "party", label: "☕ 聚会交友/饭局", desc: "同城 / 约饭 / 联谊" },
  { id: "sports", label: "🏀 体育运动/健身", desc: "篮球 / 羽毛球 / 跑步" },
];

export default function NewEventPage() {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    category: "outdoor",
    region: "杨林大学城",
    startTime: "",
    endTime: "",
    deadline: "",
    location: "",
    assemblyPoint: "",
    quota: "50人",
    feeType: "免费",
    feeDetail: "",
    
    intro: "",
    agenda: "",
    suitableFor: "高校学生、本地青年及户外运动爱好者",
    notes: "请穿着舒适运动鞋服，注意安全，遵守领队统一指挥",
    tags: "周末聚会 同城交友",

    organizer: "",
    organizerType: "个人发起",
    phone: "",
    wechat: "",
    signupMethod: "在线报名",
    externalLink: "",
    signupStatus: "报名中",
  });

  const updateForm = (key: string, val: string) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.startTime || !formData.location) {
      setMessage("⚠️ 请填写活动主题名称、开始时间与具体举办地点");
      return;
    }

    if (!formData.phone || !formData.organizer) {
      setMessage("⚠️ 请填写活动发起人/主办方称呼及联系电话");
      return;
    }

    if (!formData.intro) {
      setMessage("⚠️ 请输入详细的活动介绍与流程说明");
      return;
    }

    setSubmitting(true);
    setMessage("正在提交活动，请稍候...");

    const finalIntro = buildActivityBody({
      activityType: formData.category,
      startTime: formData.startTime,
      endTime: formData.endTime,
      deadline: formData.deadline,
      quota: formData.quota,
      signupStatus: formData.signupStatus,
      location: formData.region + " " + formData.location,
      assemblyPoint: formData.assemblyPoint,
      feeType: formData.feeType,
      feeDetail: formData.feeDetail,
      phone: formData.phone,
      wechat: formData.wechat,
      organizer: formData.organizer,
      organizerType: formData.organizerType,
      suitableFor: formData.suitableFor,
      agenda: formData.agenda,
      notes: formData.notes,
      tags: formData.tags,
      coverImage: coverImage[0] || undefined,
      signupMethod: formData.signupMethod,
      externalLink: formData.externalLink,
      eventStatus: "正常",
      activityImages: images,
      intro: formData.intro,
    });

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          startTime: formData.startTime ? new Date(formData.startTime).toISOString() : new Date().toISOString(),
          location: formData.region ? `${formData.region} · ${formData.location}` : formData.location,
          intro: finalIntro,
          status: "PENDING",
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = `/login?from=${encodeURIComponent("/active/new")}`;
          return;
        }
        const res = await response.json().catch(() => ({}));
        setMessage(res.error || "发布失败，请稍后重试");
        setSubmitting(false);
        return;
      }

      setMessage("🎉 同城活动已成功发起！正在等待审核，通过后全城可见...");
      setTimeout(() => {
        window.location.href = "/active";
      }, 1000);
    } catch (err: any) {
      setMessage("网络请求异常，请检查网络连接后重试");
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "14.5px",
    outline: "none",
    background: "#ffffff",
    color: "#0f172a",
    boxSizing: "border-box" as const,
    transition: "border-color 0.15s, box-shadow 0.15s",
  };

  const labelStyle = {
    display: "block",
    fontWeight: "700" as const,
    fontSize: "13.5px",
    color: "#334155",
    marginBottom: "6px",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <Navbar />

      {/* 顶部现代化 Hero Banner */}
      <section
        style={{
          background: "linear-gradient(135deg, #064e3b 0%, #0d9488 60%, #0284c7 100%)",
          color: "white",
          padding: "2.5rem 1rem 3rem 1rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.18)", padding: "4px 12px", borderRadius: "20px", fontSize: "12.5px", fontWeight: "bold", backdropFilter: "blur(10px)", marginBottom: "0.75rem", border: "1px solid rgba(255,255,255,0.25)" }}>
            <span>🏕️</span> 嵩明·杨林同城活动发起创办中心
          </div>
          <h1 style={{ fontSize: "clamp(22px, 3.5vw, 30px)", fontWeight: "800", margin: "0 0 0.5rem 0" }}>
            发起杨林同城精彩活动
          </h1>
          <p style={{ fontSize: "14px", opacity: 0.9, margin: 0, lineHeight: "1.6" }}>
            组织户外徒步、草坪露营、电竞派对、创业沙龙与同城交友饭局，连接全城青年与高校师生
          </p>
        </div>
      </section>

      {/* 主体表单工作台 */}
      <main style={{ maxWidth: "1120px", margin: "-1.5rem auto 4rem auto", padding: "0 1rem" }}>
        
        {/* Step 1: 活动类别选择 */}
        <div style={{ background: "white", borderRadius: "16px", padding: "1.5rem", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <div>
              <span style={{ fontSize: "12px", fontWeight: "800", color: "#047857", textTransform: "uppercase", letterSpacing: "1px" }}>STEP 1</span>
              <h2 style={{ fontSize: "18px", fontWeight: "800", margin: "2px 0 0 0", color: "#0f172a" }}>选择活动主题分类</h2>
            </div>
            <span style={{ fontSize: "13px", color: "#64748b" }}>
              当前选择：<strong style={{ color: "#047857" }}>{activityCategories.find((c) => c.id === formData.category)?.label}</strong>
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
            {activityCategories.map((cat) => {
              const isSelected = formData.category === cat.id;
              return (
                <div
                  key={cat.id}
                  onClick={() => updateForm("category", cat.id)}
                  style={{
                    padding: "16px 12px",
                    borderRadius: "14px",
                    border: isSelected ? "2px solid #047857" : "1px solid #e2e8f0",
                    background: isSelected ? "#f0fdf4" : "#ffffff",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: isSelected ? "0 4px 14px rgba(4, 120, 87, 0.12)" : "none",
                  }}
                >
                  <div style={{ fontWeight: "800", fontSize: "14px", color: isSelected ? "#047857" : "#1e293b", marginBottom: "4px" }}>
                    {cat.label}
                  </div>
                  <div style={{ fontSize: "11px", color: isSelected ? "#059669" : "#94a3b8" }}>
                    {cat.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 状态通知 */}
        {message && (
          <div
            style={{
              padding: "14px 18px",
              borderRadius: "12px",
              marginBottom: "1.5rem",
              fontSize: "14px",
              fontWeight: "600",
              background: message.includes("成功") ? "#dcfce7" : "#fee2e2",
              color: message.includes("成功") ? "#166534" : "#991b1b",
              border: message.includes("成功") ? "1px solid #bbf7d0" : "1px solid #fecaca",
            }}
          >
            {message}
          </div>
        )}

        {/* Step 2: 双栏表单卡片 */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", alignItems: "start" }}>
            
            {/* 左栏：活动详情与图文日程 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ background: "white", borderRadius: "16px", padding: "1.75rem", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: "18px" }}>📝</span>
                  <h3 style={{ fontSize: "16px", fontWeight: "800", margin: 0, color: "#0f172a" }}>
                    活动基本信息与介绍
                  </h3>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div>
                    <label style={labelStyle}>
                      活动名称 / 主题 <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      value={formData.title}
                      onChange={(e) => updateForm("title", e.target.value)}
                      required
                      placeholder="例如：杨林大学城草坪音乐节与露营烧烤派对"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      上传主图封面（海报）
                    </label>
                    <div style={{ marginTop: "6px" }}>
                      <ImageUpload value={coverImage} onChange={setCoverImage} maxCount={1} />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>
                      活动详细介绍与亮点 <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <textarea
                      value={formData.intro}
                      onChange={(e) => updateForm("intro", e.target.value)}
                      required
                      rows={8}
                      placeholder="详细描述本次活动的背景、精彩亮点、现场安排及期待收获..."
                      style={{
                        ...inputStyle,
                        resize: "vertical",
                        lineHeight: "1.6",
                      }}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>活动流程安排 (选填)</label>
                    <textarea
                      value={formData.agenda}
                      onChange={(e) => updateForm("agenda", e.target.value)}
                      rows={4}
                      placeholder="例如：
14:00 - 14:30 现场签到与破冰互动
14:30 - 17:00 户外徒步与拍照打卡
17:00 - 19:30 草坪露营与晚间烧烤"
                      style={{
                        ...inputStyle,
                        resize: "vertical",
                        lineHeight: "1.5",
                      }}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      更多现场实拍 / 往期图集 (最多 6 张)
                    </label>
                    <div style={{ marginTop: "6px" }}>
                      <ImageUpload value={images} onChange={setImages} maxCount={6} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 右栏：时间、地点与费用报名 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ background: "white", borderRadius: "16px", padding: "1.75rem", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: "18px" }}>⏰</span>
                  <h3 style={{ fontSize: "16px", fontWeight: "800", margin: 0, color: "#0f172a" }}>
                    时间、地点与报名规则
                  </h3>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1.15rem" }}>
                  <div>
                    <label style={labelStyle}>活动开始时间 <span style={{ color: "#ef4444" }}>*</span></label>
                    <input
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => updateForm("startTime", e.target.value)}
                      required
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>活动结束时间 (选填)</label>
                    <input
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => updateForm("endTime", e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={labelStyle}>所在区域</label>
                      <select value={formData.region} onChange={(e) => updateForm("region", e.target.value)} style={inputStyle}>
                        <option value="杨林大学城">杨林大学城</option>
                        <option value="杨林经开区">杨林经开区</option>
                        <option value="杨林镇区">杨林镇区</option>
                        <option value="嵩明县城周边">嵩明周边</option>
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>举办具体地点 <span style={{ color: "#ef4444" }}>*</span></label>
                      <input
                        value={formData.location}
                        onChange={(e) => updateForm("location", e.target.value)}
                        required
                        placeholder="如：中央草坪公园"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>集合地点 (选填)</label>
                    <input
                      value={formData.assemblyPoint}
                      onChange={(e) => updateForm("assemblyPoint", e.target.value)}
                      placeholder="例如：公园正门入口处大树旁"
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={labelStyle}>费用类型</label>
                      <select value={formData.feeType} onChange={(e) => updateForm("feeType", e.target.value)} style={inputStyle}>
                        <option value="免费">免费活动</option>
                        <option value="AA制">AA制分摊</option>
                        <option value="收费">固定收费</option>
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>人数上限</label>
                      <input
                        value={formData.quota}
                        onChange={(e) => updateForm("quota", e.target.value)}
                        placeholder="例如：30人 / 不限"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  {formData.feeType !== "免费" && (
                    <div>
                      <label style={labelStyle}>费用详细说明</label>
                      <input
                        value={formData.feeDetail}
                        onChange={(e) => updateForm("feeDetail", e.target.value)}
                        placeholder="例如：场地费 30元/人，含饮水烧烤"
                        style={inputStyle}
                      />
                    </div>
                  )}

                  <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "1rem", marginTop: "0.5rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={labelStyle}>发起人/主办方 <span style={{ color: "#ef4444" }}>*</span></label>
                        <input
                          value={formData.organizer}
                          onChange={(e) => updateForm("organizer", e.target.value)}
                          required
                          placeholder="例如：杨林户外俱乐部"
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>联系电话/微信 <span style={{ color: "#ef4444" }}>*</span></label>
                        <input
                          value={formData.phone}
                          onChange={(e) => updateForm("phone", e.target.value)}
                          required
                          placeholder="例如：13800138000"
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 提交卡片 */}
              <div style={{ background: "white", borderRadius: "16px", padding: "1.5rem", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: "100%",
                    padding: "14px",
                    background: submitting ? "#94a3b8" : "linear-gradient(135deg, #047857 0%, #0d9488 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "16px",
                    fontWeight: "800",
                    cursor: submitting ? "not-allowed" : "pointer",
                    boxShadow: "0 6px 18px rgba(4, 120, 87, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.15s",
                  }}
                >
                  <span>{submitting ? "⏳" : "🚀"}</span>
                  <span>{submitting ? "正在发布中..." : "立即免费发起同城活动"}</span>
                </button>

                <div style={{ marginTop: "1rem", fontSize: "12px", color: "#94a3b8", lineHeight: "1.5", textAlign: "center" }}>
                  💡 活动提交后将进入审核队列，审核通过后即在全城活动大厅上线展示。
                </div>
              </div>
            </div>

          </div>
        </form>
      </main>
    </div>
  );
}
