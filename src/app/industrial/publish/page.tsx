"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import ImageUpload from "@/components/ImageUpload";

export default function IndustrialPublishPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 基础分类
  const [transactionType, setTransactionType] = useState<string>(searchParams.get("action") || "RENT");
  const [propertyType, setPropertyType] = useState<string>(searchParams.get("type") || "FACTORY");

  // 基础信息
  const [title, setTitle] = useState("");
  const [region, setRegion] = useState("杨林经开区");
  const [parkName, setParkName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

  // 面积与价格
  const [buildingArea, setBuildingArea] = useState("");
  const [landArea, setLandArea] = useState("");
  const [price, setPrice] = useState("");
  const [priceUnit, setPriceUnit] = useState("元/㎡/月");
  const [negotiable, setNegotiable] = useState(false);

  // 厂房 / 仓库工程参数
  const [floorHeight, setFloorHeight] = useState("");
  const [floorCount, setFloorCount] = useState("1");
  const [isSingleFloor, setIsSingleFloor] = useState(true);
  const [loadBearing, setLoadBearing] = useState("");
  const [powerCapacity, setPowerCapacity] = useState("");
  const [hasCrane, setHasCrane] = useState(false);
  const [craneTonnage, setCraneTonnage] = useState("");
  const [hasFireSystem, setHasFireSystem] = useState(true);
  const [fireStatus, setFireStatus] = useState("丙类");
  const [truckAccessible, setTruckAccessible] = useState(true);
  const [hasLoadingDock, setHasLoadingDock] = useState(false);
  const [hasOffice, setHasOffice] = useState(false);
  const [hasDormitory, setHasDormitory] = useState(false);
  const [hasCanteen, setHasCanteen] = useState(false);
  const [hasParking, setHasParking] = useState(true);
  const [canSplit, setCanSplit] = useState(false);

  // 土地属性
  const [landUseType, setLandUseType] = useState("工业用地");
  const [propertyRightStatus, setPropertyRightStatus] = useState("国有出让");
  const [canBuild, setCanBuild] = useState(true);

  // 商务与行业
  const [availableDate, setAvailableDate] = useState("随时可进驻");
  const [minimumLeaseTerm, setMinimumLeaseTerm] = useState("1年");
  const [suitableIndustries, setSuitableIndustries] = useState<string[]>([]);

  // 联系人与图片
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [images, setImages] = useState<string[]>([]);

  // 交互状态
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isWanted = transactionType === "WANTED_RENT" || transactionType === "WANTED_BUY";

  const industryOptions = [
    "机械制造", "汽车零部件", "食品饮料", "仓储物流", "包装印刷", "电子信息",
    "新型建材", "电商云仓", "生物医药", "商贸研发", "轻工纺织"
  ];

  const toggleIndustry = (ind: string) => {
    if (suitableIndustries.includes(ind)) {
      setSuitableIndustries(suitableIndustries.filter((x) => x !== ind));
    } else {
      setSuitableIndustries([...suitableIndustries, ind]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!title.trim()) return setErrorMsg("请填写招商/求租标题");
    if (!address.trim()) return setErrorMsg("请填写具体位置或园区门牌");
    if (!contactName.trim()) return setErrorMsg("请填写联系人姓名");
    if (!contactPhone.trim() || contactPhone.trim().length < 7) return setErrorMsg("请填写有效的联系电话");

    setSubmitting(true);
    try {
      const payload: any = {
        title: title.trim(),
        description: description.trim(),
        propertyType,
        transactionType,
        region,
        parkName: parkName.trim(),
        address: address.trim(),
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        images,
        priceUnit,
        negotiable,
        availableDate,
        minimumLeaseTerm,
        suitableIndustries,
      };

      if (propertyType === "LAND") {
        payload.landArea = landArea;
        payload.landUseType = landUseType;
        payload.propertyRightStatus = propertyRightStatus;
        payload.canBuild = canBuild;
      } else {
        payload.buildingArea = buildingArea;
      }

      if (transactionType === "SALE") {
        payload.salePrice = price;
      } else {
        payload.rentPrice = price;
      }

      // 厂房 / 仓库工程属性
      if (propertyType === "FACTORY" || propertyType === "WAREHOUSE") {
        payload.floorHeight = floorHeight;
        payload.floorCount = floorCount;
        payload.isSingleFloor = isSingleFloor;
        payload.loadBearing = loadBearing;
        payload.powerCapacity = powerCapacity;
        payload.hasCrane = hasCrane;
        payload.craneTonnage = hasCrane ? craneTonnage : null;
        payload.hasFireSystem = hasFireSystem;
        payload.fireStatus = fireStatus;
        payload.truckAccessible = truckAccessible;
        payload.hasLoadingDock = hasLoadingDock;
        payload.hasOffice = hasOffice;
        payload.hasDormitory = hasDormitory;
        payload.hasCanteen = hasCanteen;
        payload.hasParking = hasParking;
        payload.canSplit = canSplit;
      }

      const res = await fetch("/api/industrial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          alert("请先登录后再发布园区招商信息");
          window.location.href = `/login?from=${encodeURIComponent("/industrial/publish")}`;
          return;
        }
        setErrorMsg(data.error || "发布失败，请检查填写内容");
        setSubmitting(false);
        return;
      }

      alert("发布成功！");
      router.push(`/industrial/${data.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || "网络请求失败，请稍后重试");
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F4F6F9", color: "#181818", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif" }}>
      <Navbar />

      <main style={{ maxWidth: "880px", margin: "24px auto 4rem auto", padding: "0 1.25rem" }}>
        <div style={{ background: "#FFFFFF", borderRadius: "16px", border: "1px solid #E2E8F0", padding: "28px", boxShadow: "0 4px 25px rgba(0,0,0,0.04)" }}>
          
          <div style={{ borderBottom: "2px solid #2563EB", paddingBottom: "14px", marginBottom: "24px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: "900", color: "#0F172A", margin: "0 0 6px 0" }}>
              ✍️ 发布园区招商与工业地产信息
            </h1>
            <p style={{ fontSize: "13px", color: "#64748B", margin: 0 }}>
              面向杨林经开区、工业园区及嵩明本地企业，发布厂房出租出售、仓库、工业土地、办公楼或求租求购
            </p>
          </div>

          {errorMsg && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#DC2626", padding: "10px 14px", borderRadius: "8px", fontSize: "13.5px", marginBottom: "18px" }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            
            {/* 第 1 步：交易类型 */}
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "800", color: "#1E293B", marginBottom: "8px" }}>
                1. 交易类型 <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {[
                  { label: "厂房/物业出租", val: "RENT" },
                  { label: "物业出售", val: "SALE" },
                  { label: "企业/设备转让", val: "TRANSFER" },
                  { label: "园区招商/项目合作", val: "COOPERATION" },
                  { label: "求租需求", val: "WANTED_RENT" },
                  { label: "求购需求", val: "WANTED_BUY" },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.val}
                    onClick={() => setTransactionType(item.val)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: transactionType === item.val ? "800" : "500",
                      background: transactionType === item.val ? "#EFF6FF" : "#F8FAFC",
                      color: transactionType === item.val ? "#2563EB" : "#475569",
                      border: transactionType === item.val ? "2px solid #2563EB" : "1px solid #E2E8F0",
                      cursor: "pointer",
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 第 2 步：物业类型 */}
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "800", color: "#1E293B", marginBottom: "8px" }}>
                2. 物业类型 <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {[
                  { label: "🏭 标准厂房", val: "FACTORY" },
                  { label: "📦 仓储物流", val: "WAREHOUSE" },
                  { label: "🏞️ 工业土地/地皮", val: "LAND" },
                  { label: "🏢 研发办公楼", val: "OFFICE" },
                  { label: "🏗️ 产业园物业", val: "INDUSTRIAL_PARK" },
                  { label: "🏪 园区商业配套", val: "COMMERCIAL_SUPPORT" },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.val}
                    onClick={() => setPropertyType(item.val)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: propertyType === item.val ? "800" : "500",
                      background: propertyType === item.val ? "#EFF6FF" : "#F8FAFC",
                      color: propertyType === item.val ? "#2563EB" : "#475569",
                      border: propertyType === item.val ? "2px solid #2563EB" : "1px solid #E2E8F0",
                      cursor: "pointer",
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 标题 */}
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "800", color: "#1E293B", marginBottom: "6px" }}>
                3. 招商标题 <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isWanted ? "如：急求租杨林经开区 2000-3000㎡ 单层带行车厂房" : "如：杨林经开区东环路 3200㎡ 单层标准厂房出租 (带10吨行车)"}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            {/* 区域与园区地址 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13.5px", fontWeight: "800", color: "#1E293B", marginBottom: "6px" }}>
                  所属区域 <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "14px", background: "#FFFFFF" }}
                >
                  <option value="杨林经开区">杨林经开区</option>
                  <option value="杨林工业园区">杨林工业园区</option>
                  <option value="杨林镇">杨林镇</option>
                  <option value="大学城周边">大学城周边</option>
                  <option value="空港大道沿线">空港大道沿线</option>
                  <option value="嵩明其他">嵩明其他区域</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13.5px", fontWeight: "800", color: "#1E293B", marginBottom: "6px" }}>
                  所属园区名称 (选填)
                </label>
                <input
                  type="text"
                  value={parkName}
                  onChange={(e) => setParkName(e.target.value)}
                  placeholder="如：滇中先进装备制造园 / 领秀知识城"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "14px" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13.5px", fontWeight: "800", color: "#1E293B", marginBottom: "6px" }}>
                具体位置 / 街道门牌 <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="如：杨林经济开发区东环路18号"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "14px" }}
              />
            </div>

            {/* 面积与价格 (动态区别土地与建筑) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
              {propertyType === "LAND" ? (
                <div>
                  <label style={{ display: "block", fontSize: "13.5px", fontWeight: "800", color: "#1E293B", marginBottom: "6px" }}>
                    土地占地面积 (亩) <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={landArea}
                    onChange={(e) => setLandArea(e.target.value)}
                    placeholder="如：25"
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "14px" }}
                  />
                </div>
              ) : (
                <div>
                  <label style={{ display: "block", fontSize: "13.5px", fontWeight: "800", color: "#1E293B", marginBottom: "6px" }}>
                    建筑 / 车间面积 (㎡) <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={buildingArea}
                    onChange={(e) => setBuildingArea(e.target.value)}
                    placeholder="如：3200"
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "14px" }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "13.5px", fontWeight: "800", color: "#1E293B", marginBottom: "6px" }}>
                  期望价格
                </label>
                <div style={{ display: "flex", gap: "6px" }}>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    disabled={negotiable}
                    placeholder={negotiable ? "面议中" : "如：18"}
                    style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "14px" }}
                  />
                  <select
                    value={priceUnit}
                    onChange={(e) => setPriceUnit(e.target.value)}
                    disabled={negotiable}
                    style={{ width: "110px", padding: "10px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "13px", background: "#FFFFFF" }}
                  >
                    <option value="元/㎡/月">元/㎡/月</option>
                    <option value="元/月">元/月</option>
                    <option value="元/年">元/年</option>
                    <option value="万元/亩">万元/亩</option>
                    <option value="万元">万元整</option>
                  </select>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748B", marginTop: "4px" }}>
                  <input type="checkbox" checked={negotiable} onChange={(e) => setNegotiable(e.target.checked)} />
                  价格可面议
                </label>
              </div>
            </div>

            {/* 厂房 / 仓库专有工程技术参数 (动态展现) */}
            {(propertyType === "FACTORY" || propertyType === "WAREHOUSE") && (
              <div style={{ background: "#F8FAFC", padding: "16px 18px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: "14px", fontWeight: "900", color: "#1E293B", marginBottom: "12px" }}>
                  ⚙️ 厂房 / 仓库专业工程指标
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#64748B", marginBottom: "4px" }}>车间层高 (米)</label>
                    <input type="number" step="0.1" value={floorHeight} onChange={(e) => setFloorHeight(e.target.value)} placeholder="如：9.5" style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#64748B", marginBottom: "4px" }}>供电容量 (kVA)</label>
                    <input type="number" value={powerCapacity} onChange={(e) => setPowerCapacity(e.target.value)} placeholder="如：630" style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#64748B", marginBottom: "4px" }}>地面承重 (吨/㎡)</label>
                    <input type="number" step="0.1" value={loadBearing} onChange={(e) => setLoadBearing(e.target.value)} placeholder="如：3.0" style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px" }} />
                  </div>
                </div>

                {/* 勾选项 */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "8px", fontSize: "13px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <input type="checkbox" checked={isSingleFloor} onChange={(e) => setIsSingleFloor(e.target.checked)} />
                    单层独门独栋
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <input type="checkbox" checked={hasCrane} onChange={(e) => setHasCrane(e.target.checked)} />
                    有行车 / 吊车
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <input type="checkbox" checked={hasFireSystem} onChange={(e) => setHasFireSystem(e.target.checked)} />
                    配消防设施
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <input type="checkbox" checked={truckAccessible} onChange={(e) => setTruckAccessible(e.target.checked)} />
                    17.5米大车可进
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <input type="checkbox" checked={hasOffice} onChange={(e) => setHasOffice(e.target.checked)} />
                    带办公区
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <input type="checkbox" checked={hasDormitory} onChange={(e) => setHasDormitory(e.target.checked)} />
                    有员工宿舍
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <input type="checkbox" checked={hasCanteen} onChange={(e) => setHasCanteen(e.target.checked)} />
                    配员工食堂
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <input type="checkbox" checked={canSplit} onChange={(e) => setCanSplit(e.target.checked)} />
                    面积支持分租
                  </label>
                </div>
              </div>
            )}

            {/* 土地专有字段 (动态展现) */}
            {propertyType === "LAND" && (
              <div style={{ background: "#FEF3C7", padding: "16px 18px", borderRadius: "12px", border: "1px solid #FDE68A" }}>
                <div style={{ fontSize: "14px", fontWeight: "900", color: "#92400E", marginBottom: "12px" }}>
                  🏞️ 工业土地专有性质
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#92400E", marginBottom: "4px" }}>土地性质</label>
                    <select value={landUseType} onChange={(e) => setLandUseType(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #F59E0B", background: "#FFFFFF", fontSize: "13px" }}>
                      <option value="工业用地">工业用地</option>
                      <option value="仓储物流用地">仓储物流用地</option>
                      <option value="商业服务业用地">商业服务业用地</option>
                      <option value="综合用地">综合用地</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#92400E", marginBottom: "4px" }}>产权性质</label>
                    <select value={propertyRightStatus} onChange={(e) => setPropertyRightStatus(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #F59E0B", background: "#FFFFFF", fontSize: "13px" }}>
                      <option value="国有出让">国有出让 (大产权证)</option>
                      <option value="集体建设用地">集体建设用地</option>
                      <option value="园区协议用地">园区协议用地</option>
                    </select>
                  </div>
                </div>
                <div style={{ fontSize: "11.5px", color: "#B45309", marginTop: "10px" }}>
                  ⚠️ 请发布方如实填写土地性质，平台将标明由发布者负责真实性。
                </div>
              </div>
            )}

            {/* 适合行业参考 */}
            <div>
              <label style={{ display: "block", fontSize: "13.5px", fontWeight: "800", color: "#1E293B", marginBottom: "6px" }}>
                适合行业参考 (可多选)
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {industryOptions.map((ind) => {
                  const active = suitableIndustries.includes(ind);
                  return (
                    <button
                      type="button"
                      key={ind}
                      onClick={() => toggleIndustry(ind)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: active ? "800" : "500",
                        background: active ? "#EFF6FF" : "#F8FAFC",
                        color: active ? "#2563EB" : "#475569",
                        border: active ? "1px solid #2563EB" : "1px solid #CBD5E1",
                        cursor: "pointer",
                      }}
                    >
                      {active ? "✓ " : ""}{ind}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 详细描述 */}
            <div>
              <label style={{ display: "block", fontSize: "13.5px", fontWeight: "800", color: "#1E293B", marginBottom: "6px" }}>
                详细描述与招商合作需求 <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="详细说明厂房结构、变压器型号、办公宿舍配套、周边交通环境或合作意向条款..."
                style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "14px", outline: "none", resize: "vertical" }}
              />
            </div>

            {/* 实景图片上传 (复用成熟 ImageUpload 组件，最大20张) */}
            <div>
              <label style={{ display: "block", fontSize: "13.5px", fontWeight: "800", color: "#1E293B", marginBottom: "6px" }}>
                实景照片上传 (最多20张，首张为封面)
              </label>
              <ImageUpload
                value={images}
                onChange={setImages}
                maxCount={20}
              />
            </div>

            {/* 联系人信息 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13.5px", fontWeight: "800", color: "#1E293B", marginBottom: "6px" }}>
                  联系人姓名 <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="如：王经理 / 李主任"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "14px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13.5px", fontWeight: "800", color: "#1E293B", marginBottom: "6px" }}>
                  联系电话 <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="手机号或带区号座机"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "14px" }}
                />
              </div>
            </div>

            {/* 提交按钮 */}
            <div style={{ marginTop: "12px" }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: "100%",
                  padding: "14px 0",
                  background: submitting ? "#94A3B8" : "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                  color: "#FFFFFF",
                  fontWeight: "900",
                  fontSize: "16px",
                  borderRadius: "10px",
                  border: "none",
                  cursor: submitting ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 15px rgba(37,99,235,0.35)",
                }}
              >
                {submitting ? "正在提交发布..." : "确认发布园区招商信息"}
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}
