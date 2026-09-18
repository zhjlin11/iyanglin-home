"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import ImageUpload from "@/components/ImageUpload";
import { buildHouseBody } from "@/lib/house-parser";
import AuthGuard from "@/components/AuthGuard";
import Link from "next/link";

const publishTypes = [
  { id: "rent", label: "房屋出租", icon: "🏠", desc: "整租 / 合租 / 青年公寓", baseType: "rent" },
  { id: "sell", label: "房屋出售", icon: "🔑", desc: "二手商品房 / 自建房", baseType: "secondhand" },
  { id: "buy", label: "求租求购", icon: "🔍", desc: "求租房源 / 找室友合租", baseType: "rent" },
  { id: "shop", label: "商铺门面", icon: "🏪", desc: "临街旺铺出租 / 转让", baseType: "shop" },
  { id: "factory", label: "厂房仓库", icon: "🏭", desc: "经开区厂房 / 库房车间", baseType: "shop" },
];

export default function NewHousePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [publishType, setPublishType] = useState("rent");
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    region: "杨林大学城",
    community: "",
    layout: "2室1厅",
    areaSize: "",
    floor: "中楼层",
    facing: "南向",
    decoration: "精装修",
    contactName: "",
    contactPhone: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [createdId, setCreatedId] = useState<string | null>(null);

  const selectedTypeObj = publishTypes.find((t) => t.id === publishType)!;

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (currentStep === 2) {
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (currentStep === 3) {
      if (!formData.title.trim()) {
        setMessage("⚠️ 请输入房源标题");
        return;
      }
      if (!formData.contactPhone.trim()) {
        setMessage("⚠️ 请输入联系人电话");
        return;
      }
      if (!formData.description.trim()) {
        setMessage("⚠️ 请输入房源详细描述");
        return;
      }
      setMessage("");
      setCurrentStep(4); // 预览
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      setMessage("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setMessage("正在提交房源审核，请稍候...");

    const body = buildHouseBody({
      houseType: selectedTypeObj.label,
      price: formData.price,
      layout: formData.layout,
      areaSize: formData.areaSize,
      location: `${formData.region} · ${formData.community || "周边"}`,
      decoration: formData.decoration,
      floor: formData.floor,
      facing: formData.facing,
      contactIdentity: formData.contactName || "房东",
      description: formData.description,
    });

    try {
      const response = await fetch("/api/house", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          houseType: selectedTypeObj.baseType,
          price: formData.price || "面议",
          layout: formData.layout || "2室1厅",
          areaSize: formData.areaSize ? `${formData.areaSize}㎡` : "77㎡",
          location: `${formData.region} · ${formData.community || "周边"}`,
          contact: formData.contactPhone,
          body,
          status: "pending",
          images,
        }),
      });

      const res = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = `/login?redirect=${encodeURIComponent("/house/new")}`;
          return;
        }
        setMessage(res.error || "发布房源失败，请检查填写内容");
        setSubmitting(false);
        return;
      }

      setCreatedId(res.item?.id || "success");
      setCurrentStep(5); // 提交审核成功
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setMessage("网络请求失败，请稍后重试");
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <div style={{ minHeight: "100vh", background: "#F6F7F9", paddingBottom: "5rem" }}>
        <Navbar />

        <div className="shell content-shell" style={{ maxWidth: "680px", margin: "1rem auto", padding: "0 1rem" }}>
          {/* 步骤条进度指示器 (Step 1 ~ 5) */}
          <div style={{ background: "white", borderRadius: "16px", padding: "16px 12px", marginBottom: "1rem", boxShadow: "0 2px 8px rgba(0,0,0,0.03)", border: "1px solid #E5E7EB" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {[
                { step: 1, label: "选类型" },
                { step: 2, label: "传照片" },
                { step: 3, label: "填信息" },
                { step: 4, label: "预览" },
                { step: 5, label: "审核" },
              ].map((s, index) => {
                const isActive = currentStep === s.step;
                const isPassed = currentStep > s.step;
                return (
                  <div key={s.step} style={{ display: "flex", alignItems: "center", flex: index < 4 ? 1 : "initial" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          background: isActive ? "#16A67A" : isPassed ? "#EAF8F3" : "#F3F4F6",
                          color: isActive ? "#ffffff" : isPassed ? "#16A67A" : "#9CA3AF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: "800",
                        }}
                      >
                        {isPassed ? "✓" : s.step}
                      </div>
                      <span style={{ fontSize: "11px", fontWeight: isActive ? "800" : "600", color: isActive ? "#16A67A" : "#6B7280" }}>
                        {s.label}
                      </span>
                    </div>
                    {index < 4 && (
                      <div style={{ flex: 1, height: "2px", background: isPassed ? "#16A67A" : "#E5E7EB", margin: "0 6px", marginBottom: "14px" }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {message && (
            <div style={{ background: "#FEE2E2", color: "#B91C1C", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: "700", marginBottom: "1rem" }}>
              {message}
            </div>
          )}

          {/* ================= STEP 1: 你要发布什么？ ================= */}
          {currentStep === 1 && (
            <div style={{ background: "white", borderRadius: "16px", padding: "24px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)", border: "1px solid #E5E7EB" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "900", color: "#1F2937", margin: "0 0 6px 0" }}>
                你要发布什么房源？
              </h2>
              <p style={{ fontSize: "13px", color: "#6B7280", margin: "0 0 1.5rem 0" }}>
                请选择对应的房产类别，我们将为您匹配专属字段
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {publishTypes.map((t) => {
                  const selected = publishType === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setPublishType(t.id)}
                      style={{
                        padding: "16px",
                        borderRadius: "14px",
                        border: selected ? "2px solid #16A67A" : "1px solid #E5E7EB",
                        background: selected ? "#EAF8F3" : "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "28px" }}>{t.icon}</span>
                        <div>
                          <div style={{ fontSize: "15px", fontWeight: "800", color: selected ? "#087A5B" : "#1F2937" }}>
                            {t.label}
                          </div>
                          <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "2px" }}>
                            {t.desc}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          border: selected ? "6px solid #16A67A" : "2px solid #D1D5DB",
                          background: "#ffffff",
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                style={{
                  width: "100%",
                  marginTop: "2rem",
                  background: "#16A67A",
                  color: "#ffffff",
                  border: "none",
                  padding: "14px",
                  borderRadius: "12px",
                  fontSize: "15px",
                  fontWeight: "800",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(22, 166, 122, 0.25)",
                }}
              >
                下一步：上传照片 →
              </button>
            </div>
          )}

          {/* ================= STEP 2: 上传图片 (最多20张，第一张为封面) ================= */}
          {currentStep === 2 && (
            <div style={{ background: "white", borderRadius: "16px", padding: "24px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)", border: "1px solid #E5E7EB" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "900", color: "#1F2937", margin: "0 0 6px 0" }}>
                上传房屋实景照片
              </h2>
              <p style={{ fontSize: "13px", color: "#6B7280", margin: "0 0 1.25rem 0" }}>
                支持最多 20 张图片，第一张将作为房源列表封面展示
              </p>

              <ImageUpload
                value={images}
                onChange={setImages}
                maxCount={20}
              />

              <div style={{ display: "flex", gap: "10px", marginTop: "2rem" }}>
                <button
                  type="button"
                  onClick={handlePrevStep}
                  style={{
                    flex: 1,
                    background: "#F3F4F6",
                    color: "#4B5563",
                    border: "none",
                    padding: "14px",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  ← 上一步
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  style={{
                    flex: 2,
                    background: "#16A67A",
                    color: "#ffffff",
                    border: "none",
                    padding: "14px",
                    borderRadius: "12px",
                    fontSize: "15px",
                    fontWeight: "800",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(22, 166, 122, 0.25)",
                  }}
                >
                  下一步：填写房源详情 →
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: 填写详细信息 ================= */}
          {currentStep === 3 && (
            <div style={{ background: "white", borderRadius: "16px", padding: "24px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)", border: "1px solid #E5E7EB" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "900", color: "#1F2937", margin: "0 0 1.25rem 0" }}>
                填写房源信息
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* 标题 */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                    房源标题 <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="如：精装两室一厅 随时入住 房东直租"
                    className="info-input"
                  />
                </div>

                {/* 价格与户型 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                      租金 / 售价 <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.price}
                      onChange={(e) => handleInputChange("price", e.target.value)}
                      placeholder="如：1000元/月 或 65万"
                      className="info-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                      户型
                    </label>
                    <select
                      value={formData.layout}
                      onChange={(e) => handleInputChange("layout", e.target.value)}
                      className="info-select"
                    >
                      <option value="1室0厅">1室0厅 (单间/公寓)</option>
                      <option value="1室1厅">1室1厅</option>
                      <option value="2室1厅">2室1厅</option>
                      <option value="3室2厅">3室2厅</option>
                      <option value="4室2厅">4室2厅及以上</option>
                      <option value="商铺门面">商铺门面</option>
                      <option value="厂房仓库">厂房仓库</option>
                    </select>
                  </div>
                </div>

                {/* 区域与小区 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                      所在区域
                    </label>
                    <select
                      value={formData.region}
                      onChange={(e) => handleInputChange("region", e.target.value)}
                      className="info-select"
                    >
                      <option value="杨林大学城">杨林大学城</option>
                      <option value="杨林经开区">杨林经开区</option>
                      <option value="杨林镇中心">杨林镇中心</option>
                      <option value="嵩明职教园">嵩明职教园</option>
                      <option value="嘉丽泽">嘉丽泽生态城</option>
                      <option value="嵩明县城">嵩明县城</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                      小区 / 楼盘名称
                    </label>
                    <input
                      type="text"
                      value={formData.community}
                      onChange={(e) => handleInputChange("community", e.target.value)}
                      placeholder="如：云谷小镇 / 阳光水岸"
                      className="info-input"
                    />
                  </div>
                </div>

                {/* 面积与楼层与朝向 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                      面积 (㎡)
                    </label>
                    <input
                      type="number"
                      value={formData.areaSize}
                      onChange={(e) => handleInputChange("areaSize", e.target.value)}
                      placeholder="77"
                      className="info-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                      楼层
                    </label>
                    <select
                      value={formData.floor}
                      onChange={(e) => handleInputChange("floor", e.target.value)}
                      className="info-select"
                    >
                      <option value="低楼层">低楼层 (1-3层)</option>
                      <option value="中楼层">中楼层 (4-7层)</option>
                      <option value="高楼层">高楼层 (8层以上)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                      朝向
                    </label>
                    <select
                      value={formData.facing}
                      onChange={(e) => handleInputChange("facing", e.target.value)}
                      className="info-select"
                    >
                      <option value="南向">南向</option>
                      <option value="南北通透">南北通透</option>
                      <option value="东向">东向</option>
                      <option value="北向">北向</option>
                    </select>
                  </div>
                </div>

                {/* 装修程度 */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                    装修情况
                  </label>
                  <select
                    value={formData.decoration}
                    onChange={(e) => handleInputChange("decoration", e.target.value)}
                    className="info-select"
                  >
                    <option value="精装修">精装修 (拎包入住)</option>
                    <option value="简单装修">简单装修</option>
                    <option value="毛坯房">毛坯房</option>
                    <option value="豪华装修">豪华装修</option>
                  </select>
                </div>

                {/* 联系人与电话 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                      联系人称呼
                    </label>
                    <input
                      type="text"
                      value={formData.contactName}
                      onChange={(e) => handleInputChange("contactName", e.target.value)}
                      placeholder="如：李房东 / 张先生"
                      className="info-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                      联系电话 <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                      placeholder="如：138XXXXXXXX"
                      className="info-input"
                    />
                  </div>
                </div>

                {/* 详细描述 */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                    房源描述 <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="介绍一下房屋配套、交通、周边超市商场、看房时间要求等..."
                    className="info-textarea"
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "2rem" }}>
                <button
                  type="button"
                  onClick={handlePrevStep}
                  style={{
                    flex: 1,
                    background: "#F3F4F6",
                    color: "#4B5563",
                    border: "none",
                    padding: "14px",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  ← 上一步
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  style={{
                    flex: 2,
                    background: "#16A67A",
                    color: "#ffffff",
                    border: "none",
                    padding: "14px",
                    borderRadius: "12px",
                    fontSize: "15px",
                    fontWeight: "800",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(22, 166, 122, 0.25)",
                  }}
                >
                  下一步：预览房源 →
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 4: 预览房源 ================= */}
          {currentStep === 4 && (
            <div style={{ background: "white", borderRadius: "16px", padding: "24px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)", border: "1px solid #E5E7EB" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "900", color: "#1F2937", margin: "0 0 6px 0" }}>
                核对房源预览卡片
              </h2>
              <p style={{ fontSize: "13px", color: "#6B7280", margin: "0 0 1.25rem 0" }}>
                确认无误后点击下方按钮提交审核
              </p>

              {/* 模拟列表卡片效果 */}
              <div
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: "14px",
                  padding: "12px",
                  display: "flex",
                  gap: "12px",
                  background: "#F9FAFB",
                  marginBottom: "1.5rem",
                }}
              >
                <div style={{ width: "110px", height: "88px", borderRadius: "10px", overflow: "hidden", background: "#FFF7ED", flexShrink: 0 }}>
                  {images.length > 0 ? (
                    <img src={images[0]} alt="封面" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px" }}>
                      🏠
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "15px", fontWeight: "800", color: "#1F2937", marginBottom: "4px" }}>
                    {formData.title || "未填写标题"}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6B7280", marginBottom: "4px" }}>
                    {formData.layout} · {formData.areaSize ? `${formData.areaSize}㎡` : "77㎡"} · {formData.community || formData.region}
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: "900", color: "#FF8A00" }}>
                    {formData.price || "面议"}
                  </div>
                </div>
              </div>

              {/* 详细清单核对 */}
              <div style={{ background: "#F3F4F6", padding: "14px", borderRadius: "10px", fontSize: "13px", color: "#4B5563", lineHeight: "1.8", marginBottom: "1.5rem" }}>
                <div>📍 <b>位置：</b>{formData.region} · {formData.community}</div>
                <div>🛋️ <b>参数：</b>{formData.decoration} · {formData.floor} · {formData.facing}</div>
                <div>👤 <b>联系：</b>{formData.contactName} ({formData.contactPhone})</div>
                <div>📝 <b>描述：</b>{formData.description}</div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={handlePrevStep}
                  style={{
                    flex: 1,
                    background: "#F3F4F6",
                    color: "#4B5563",
                    border: "none",
                    padding: "14px",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  ← 返回修改
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{
                    flex: 2,
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
                  {submitting ? "正在提交..." : "✅ 确认并提交审核"}
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 5: 提交审核成功 ================= */}
          {currentStep === 5 && (
            <div style={{ background: "white", borderRadius: "16px", padding: "3rem 1.5rem", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.03)", border: "1px solid #E5E7EB" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#EAF8F3", color: "#16A67A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", margin: "0 auto 1rem auto" }}>
                ✓
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#1F2937", margin: "0 0 8px 0" }}>
                房源信息提交成功！
              </h2>
              <p style={{ fontSize: "14px", color: "#6B7280", margin: "0 0 2rem 0", lineHeight: "1.6" }}>
                平台运营人员将在 10 分钟内完成内容合规核验，审核通过后将第一时间展示在杨林房产大厅。
              </p>

              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <Link
                  href="/house"
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
                  返回房产大厅
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
                  查看我的发布
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </AuthGuard>
  );
}
