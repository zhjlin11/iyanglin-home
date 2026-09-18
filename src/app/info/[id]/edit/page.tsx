"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ImageUpload from "@/components/ImageUpload";
import AuthGuard from "@/components/AuthGuard";
import {
  INFO_CATEGORIES,
  INFO_AREAS,
  ITEM_CONDITIONS,
  getCategoryByKey,
  getCategoryByName,
} from "@/lib/info-categories";
import {
  AlertCircle,
  CheckCircle2,
  Package,
  Check,
  EyeOff,
  Car,
  ShoppingBag,
  Wrench,
  Trash2,
} from "lucide-react";

export default function EditInfoListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState<string>("APPROVED");
  const [selectedCategoryKey, setSelectedCategoryKey] = useState("used");
  const currentCategory = getCategoryByKey(selectedCategoryKey) || INFO_CATEGORIES[0];
  const [subCategory, setSubCategory] = useState("");
  const [itemType, setItemType] = useState<"OFFER" | "WANTED">("OFFER");

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [price, setPrice] = useState("");
  const [priceUnit, setPriceUnit] = useState("元");
  const [condition, setCondition] = useState("9成新 (功能完好)");
  const [area, setArea] = useState<string>("杨林经开区");
  const [address, setAddress] = useState("");

  const [fromPlace, setFromPlace] = useState("");
  const [toPlace, setToPlace] = useState("");
  const [departureTime, setDepartureTime] = useState("");

  // 扩展字段
  const [seats, setSeats] = useState("3");
  const [carModel, setCarModel] = useState("私家轿车");
  const [viaRoute, setViaRoute] = useState("");
  const [negotiable, setNegotiable] = useState(true);
  const [deliveryMethod, setDeliveryMethod] = useState("面交自提");
  const [isHomeService, setIsHomeService] = useState(true);
  const [serviceType, setServiceType] = useState("");

  const [contact, setContact] = useState("");
  const [contactName, setContactName] = useState("");
  const [wechat, setWechat] = useState("");
  const [images, setImages] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusActionMsg, setStatusActionMsg] = useState("");

  useEffect(() => {
    fetch(`/api/info/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.item) {
          const item = data.item;
          setCurrentStatus(item.status || "APPROVED");
          setTitle(item.title || "");
          setBody(item.body || "");
          setPrice(item.price === "面议" ? "" : item.price || "");
          setPriceUnit(item.priceUnit || "元");
          setCondition(item.condition || "9成新 (功能完好)");
          setArea(item.area || "杨林经开区");
          setAddress(item.address || "");
          setContact(item.contact || "");
          setContactName(item.contactName || "");
          setWechat(item.wechat || "");
          setImages(item.images || []);
          setFromPlace(item.fromPlace || "");
          setToPlace(item.toPlace || "");
          setDepartureTime(item.departureTime || "");
          setItemType(item.itemType === "WANTED" ? "WANTED" : "OFFER");

          // 恢复 extraData
          if (item.extraData && typeof item.extraData === "object") {
            const ex = item.extraData;
            if (ex.seats) setSeats(String(ex.seats));
            if (ex.carModel) setCarModel(ex.carModel);
            if (ex.viaRoute) setViaRoute(ex.viaRoute);
            if (ex.negotiable !== undefined) setNegotiable(ex.negotiable);
            if (ex.deliveryMethod) setDeliveryMethod(ex.deliveryMethod);
            if (ex.isHomeService !== undefined) setIsHomeService(ex.isHomeService);
            if (ex.serviceType) setServiceType(ex.serviceType);
          }

          const catObj = getCategoryByName(item.category) || getCategoryByKey(item.category);
          if (catObj) {
            setSelectedCategoryKey(catObj.key);
          }
          setSubCategory(item.subCategory || "");
        } else {
          setErrorMessage(data.error || "未找到该信息");
        }
      })
      .catch((err) => {
        setErrorMessage(err.message || "加载信息失败");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleCategoryChange = (catKey: string) => {
    setSelectedCategoryKey(catKey);
    const cat = getCategoryByKey(catKey);
    if (cat) {
      const validSub = cat.subCategories[1] || cat.subCategories[0] || "";
      setSubCategory(validSub);
      const defaultType = cat.fieldConfig.itemTypes[0]?.value;
      setItemType(defaultType === "WANTED" ? "WANTED" : "OFFER");
    }
  };

  // 快捷状态流转变更 (已售出 / 已解决 / 下架 / 重新上架)
  const handleUpdateStatus = async (targetStatus: string, reasonPrompt?: string) => {
    if (!confirm(`确定将该信息状态变更为【${targetStatus}】吗？`)) return;

    setSubmitting(true);
    setStatusActionMsg("");

    try {
      const res = await fetch(`/api/info/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "操作失败");
      }
      setCurrentStatus(targetStatus);
      setStatusActionMsg(`状态已成功更新为：${targetStatus}`);
      setTimeout(() => router.push(`/info/${id}`), 1200);
    } catch (err: any) {
      alert(err.message || "状态更新失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!title.trim()) {
      setErrorMessage("请填写信息标题");
      return;
    }
    if (!body.trim()) {
      setErrorMessage("请填写详细说明内容");
      return;
    }
    if (!contact.trim()) {
      setErrorMessage("请填写联系手机号");
      return;
    }

    const isCarpool = selectedCategoryKey === "carpool";
    if (isCarpool && (!fromPlace.trim() || !toPlace.trim())) {
      setErrorMessage("请完整填写出发地和目的地");
      return;
    }

    setSubmitting(true);

    try {
      let extraData: Record<string, any> = {};
      if (isCarpool) {
        extraData = { seats, carModel, viaRoute };
      } else {
        extraData = { negotiable, deliveryMethod, isHomeService, serviceType };
      }

      const payload = {
        title: title.trim(),
        category: currentCategory.name,
        subCategory: subCategory.trim(),
        itemType,
        price: price.trim() || "面议",
        priceUnit,
        condition: currentCategory.fieldConfig.showCondition ? condition : undefined,
        area,
        address: address.trim() || undefined,
        contact: contact.trim(),
        contactName: contactName.trim() || undefined,
        wechat: wechat.trim() || undefined,
        body: body.trim(),
        images,
        extraData,
        fromPlace: isCarpool ? fromPlace.trim() : undefined,
        toPlace: isCarpool ? toPlace.trim() : undefined,
        departureTime: isCarpool ? departureTime.trim() : undefined,
      };

      const res = await fetch(`/api/info/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "修改失败，请检查登录或稍后重试");
      }

      router.push(`/info/${id}`);
    } catch (err: any) {
      setErrorMessage(err.message || "更新失败");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", background: "#f8fafc" }}>
        <Navbar />
        <div style={{ textAlign: "center", padding: "4rem 1rem", color: "#64748b" }}>
          正在加载信息内容...
        </div>
      </main>
    );
  }

  return (
    <AuthGuard pageTitle="修改综合便民信息">
      <main
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
          paddingBottom: "5rem",
        }}
      >
        <Navbar />

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
              maxWidth: "860px",
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "12px",
                  background: "rgba(255,255,255,0.2)",
                  padding: "3px 10px",
                  borderRadius: "12px",
                  fontWeight: "700",
                }}
              >
                信息管理与状态维护
              </span>
              <h1 style={{ fontSize: "22px", fontWeight: "900", margin: "6px 0 0 0" }}>
                编辑信息 / 变更状态
              </h1>
            </div>

            <Link
              href={`/info/${id}`}
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
              ← 取消并返回详情
            </Link>
          </div>
        </section>

        <section className="shell" style={{ maxWidth: "860px", margin: "0 auto", padding: "0 1rem" }}>
          {/* 状态操作与管理面板 */}
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "1.25rem",
              marginBottom: "1.5rem",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
              <div style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a" }}>
                当前信息状态：
                <span
                  style={{
                    marginLeft: "6px",
                    padding: "3px 10px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "900",
                    background:
                      currentStatus === "APPROVED" ? "#dcfce7" :
                      currentStatus === "PENDING" ? "#e0f2fe" :
                      currentStatus === "SOLD" ? "#f1f5f9" :
                      currentStatus === "RESOLVED" ? "#dcfce7" :
                      currentStatus === "OFFLINE" ? "#fee2e2" : "#fef3c7",
                    color:
                      currentStatus === "APPROVED" ? "#166534" :
                      currentStatus === "PENDING" ? "#0369a1" :
                      currentStatus === "SOLD" ? "#475569" :
                      currentStatus === "RESOLVED" ? "#166534" :
                      currentStatus === "OFFLINE" ? "#991b1b" : "#92400e",
                  }}
                >
                  {currentStatus === "APPROVED" ? "✅ 正常在架" :
                   currentStatus === "PENDING" ? "🕒 审核中" :
                   currentStatus === "SOLD" ? "📦 已售出" :
                   currentStatus === "RESOLVED" ? "🎉 已解决" :
                   currentStatus === "OFFLINE" ? "🚫 已下架" :
                   currentStatus === "REJECTED" ? "❌ 已驳回" : currentStatus}
                </span>
              </div>

              {statusActionMsg && (
                <div style={{ color: "#059669", fontSize: "13px", fontWeight: "700" }}>
                  {statusActionMsg}
                </div>
              )}
            </div>

            {/* 快速流转快捷按钮 */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {currentStatus !== "SOLD" && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("SOLD")}
                  disabled={submitting}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "#f1f5f9",
                    color: "#334155",
                    border: "1px solid #cbd5e1",
                    padding: "6px 14px",
                    borderRadius: "16px",
                    fontSize: "12.5px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  <Package size={14} />
                  <span>标为已售出</span>
                </button>
              )}

              {currentStatus !== "RESOLVED" && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("RESOLVED")}
                  disabled={submitting}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "#ecfdf5",
                    color: "#059669",
                    border: "1px solid #a7f3d0",
                    padding: "6px 14px",
                    borderRadius: "16px",
                    fontSize: "12.5px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  <CheckCircle2 size={14} />
                  <span>标为已解决</span>
                </button>
              )}

              {currentStatus === "APPROVED" && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("OFFLINE")}
                  disabled={submitting}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "#fef2f2",
                    color: "#b91c1c",
                    border: "1px solid #fecaca",
                    padding: "6px 14px",
                    borderRadius: "16px",
                    fontSize: "12.5px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  <EyeOff size={14} />
                  <span>下架信息</span>
                </button>
              )}

              {(currentStatus === "OFFLINE" || currentStatus === "REJECTED" || currentStatus === "SOLD" || currentStatus === "RESOLVED") && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("PENDING")}
                  disabled={submitting}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "#0B7A75",
                    color: "white",
                    border: "none",
                    padding: "6px 14px",
                    borderRadius: "16px",
                    fontSize: "12.5px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  <Check size={14} />
                  <span>重新提交上架审核</span>
                </button>
              )}
            </div>
          </div>

          {/* 表单卡片 */}
          <form
            onSubmit={handleSubmit}
            style={{
              background: "white",
              borderRadius: "18px",
              padding: "1.75rem",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
            }}
          >
            {errorMessage && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  padding: "12px",
                  borderRadius: "10px",
                  marginBottom: "1.25rem",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 大分类 */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "13.5px", fontWeight: "800", color: "#334155", marginBottom: "8px" }}>
                一级大类
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "8px" }}>
                {INFO_CATEGORIES.map((cat) => {
                  const isSel = selectedCategoryKey === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => handleCategoryChange(cat.key)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: "10px",
                        border: isSel ? "2px solid #0B7A75" : "1px solid #e2e8f0",
                        background: isSel ? "#f0fdfa" : "white",
                        color: isSel ? "#0B7A75" : "#334155",
                        fontWeight: isSel ? "800" : "500",
                        fontSize: "12.5px",
                        cursor: "pointer",
                      }}
                    >
                      {cat.name.split("/")[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 供求与细分子类 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "13.5px", fontWeight: "800", color: "#334155", marginBottom: "6px" }}>
                  供求类型
                </label>
                <select
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value as any)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13.5px", background: "white", boxSizing: "border-box" }}
                >
                  <option value="OFFER">提供 / 转让 / 寻客</option>
                  <option value="WANTED">需求 / 求购 / 寻服务</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13.5px", fontWeight: "800", color: "#334155", marginBottom: "6px" }}>
                  细分子类目
                </label>
                <input
                  type="text"
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  placeholder="如：同城顺风车、电动车"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13.5px", boxSizing: "border-box" }}
                />
              </div>
            </div>

            {/* 标题 */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "13.5px", fontWeight: "800", color: "#334155", marginBottom: "6px" }}>
                信息标题 <span style={{ color: "#e11d48" }}>*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
              />
            </div>

            {/* 拼车动态字段 */}
            {selectedCategoryKey === "carpool" && (
              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "1.25rem" }}>
                <div style={{ fontSize: "13px", fontWeight: "800", color: "#0B7A75", marginBottom: "10px" }}>
                  顺风车行程设置
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginBottom: "8px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>出发地</label>
                    <input
                      type="text"
                      value={fromPlace}
                      onChange={(e) => setFromPlace(e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>目的地</label>
                    <input
                      type="text"
                      value={toPlace}
                      onChange={(e) => setToPlace(e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                    />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>发车时间</label>
                    <input
                      type="text"
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>剩余座位</label>
                    <input
                      type="text"
                      value={seats}
                      onChange={(e) => setSeats(e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>车型</label>
                    <input
                      type="text"
                      value={carModel}
                      onChange={(e) => setCarModel(e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 价格与区域 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "13.5px", fontWeight: "800", color: "#334155", marginBottom: "6px" }}>
                  价格 (为空即面议)
                </label>
                <div style={{ display: "flex", gap: "6px" }}>
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="如：50"
                    style={{ flex: 1, padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                  />
                  <input
                    type="text"
                    value={priceUnit}
                    onChange={(e) => setPriceUnit(e.target.value)}
                    style={{ width: "60px", padding: "9px 8px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", textAlign: "center", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13.5px", fontWeight: "800", color: "#334155", marginBottom: "6px" }}>
                  所属片区
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
                详细内容说明 <span style={{ color: "#e11d48" }}>*</span>
              </label>
              <textarea
                rows={5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", lineHeight: "1.6", boxSizing: "border-box" }}
              />
            </div>

            {/* 图片上传 */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "13.5px", fontWeight: "800", color: "#334155", marginBottom: "8px" }}>
                照片图集 (最多9张)
              </label>
              <ImageUpload value={images} onChange={setImages} maxCount={9} />
            </div>

            {/* 联系人 */}
            <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "13.5px", fontWeight: "800", color: "#334155", marginBottom: "10px" }}>
                联系方式
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>联系手机号</label>
                  <input
                    type="tel"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13.5px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>称呼</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13.5px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>微信号</label>
                  <input
                    type="text"
                    value={wechat}
                    onChange={(e) => setWechat(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13.5px", boxSizing: "border-box" }}
                  />
                </div>
              </div>
            </div>

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "28px",
                border: "none",
                background: submitting ? "#94a3b8" : "#0B7A75",
                color: "white",
                fontSize: "15px",
                fontWeight: "800",
                cursor: submitting ? "not-allowed" : "pointer",
                boxShadow: "0 4px 16px rgba(11, 122, 117, 0.25)",
              }}
            >
              {submitting ? "正在保存更新中..." : "保存修改"}
            </button>
          </form>
        </section>
      </main>
    </AuthGuard>
  );
}
