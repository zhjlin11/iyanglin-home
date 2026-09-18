"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ImageUpload from "@/components/ImageUpload";
import AuthGuard from "@/components/AuthGuard";
import {
  Car,
  ShoppingBag,
  Wrench,
  Laptop,
  Wheat,
  UtensilsCrossed,
  Briefcase,
  Dog,
  GraduationCap,
  LifeBuoy,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Camera,
  UserCheck,
  Sparkles,
  ArrowRight,
  Check,
} from "lucide-react";
import {
  INFO_CATEGORIES,
  INFO_AREAS,
  ITEM_CONDITIONS,
  getCategoryByKey,
} from "@/lib/info-categories";

const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  used: ShoppingBag,
  carpool: Car,
  service: Wrench,
  digital: Laptop,
  agri: Wheat,
  food: UtensilsCrossed,
  business: Briefcase,
  pet: Dog,
  tutoring: GraduationCap,
  help: LifeBuoy,
};

export default function NewInfoListingPage() {
  const router = useRouter();

  // 当前向导步骤 (1 到 5)
  const [currentStep, setCurrentStep] = useState(1);

  // 步骤 1: 类别选择 (默认: used)
  const [selectedCategoryKey, setSelectedCategoryKey] = useState("used");
  const currentCategory = getCategoryByKey(selectedCategoryKey) || INFO_CATEGORIES[0];

  // 步骤 2: 供求类型与细分子类
  const [itemType, setItemType] = useState<"OFFER" | "WANTED">("OFFER");
  const [subCategory, setSubCategory] = useState(
    currentCategory.subCategories[1] || currentCategory.subCategories[0] || ""
  );

  // 步骤 3: 基础字段与动态字段
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [price, setPrice] = useState("");
  const [priceUnit, setPriceUnit] = useState("元");
  const [condition, setCondition] = useState("9成新 (功能完好)");
  const [area, setArea] = useState<string>("杨林大学城");
  const [address, setAddress] = useState("");

  // 顺风车专属
  const [fromPlace, setFromPlace] = useState("");
  const [toPlace, setToPlace] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [seats, setSeats] = useState("3");
  const [carModel, setCarModel] = useState("私家轿车");
  const [viaRoute, setViaRoute] = useState("");

  // 二手专属
  const [negotiable, setNegotiable] = useState(true);
  const [deliveryMethod, setDeliveryMethod] = useState("大学城/经开区面交自提");

  // 家政维修专属
  const [isHomeService, setIsHomeService] = useState(true);
  const [serviceType, setServiceType] = useState("家庭维修/疏通保洁");
  const [pricingMethod, setPricingMethod] = useState("勘测后按次报价");

  // 数码专属
  const [brandModel, setBrandModel] = useState("");
  const [storageSpec, setStorageSpec] = useState("");
  const [warranty, setWarranty] = useState(true);

  // 宠物生活专属
  const [petType, setPetType] = useState("猫咪");
  const [petAge, setPetAge] = useState("幼宠 (3-6个月)");
  const [isVaccinated, setIsVaccinated] = useState(true);

  // 学习辅导专属
  const [subject, setSubject] = useState("英语/数学");
  const [grade, setGrade] = useState("中小学/大学四六级");
  const [tutoringMode, setTutoringMode] = useState("一对一上门");

  // 便民求助专属
  const [helpCategory, setHelpCategory] = useState("生活求助");
  const [urgency, setUrgency] = useState("普通互助");
  const [reward, setReward] = useState("互助免费 / 奶茶酬谢");

  // 步骤 4: 图片列表
  const [images, setImages] = useState<string[]>([]);

  // 步骤 5: 联系方式与实名
  const [contactName, setContactName] = useState("");
  const [contact, setContact] = useState("");
  const [wechat, setWechat] = useState("");
  const [agreeRules, setAgreeRules] = useState(true);

  // 提交状态
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successResult, setSuccessResult] = useState<{ id: string; status: string } | null>(null);

  // 尝试自动填充当前登录用户数据
  useEffect(() => {
    fetch("/api/users/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          if (data.user.phone && !contact) setContact(data.user.phone);
          if (data.user.nickname && !contactName) setContactName(data.user.nickname);
        }
      })
      .catch(() => {});
  }, []);

  // 解析 URL 查询参数以预选分类与供求类型 (?cat=service / ?cat=used / ?type=WANTED / ?sub=...)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get("cat") || params.get("category");
      const requestedType = params.get("type");
      const sub = params.get("sub");

      if (cat) {
        const targetCat = getCategoryByKey(cat);
        if (targetCat) {
          setSelectedCategoryKey(targetCat.key);
          if (sub && targetCat.subCategories.includes(sub)) {
            setSubCategory(sub);
          } else {
            setSubCategory(targetCat.subCategories[1] || targetCat.subCategories[0] || "");
          }
          if (requestedType === "WANTED" || requestedType === "demand") {
            setItemType("WANTED");
          } else if (requestedType === "OFFER") {
            setItemType("OFFER");
          }
          if (targetCat.key === "carpool") {
            setPriceUnit("元/位");
            setPrice("25");
          } else if (targetCat.key === "service") {
            setPriceUnit("元/次");
            setPrice("面议");
          } else if (targetCat.key === "tutoring") {
            setPriceUnit("元/小时");
            setPrice("80");
          } else if (targetCat.key === "help") {
            setPrice("免费");
          }
        }
      }
    } catch {}
  }, []);

  // 切换大分类时重置子分类与供求
  const handleCategoryChange = (catKey: string) => {
    setSelectedCategoryKey(catKey);
    const cat = getCategoryByKey(catKey);
    if (cat) {
      const validSub = cat.subCategories[1] || cat.subCategories[0] || "";
      setSubCategory(validSub);
      const defaultType = cat.fieldConfig.itemTypes[0]?.value;
      setItemType(defaultType === "WANTED" ? "WANTED" : "OFFER");

      // 为不同分类初始化合理的价格单位与默认值
      if (catKey === "carpool") {
        setPriceUnit("元/位");
        setPrice("25");
      } else if (catKey === "service") {
        setPriceUnit("元/次");
        setPrice("面议");
      } else if (catKey === "tutoring") {
        setPriceUnit("元/小时");
        setPrice("80");
      } else if (catKey === "help") {
        setPrice("免费");
      } else {
        setPriceUnit("元");
      }
    }
  };

  // 步骤验证
  const validateStep = (step: number): boolean => {
    setErrorMessage("");
    if (step === 1) {
      return true;
    }
    if (step === 2) {
      if (!subCategory) {
        setErrorMessage("请选择细分子类别");
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (!title.trim()) {
        setErrorMessage("请填写信息标题（不少于5字）");
        return false;
      }
      if (title.trim().length < 4) {
        setErrorMessage("标题过短，请补充明确描述");
        return false;
      }
      if (!body.trim()) {
        setErrorMessage("请填写详细说明，方便街坊了解");
        return false;
      }
      if (selectedCategoryKey === "carpool") {
        if (!fromPlace.trim() || !toPlace.trim()) {
          setErrorMessage("请填写顺风车出发地与目的地");
          return false;
        }
        if (!departureTime.trim()) {
          setErrorMessage("请填写发车时间");
          return false;
        }
      }
      return true;
    }
    if (step === 4) {
      // 图片非强求，但建议有图
      return true;
    }
    if (step === 5) {
      if (!contact.trim()) {
        setErrorMessage("请填写联系手机号");
        return false;
      }
      if (!/^1[3-9]\d{9}$/.test(contact.trim())) {
        setErrorMessage("手机号格式不正确，请填写11位手机号码");
        return false;
      }
      if (!contactName.trim()) {
        setErrorMessage("请填写您的称呼（如：陈先生、王同学）");
        return false;
      }
      if (!agreeRules) {
        setErrorMessage("请勾选并同意发布规则与真实性承诺");
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(5, prev + 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevStep = () => {
    setErrorMessage("");
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 提交发布
  const handleSubmit = async () => {
    if (!validateStep(5)) return;

    setSubmitting(true);
    setErrorMessage("");

    try {
      // 组装分类动态扩展字段 (extraData)
      let extraData: Record<string, any> = {};
      if (selectedCategoryKey === "carpool") {
        extraData = { seats, carModel, viaRoute };
      } else if (selectedCategoryKey === "used") {
        extraData = { negotiable, deliveryMethod };
      } else if (selectedCategoryKey === "service") {
        extraData = { isHomeService, serviceType, pricingMethod };
      } else if (selectedCategoryKey === "digital") {
        extraData = { brandModel, storageSpec, warranty, negotiable };
      } else if (selectedCategoryKey === "pet") {
        extraData = { petType, petAge, isVaccinated };
      } else if (selectedCategoryKey === "tutoring") {
        extraData = { subject, grade, tutoringMode };
      } else if (selectedCategoryKey === "help") {
        extraData = { helpCategory, urgency, reward };
      }

      const payload = {
        title: title.trim(),
        category: currentCategory.name,
        subCategory: subCategory.trim(),
        itemType,
        price: price.trim() || "面议",
        priceUnit: priceUnit || "元",
        condition: currentCategory.fieldConfig.showCondition ? condition : undefined,
        area,
        address: address.trim() || undefined,
        contact: contact.trim(),
        contactName: contactName.trim() || undefined,
        wechat: wechat.trim() || undefined,
        body: body.trim(),
        images,
        extraData,
        // 顺风车核心字段
        fromPlace: selectedCategoryKey === "carpool" ? fromPlace.trim() : undefined,
        toPlace: selectedCategoryKey === "carpool" ? toPlace.trim() : undefined,
        departureTime: selectedCategoryKey === "carpool" ? departureTime.trim() : undefined,
      };

      const res = await fetch("/api/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "发布失败，请稍后重试");
      }

      setSuccessResult({
        id: data.item.id,
        status: data.item.status,
      });
    } catch (err: any) {
      setErrorMessage(err.message || "网络请求异常，请检查网络连接");
    } finally {
      setSubmitting(false);
    }
  };

  const stepsMeta = [
    { num: 1, title: "选择大类", desc: "10大便民分类" },
    { num: 2, title: "供求与子类", desc: "精准细分定位" },
    { num: 3, title: "核心动态信息", desc: "行程/成色/描述" },
    { num: 4, title: "照片图集", desc: "最多9张现场照" },
    { num: 5, title: "联系人与核验", desc: "实名手机联系" },
  ];

  return (
    <AuthGuard pageTitle="免费发布便民信息">
      <div className="new-info-page" style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: "5rem" }}>
        <Navbar />

        {/* 顶部标题栏 */}
        <section
          style={{
            background: "linear-gradient(135deg, #064E4B 0%, #0B7A75 100%)",
            color: "white",
            padding: "1.5rem 1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div
            className="shell"
            style={{
              maxWidth: "880px",
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(255,255,255,0.18)",
                  padding: "3px 10px",
                  borderRadius: "14px",
                  fontSize: "12px",
                  fontWeight: "700",
                  marginBottom: "6px",
                }}
              >
                <Sparkles size={13} color="#fde047" />
                <span>杨林同城互助生活服务</span>
              </div>
              <h1 style={{ fontSize: "22px", fontWeight: "900", margin: 0 }}>
                免费发布便民综合信息
              </h1>
            </div>

            <Link
              href="/info"
              style={{
                color: "white",
                background: "rgba(255,255,255,0.15)",
                padding: "8px 16px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: "700",
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.3)",
              }}
            >
              ← 返回信息大厅
            </Link>
          </div>
        </section>

        {/* 主体向导容器 */}
        <main className="shell" style={{ maxWidth: "880px", margin: "0 auto", padding: "0 1rem" }}>
          {/* 发布成功卡片 */}
          {successResult ? (
            <div
              style={{
                background: "white",
                borderRadius: "20px",
                padding: "3rem 2rem",
                textAlign: "center",
                boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  background: "#dcfce7",
                  color: "#15803d",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1.25rem",
                  fontSize: "36px",
                }}
              >
                ✓
              </div>
              <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#0f172a", margin: "0 0 8px 0" }}>
                信息提交成功！
              </h2>
              <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.6", margin: "0 0 1.5rem 0" }}>
                {successResult.status === "APPROVED"
                  ? "已即时上架发布至杨林便民信息大厅，街坊邻里现在即可浏览联系您。"
                  : "您的便民信息已成功提交，工作人员正极速审核中（通常5~10分钟），审核通过后将全网展示。"}
              </p>

              <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                <Link
                  href={`/info/${successResult.id}`}
                  style={{
                    background: "#0B7A75",
                    color: "white",
                    padding: "11px 28px",
                    borderRadius: "24px",
                    fontWeight: "800",
                    fontSize: "14px",
                    textDecoration: "none",
                  }}
                >
                  查看该信息详情
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSuccessResult(null);
                    setCurrentStep(1);
                    setTitle("");
                    setBody("");
                    setImages([]);
                  }}
                  style={{
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    padding: "11px 24px",
                    borderRadius: "24px",
                    fontWeight: "700",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  继续发布新信息
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* 5 步进度指示器 */}
              <div className="step-progress-bar">
                {stepsMeta.map((s) => {
                  const isDone = s.num < currentStep;
                  const isCurrent = s.num === currentStep;
                  return (
                    <div key={s.num} className={`step-item ${isCurrent ? "current" : isDone ? "done" : ""}`}>
                      <div className="step-circle">
                        {isDone ? <Check size={14} /> : s.num}
                      </div>
                      <div className="step-label">
                        <span className="step-title">{s.title}</span>
                        <span className="step-desc">{s.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 错误提示框 */}
              {errorMessage && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#b91c1c",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    fontSize: "13.5px",
                    marginBottom: "1.25rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    animation: "fadeIn 0.2s ease-out",
                  }}
                >
                  <AlertCircle size={18} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 表单卡片容器 */}
              <div
                style={{
                  background: "white",
                  borderRadius: "18px",
                  padding: "1.75rem 1.5rem",
                  boxShadow: "0 2px 14px rgba(0,0,0,0.03)",
                  border: "1px solid #e2e8f0",
                  marginBottom: "2rem",
                }}
              >
                {/* ────────────────────────────────────────────────
                    步骤 1: 选择大分类 (1/5)
                    ──────────────────────────────────────────────── */}
                {currentStep === 1 && (
                  <div>
                    <h3 style={{ fontSize: "17px", fontWeight: "900", color: "#0f172a", margin: "0 0 6px 0" }}>
                      第一步：请选择您要发布的信息类别 (1/5)
                    </h3>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 1.25rem 0" }}>
                      选择精准的分类有助于同城邻里和客户极速找到您的信息。
                    </p>

                    <div className="cat-select-grid">
                      {INFO_CATEGORIES.map((cat) => {
                        const IconComp = CATEGORY_ICON_MAP[cat.key] || ShoppingBag;
                        const isSelected = selectedCategoryKey === cat.key;
                        return (
                          <div
                            key={cat.key}
                            onClick={() => handleCategoryChange(cat.key)}
                            className={`cat-card ${isSelected ? "selected" : ""}`}
                          >
                            <div className="cat-card-icon">
                              <IconComp size={24} />
                            </div>
                            <div className="cat-card-text">
                              <span className="cat-name">{cat.name}</span>
                              <span className="cat-examples">{cat.desc || cat.description}</span>
                            </div>
                            {isSelected && (
                              <div className="cat-check-badge">
                                <Check size={13} color="white" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ────────────────────────────────────────────────
                    步骤 2: 供求性质与细分子类 (2/5)
                    ──────────────────────────────────────────────── */}
                {currentStep === 2 && (
                  <div>
                    <h3 style={{ fontSize: "17px", fontWeight: "900", color: "#0f172a", margin: "0 0 6px 0" }}>
                      第二步：明确供求类型与细分子类 (2/5)
                    </h3>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 1.25rem 0" }}>
                      当前分类：<b style={{ color: "#0B7A75" }}>{currentCategory.name}</b>
                    </p>

                    {/* 供求类型单选 */}
                    <div style={{ marginBottom: "1.5rem" }}>
                      <label style={{ display: "block", fontSize: "13.5px", fontWeight: "800", color: "#334155", marginBottom: "8px" }}>
                        供求类型性质 <span style={{ color: "#e11d48" }}>*</span>
                      </label>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                        {currentCategory.fieldConfig.itemTypes.map((it) => {
                          const isSel = itemType === it.value;
                          return (
                            <button
                              key={it.value}
                              type="button"
                              onClick={() => setItemType(it.value as any)}
                              style={{
                                padding: "12px",
                                borderRadius: "12px",
                                border: isSel ? "2px solid #0B7A75" : "1px solid #cbd5e1",
                                background: isSel ? "#f0fdfa" : "white",
                                color: isSel ? "#0B7A75" : "#334155",
                                fontWeight: isSel ? "900" : "600",
                                fontSize: "14px",
                                cursor: "pointer",
                                textAlign: "center",
                                transition: "all 0.15s",
                              }}
                            >
                              {it.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 细分子类选择 */}
                    <div style={{ marginBottom: "1.5rem" }}>
                      <label style={{ display: "block", fontSize: "13.5px", fontWeight: "800", color: "#334155", marginBottom: "8px" }}>
                        细分子类目 <span style={{ color: "#e11d48" }}>*</span>
                      </label>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {currentCategory.subCategories.map((sub) => {
                          const isSel = subCategory === sub;
                          return (
                            <button
                              key={sub}
                              type="button"
                              onClick={() => setSubCategory(sub)}
                              style={{
                                padding: "8px 16px",
                                borderRadius: "20px",
                                border: isSel ? "1px solid #0B7A75" : "1px solid #e2e8f0",
                                background: isSel ? "#0B7A75" : "#f8fafc",
                                color: isSel ? "white" : "#475569",
                                fontWeight: isSel ? "800" : "500",
                                fontSize: "13px",
                                cursor: "pointer",
                                transition: "all 0.15s",
                              }}
                            >
                              {sub}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* ────────────────────────────────────────────────
                    步骤 3: 核心内容与动态参数 (3/5)
                    ──────────────────────────────────────────────── */}
                {currentStep === 3 && (
                  <div>
                    <h3 style={{ fontSize: "17px", fontWeight: "900", color: "#0f172a", margin: "0 0 6px 0" }}>
                      第三步：填写核心信息与分类专属参数 (3/5)
                    </h3>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 1.25rem 0" }}>
                      信息越详尽真实，获得街坊快速响应的概率越高。
                    </p>

                    {/* 信息标题 */}
                    <div style={{ marginBottom: "1.25rem" }}>
                      <label style={{ display: "block", fontSize: "13.5px", fontWeight: "800", color: "#334155", marginBottom: "6px" }}>
                        信息标题 <span style={{ color: "#e11d48" }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="例：九成新电动车急转 / 明早杨林大学城去长水机场顺风车"
                        maxLength={50}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: "10px",
                          border: "1px solid #cbd5e1",
                          fontSize: "14.5px",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                      <div style={{ fontSize: "11px", color: "#94a3b8", textAlign: "right", marginTop: "4px" }}>
                        {title.length}/50
                      </div>
                    </div>

                    {/* 顺风车专属动态字段 */}
                    {selectedCategoryKey === "carpool" && (
                      <div className="dynamic-box">
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px", color: "#0B7A75", fontWeight: "800" }}>
                          <Car size={16} />
                          <span>顺风车行程核心参数</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginBottom: "10px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                              出发地 <span style={{ color: "#e11d48" }}>*</span>
                            </label>
                            <input
                              type="text"
                              value={fromPlace}
                              onChange={(e) => setFromPlace(e.target.value)}
                              placeholder="例：云南工商学院南门"
                              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                              目的地 <span style={{ color: "#e11d48" }}>*</span>
                            </label>
                            <input
                              type="text"
                              value={toPlace}
                              onChange={(e) => setToPlace(e.target.value)}
                              placeholder="例：昆明长水机场 / 北部客运站"
                              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                            />
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                              发车时间 <span style={{ color: "#e11d48" }}>*</span>
                            </label>
                            <input
                              type="text"
                              value={departureTime}
                              onChange={(e) => setDepartureTime(e.target.value)}
                              placeholder="例：明天 08:30"
                              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                              剩余座位
                            </label>
                            <select
                              value={seats}
                              onChange={(e) => setSeats(e.target.value)}
                              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box", background: "white" }}
                            >
                              {["1", "2", "3", "4", "5", "6"].map((n) => (
                                <option key={n} value={n}>{n} 位</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                              车型
                            </label>
                            <select
                              value={carModel}
                              onChange={(e) => setCarModel(e.target.value)}
                              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box", background: "white" }}
                            >
                              {["私家轿车", "SUV", "商务MPV", "新能源纯电"].map((m) => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 二手闲置专属动态字段 */}
                    {(selectedCategoryKey === "used" || selectedCategoryKey === "digital") && (
                      <div className="dynamic-box">
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px", color: "#0B7A75", fontWeight: "800" }}>
                          <ShoppingBag size={16} />
                          <span>物品成色与交易偏好</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                              成色情况
                            </label>
                            <select
                              value={condition}
                              onChange={(e) => setCondition(e.target.value)}
                              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box", background: "white" }}
                            >
                              {ITEM_CONDITIONS.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                              是否议价
                            </label>
                            <select
                              value={negotiable ? "yes" : "no"}
                              onChange={(e) => setNegotiable(e.target.value === "yes")}
                              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box", background: "white" }}
                            >
                              <option value="yes">支持小刀诚心议价</option>
                              <option value="no">一口价谢绝还价</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 家政维修专属动态字段 */}
                    {selectedCategoryKey === "service" && (
                      <div className="dynamic-box">
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px", color: "#0B7A75", fontWeight: "800" }}>
                          <Wrench size={16} />
                          <span>家政与维修服务选项</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                              上门服务支持
                            </label>
                            <select
                              value={isHomeService ? "yes" : "no"}
                              onChange={(e) => setIsHomeService(e.target.value === "yes")}
                              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box", background: "white" }}
                            >
                              <option value="yes">支持免费/预约上门服务</option>
                              <option value="no">仅限门店服务</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                              计价方式
                            </label>
                            <input
                              type="text"
                              value={pricingMethod}
                              onChange={(e) => setPricingMethod(e.target.value)}
                              placeholder="例：上门勘测后报价 / 30元/小时"
                              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 价格与区域 */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "1.25rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "13.5px", fontWeight: "800", color: "#334155", marginBottom: "6px" }}>
                          期望价格 / 资费说明
                        </label>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <input
                            type="text"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="如：50 或 面议"
                            style={{ flex: 1, padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                          />
                          <input
                            type="text"
                            value={priceUnit}
                            onChange={(e) => setPriceUnit(e.target.value)}
                            placeholder="单位(元)"
                            style={{ width: "70px", padding: "9px 8px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", textAlign: "center", boxSizing: "border-box" }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "13.5px", fontWeight: "800", color: "#334155", marginBottom: "6px" }}>
                          所在片区 <span style={{ color: "#e11d48" }}>*</span>
                        </label>
                        <select
                          value={area}
                          onChange={(e) => setArea(e.target.value)}
                          style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", background: "white", boxSizing: "border-box" }}
                        >
                          {INFO_AREAS.filter((a: string) => a !== "全部区域").map((a: string) => (
                            <option key={a} value={a}>{a}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* 详细描述 */}
                    <div style={{ marginBottom: "1.25rem" }}>
                      <label style={{ display: "block", fontSize: "13.5px", fontWeight: "800", color: "#334155", marginBottom: "6px" }}>
                        详细说明内容 <span style={{ color: "#e11d48" }}>*</span>
                      </label>
                      <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="请详细描述具体情况、规格、成色、交易地点或注意事项..."
                        rows={5}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: "10px",
                          border: "1px solid #cbd5e1",
                          fontSize: "14px",
                          outline: "none",
                          boxSizing: "border-box",
                          resize: "vertical",
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* ────────────────────────────────────────────────
                    步骤 4: 照片图集上传 (4/5)
                    ──────────────────────────────────────────────── */}
                {currentStep === 4 && (
                  <div>
                    <h3 style={{ fontSize: "17px", fontWeight: "900", color: "#0f172a", margin: "0 0 6px 0" }}>
                      第四步：上传真实照片图集 (4/5)
                    </h3>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 1.25rem 0" }}>
                      最多支持上传 9 张照片。附带真实照片的信息浏览量是普通信息的 3.8 倍！
                    </p>

                    <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "14px", border: "1px dashed #cbd5e1" }}>
                      <ImageUpload
                        value={images}
                        onChange={setImages}
                        maxCount={9}
                      />
                    </div>
                    <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "8px" }}>
                      💡 提示：第一张图片将默认作为封面展示在大厅列表中。
                    </div>
                  </div>
                )}

                {/* ────────────────────────────────────────────────
                    步骤 5: 联系人与真实性核验 (5/5)
                    ──────────────────────────────────────────────── */}
                {currentStep === 5 && (
                  <div>
                    <h3 style={{ fontSize: "17px", fontWeight: "900", color: "#0f172a", margin: "0 0 6px 0" }}>
                      第五步：联系方式与实名核验 (5/5)
                    </h3>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 1.25rem 0" }}>
                      杨林生活网采用隐私电话保护机制，防止网络爬虫抓取您的联系方式。
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "1.25rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "13.5px", fontWeight: "800", color: "#334155", marginBottom: "6px" }}>
                          您的称呼 <span style={{ color: "#e11d48" }}>*</span>
                        </label>
                        <input
                          type="text"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="例：陈先生 / 李同学"
                          style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "13.5px", fontWeight: "800", color: "#334155", marginBottom: "6px" }}>
                          联系手机号 <span style={{ color: "#e11d48" }}>*</span>
                        </label>
                        <input
                          type="tel"
                          value={contact}
                          onChange={(e) => setContact(e.target.value)}
                          placeholder="11位手机号"
                          maxLength={11}
                          style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "1.5rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "13.5px", fontWeight: "800", color: "#334155", marginBottom: "6px" }}>
                          微信号 (选填)
                        </label>
                        <input
                          type="text"
                          value={wechat}
                          onChange={(e) => setWechat(e.target.value)}
                          placeholder="方便邻里添加微信"
                          style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "13.5px", fontWeight: "800", color: "#334155", marginBottom: "6px" }}>
                          详细地址 / 交易地点 (选填)
                        </label>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="例：文理学院东门 / 经开区管委会旁"
                          style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                        />
                      </div>
                    </div>

                    {/* 承诺勾选 */}
                    <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
                      <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", cursor: "pointer", fontSize: "13px", color: "#475569" }}>
                        <input
                          type="checkbox"
                          checked={agreeRules}
                          onChange={(e) => setAgreeRules(e.target.checked)}
                          style={{ marginTop: "3px", accentColor: "#0B7A75" }}
                        />
                        <span>
                          我保证所发布的内容与联系方式真实有效，绝不发布虚假兼职、网络赌博、高利贷等违规信息，同意遵守《杨林生活网便民信息发布规范》。
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* 底部导航操作条 (手机端贴底) */}
              <div className="step-bottom-bar">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={currentStep === 1}
                  className="step-btn prev"
                >
                  <ChevronLeft size={16} />
                  <span>上一步</span>
                </button>

                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="step-btn next"
                  >
                    <span>下一步 ({currentStep}/5)</span>
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="step-btn submit"
                  >
                    {submitting ? "提交审核中..." : "确认发布 (5/5)"}
                  </button>
                )}
              </div>
            </div>
          )}
        </main>

        {/* 样式 */}
        <style jsx>{`
          .step-progress-bar {
            display: flex;
            align-items: center;
            justifyContent: space-between;
            background: white;
            padding: 12px 20px;
            border-radius: 14px;
            border: 1px solid #e2e8f0;
            margin-bottom: 1.5rem;
          }
          .step-item {
            display: flex;
            align-items: center;
            gap: 8px;
            opacity: 0.55;
            transition: opacity 0.2s;
          }
          .step-item.current {
            opacity: 1;
          }
          .step-item.done {
            opacity: 0.9;
          }
          .step-circle {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: #f1f5f9;
            color: #64748b;
            display: flex;
            align-items: center;
            justifyContent: center;
            font-size: 13px;
            font-weight: 800;
          }
          .step-item.current .step-circle {
            background: #0B7A75;
            color: white;
          }
          .step-item.done .step-circle {
            background: #10b981;
            color: white;
          }
          .step-label {
            display: flex;
            flex-direction: column;
          }
          .step-title {
            font-size: 13px;
            font-weight: 800;
            color: #0f172a;
          }
          .step-desc {
            font-size: 11px;
            color: #94a3b8;
          }

          /* 分类选择网格 */
          .cat-select-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          .cat-card {
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 14px;
            display: flex;
            align-items: center;
            gap: 12px;
            cursor: pointer;
            position: relative;
            background: white;
            transition: all 0.15s ease;
          }
          .cat-card:hover {
            border-color: #cbd5e1;
            background: #f8fafc;
          }
          .cat-card.selected {
            border: 2px solid #0B7A75;
            background: #f0fdfa;
          }
          .cat-card-icon {
            width: 44px;
            height: 44px;
            border-radius: 10px;
            background: #f1f5f9;
            color: #0B7A75;
            display: flex;
            align-items: center;
            justifyContent: center;
            flex-shrink: 0;
          }
          .cat-card.selected .cat-card-icon {
            background: #0B7A75;
            color: white;
          }
          .cat-card-text {
            display: flex;
            flex-direction: column;
          }
          .cat-name {
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
          }
          .cat-examples {
            font-size: 11.5px;
            color: #64748b;
            margin-top: 2px;
          }
          .cat-check-badge {
            position: absolute;
            top: -6px;
            right: -6px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #0B7A75;
            display: flex;
            align-items: center;
            justifyContent: center;
          }

          /* 动态字段容器 */
          .dynamic-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 14px;
            margin-bottom: 1.25rem;
          }

          /* 底部导航条 */
          .step-bottom-bar {
            display: flex;
            align-items: center;
            justifyContent: space-between;
            gap: 12px;
          }
          .step-btn {
            display: inline-flex;
            align-items: center;
            justifyContent: center;
            gap: 6px;
            padding: 12px 24px;
            border-radius: 24px;
            font-size: 14px;
            font-weight: 800;
            cursor: pointer;
            transition: opacity 0.15s;
          }
          .step-btn:hover {
            opacity: 0.9;
          }
          .step-btn.prev {
            border: 1px solid #cbd5e1;
            background: white;
            color: #475569;
          }
          .step-btn.prev:disabled {
            opacity: 0.4;
            cursor: not-allowed;
          }
          .step-btn.next {
            border: none;
            background: #0B7A75;
            color: white;
          }
          .step-btn.submit {
            border: none;
            background: #10b981;
            color: white;
          }

          /* 移动端 (390×844) 适配 */
          @media (max-width: 768px) {
            .step-progress-bar {
              padding: 10px 12px;
            }
            .step-desc {
              display: none;
            }
            .step-title {
              font-size: 11px;
            }
            .cat-select-grid {
              grid-template-columns: 1fr !important;
            }
            .step-bottom-bar {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              background: white;
              border-top: 1px solid #e2e8f0;
              padding: 10px 16px calc(10px + env(safe-area-inset-bottom, 0px));
              z-index: 99;
              box-shadow: 0 -4px 16px rgba(0,0,0,0.05);
            }
            .step-btn {
              flex: 1;
              padding: 12px !important;
            }
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </AuthGuard>
  );
}
