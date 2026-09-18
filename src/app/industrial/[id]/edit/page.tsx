"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ImageUpload from "@/components/ImageUpload";

const PROPERTY_TYPES = [
  { value: "FACTORY", label: "标准厂房" },
  { value: "WAREHOUSE", label: "高标仓库" },
  { value: "LAND", label: "工业土地/地块" },
  { value: "OFFICE", label: "研发办公楼" },
  { value: "PARK", label: "产业园区" },
  { value: "OTHER", label: "其他物业" },
];

const TRANSACTION_TYPES = [
  { value: "RENT", label: "招租 (出租)" },
  { value: "SALE", label: "出售 (转让)" },
  { value: "TRANSFER", label: "整包租售转让" },
  { value: "COOPERATION", label: "园区招商合资" },
];

const REGIONS = [
  "杨林经开区先进制造园",
  "杨林装备制造园",
  "职教园区产教融合区",
  "杨林临空物流园",
  "嵩明杨林轻工业园",
  "杨林工业集中区",
  "其他周边区域",
];

export default function IndustrialEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [propertyType, setPropertyType] = useState("FACTORY");
  const [transactionType, setTransactionType] = useState("RENT");
  const [isWanted, setIsWanted] = useState(false);
  const [title, setTitle] = useState("");
  const [region, setRegion] = useState("杨林经开区先进制造园");
  const [address, setAddress] = useState("");
  const [parkName, setParkName] = useState("");

  const [areaTotal, setAreaTotal] = useState("");
  const [areaAvailable, setAreaAvailable] = useState("");
  const [canSubdivide, setCanSubdivide] = useState(false);
  const [price, setPrice] = useState("");
  const [priceUnit, setPriceUnit] = useState("元/㎡/月");

  const [buildingType, setBuildingType] = useState("单层钢结构");
  const [floorHeight, setFloorHeight] = useState("");
  const [bearingCapacity, setBearingCapacity] = useState("");
  const [powerCapacity, setPowerCapacity] = useState("");
  const [craneTonnage, setCraneTonnage] = useState("");
  const [hasCrane, setHasCrane] = useState(false);
  const [fireRating, setFireRating] = useState("丁类");
  const [bigTruckAccess, setBigTruckAccess] = useState(true);
  const [hasElevator, setHasElevator] = useState(false);
  const [loadingDock, setLoadingDock] = useState(false);

  const [landNature, setLandNature] = useState("");
  const [remainingYears, setRemainingYears] = useState("");
  const [plotRatio, setPlotRatio] = useState("");

  const [hasOffice, setHasOffice] = useState(false);
  const [hasDormitory, setHasDormitory] = useState(false);
  const [hasCanteen, setHasCanteen] = useState(false);
  const [hasPollutionPermit, setHasPollutionPermit] = useState(false);
  const [fitIndustries, setFitIndustries] = useState("");

  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [wechat, setWechat] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/industrial/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("获取信息失败");
        return res.json();
      })
      .then((data) => {
        const item = data.item;
        if (!item) return;
        setTitle(item.title || "");
        setPropertyType(item.propertyType || "FACTORY");
        setTransactionType(item.transactionType || "RENT");
        setIsWanted(!!item.isWanted);
        setRegion(item.region || "杨林经开区先进制造园");
        setAddress(item.address || "");
        setParkName(item.parkName || "");

        setAreaTotal(item.areaTotal ? String(item.areaTotal) : "");
        setAreaAvailable(item.areaAvailable ? String(item.areaAvailable) : "");
        setCanSubdivide(!!item.canSubdivide);
        setPrice(item.price ? String(item.price) : "");
        setPriceUnit(item.priceUnit || "元/㎡/月");

        setBuildingType(item.buildingType || "单层钢结构");
        setFloorHeight(item.floorHeight ? String(item.floorHeight) : "");
        setBearingCapacity(item.bearingCapacity ? String(item.bearingCapacity) : "");
        setPowerCapacity(item.powerCapacity ? String(item.powerCapacity) : "");
        setCraneTonnage(item.craneTonnage ? String(item.craneTonnage) : "");
        setHasCrane(!!item.hasCrane);
        setFireRating(item.fireRating || "丁类");
        setBigTruckAccess(item.bigTruckAccess !== false);
        setHasElevator(!!item.hasElevator);
        setLoadingDock(!!item.loadingDock);

        setLandNature(item.landNature || "");
        setRemainingYears(item.remainingYears ? String(item.remainingYears) : "");
        setPlotRatio(item.plotRatio ? String(item.plotRatio) : "");

        setHasOffice(!!item.hasOffice);
        setHasDormitory(!!item.hasDormitory);
        setHasCanteen(!!item.hasCanteen);
        setHasPollutionPermit(!!item.hasPollutionPermit);
        setFitIndustries(item.fitIndustries || "");

        setContactName(item.contactName || "");
        setContactPhone(item.contactPhone || "");
        setWechat(item.wechat || "");
        setDescription(item.description || "");
        setImages(item.images || []);
      })
      .catch((err) => {
        setErrorMsg(err.message || "加载物业详情异常");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!title.trim()) {
      setErrorMsg("请填写信息标题");
      return;
    }
    if (!areaTotal || isNaN(Number(areaTotal))) {
      setErrorMsg("请填写正确的建筑/土地面积数值");
      return;
    }
    if (!contactName.trim()) {
      setErrorMsg("请填写招商联系人姓名");
      return;
    }
    if (!contactPhone.trim() || !/^1[3-9]\d{9}$/.test(contactPhone.trim())) {
      setErrorMsg("请填写正确的11位联系人手机号");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        propertyType,
        transactionType,
        isWanted,
        region,
        address: address.trim(),
        parkName: parkName.trim(),
        areaTotal: Number(areaTotal),
        areaAvailable: areaAvailable ? Number(areaAvailable) : null,
        canSubdivide,
        price: price ? Number(price) : null,
        priceUnit,
        buildingType: propertyType === "FACTORY" || propertyType === "WAREHOUSE" ? buildingType : null,
        floorHeight: floorHeight ? Number(floorHeight) : null,
        bearingCapacity: bearingCapacity ? Number(bearingCapacity) : null,
        powerCapacity: powerCapacity ? Number(powerCapacity) : null,
        hasCrane,
        craneTonnage: craneTonnage ? Number(craneTonnage) : null,
        fireRating,
        bigTruckAccess,
        hasElevator,
        loadingDock,
        landNature: propertyType === "LAND" ? landNature : null,
        remainingYears: remainingYears ? Number(remainingYears) : null,
        plotRatio: plotRatio ? Number(plotRatio) : null,
        hasOffice,
        hasDormitory,
        hasCanteen,
        hasPollutionPermit,
        fitIndustries: fitIndustries.trim(),
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        wechat: wechat.trim(),
        description: description.trim(),
        images,
      };

      const res = await fetch(`/api/industrial/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "更新失败");
      }

      setSuccessMsg("修改保存成功！正在跳转至详情页...");
      setTimeout(() => {
        router.push(`/industrial/${id}`);
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || "网络异常，提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", background: "#0f172a", color: "#f8fafc" }}>
        <Navbar />
        <div style={{ maxWidth: "800px", margin: "40px auto", textAlign: "center", padding: "40px" }}>
          正在加载招商物业详情...
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#0B132B", color: "#F8FAFC", paddingBottom: "80px" }}>
      <Navbar />

      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "28px 16px" }}>
        <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <Link href={`/industrial/${id}`} style={{ color: "#38BDF8", textDecoration: "none", fontSize: "13px" }}>
              &larr; 返回物业详情
            </Link>
            <h1 style={{ fontSize: "24px", fontWeight: "800", margin: "8px 0 4px", color: "#FFFFFF" }}>
              编辑园区招商 / 工业地产信息
            </h1>
            <p style={{ fontSize: "13px", color: "#94A3B8", margin: 0 }}>
              修改您在杨林经开区发布的厂房、仓库或工业用地数据
            </p>
          </div>
        </div>

        {errorMsg && (
          <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid #EF4444", color: "#FCA5A5", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px" }}>
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{ background: "rgba(34, 197, 94, 0.15)", border: "1px solid #22C55E", color: "#86EFAC", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px" }}>
            ✅ {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ background: "#1C2541", borderRadius: "16px", padding: "28px", border: "1px solid rgba(255,255,255,0.08)" }}>
          {/* 物业与交易方式 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px", fontWeight: "600" }}>
                物业性质 *
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                style={{ width: "100%", background: "#0B132B", border: "1px solid rgba(255,255,255,0.15)", color: "#FFFFFF", borderRadius: "8px", padding: "10px 12px", fontSize: "14px", outline: "none" }}
              >
                {PROPERTY_TYPES.map((pt) => (
                  <option key={pt.value} value={pt.value}>{pt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px", fontWeight: "600" }}>
                合作意向 / 交易类型 *
              </label>
              <select
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value)}
                style={{ width: "100%", background: "#0B132B", border: "1px solid rgba(255,255,255,0.15)", color: "#FFFFFF", borderRadius: "8px", padding: "10px 12px", fontSize: "14px", outline: "none" }}
              >
                {TRANSACTION_TYPES.map((tt) => (
                  <option key={tt.value} value={tt.value}>{tt.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingTop: "24px" }}>
              <input
                type="checkbox"
                id="isWantedCheck"
                checked={isWanted}
                onChange={(e) => setIsWanted(e.target.checked)}
                style={{ width: "18px", height: "18px", cursor: "pointer" }}
              />
              <label htmlFor="isWantedCheck" style={{ fontSize: "13px", color: "#F59E0B", cursor: "pointer", fontWeight: "600" }}>
                标为【求租 / 求购】意向
              </label>
            </div>
          </div>

          {/* 标题 */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px", fontWeight: "600" }}>
              房源/招商标题 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="如：杨林先进制造园旁 5000㎡单层标准钢构厂房 带10吨行车 大车直达"
              style={{ width: "100%", background: "#0B132B", border: "1px solid rgba(255,255,255,0.15)", color: "#FFFFFF", borderRadius: "8px", padding: "10px 14px", fontSize: "14px", outline: "none" }}
            />
          </div>

          {/* 园区与位置 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))\", gap: \"16px\", marginBottom: \"20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px", fontWeight: "600" }}>
                所属园区板块 *
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                style={{ width: "100%", background: "#0B132B", border: "1px solid rgba(255,255,255,0.15)", color: "#FFFFFF", borderRadius: "8px", padding: "10px 12px", fontSize: "14px", outline: "none" }}
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px", fontWeight: "600" }}>
                具体园区名称 / 地标
              </label>
              <input
                type="text"
                value={parkName}
                onChange={(e) => setParkName(e.target.value)}
                placeholder="如：浩宏现代物流园、杨林科技创新园"
                style={{ width: "100%", background: "#0B132B", border: "1px solid rgba(255,255,255,0.15)", color: "#FFFFFF", borderRadius: "8px", padding: "10px 14px", fontSize: "14px", outline: "none" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px", fontWeight: "600" }}>
                详细门牌 / 道路位置
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="如：东环路与凌云路交叉口向东200米"
                style={{ width: "100%", background: "#0B132B", border: "1px solid rgba(255,255,255,0.15)", color: "#FFFFFF", borderRadius: "8px", padding: "10px 14px", fontSize: "14px", outline: "none" }}
              />
            </div>
          </div>

          {/* 面积与价格 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "20px", background: "rgba(0,0,0,0.2)", padding: "16px", borderRadius: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px", fontWeight: "600" }}>
                建筑/土地总面积 (㎡) *
              </label>
              <input
                type="number"
                value={areaTotal}
                onChange={(e) => setAreaTotal(e.target.value)}
                placeholder="如：5000"
                style={{ width: "100%", background: "#0B132B", border: "1px solid rgba(255,255,255,0.15)", color: "#FFFFFF", borderRadius: "8px", padding: "10px 14px", fontSize: "14px", outline: "none" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px", fontWeight: "600" }}>
                可租用/可分租起租面积 (㎡)
              </label>
              <input
                type="number"
                value={areaAvailable}
                onChange={(e) => setAreaAvailable(e.target.value)}
                placeholder="如：1000"
                style={{ width: "100%", background: "#0B132B", border: "1px solid rgba(255,255,255,0.15)", color: "#FFFFFF", borderRadius: "8px", padding: "10px 14px", fontSize: "14px", outline: "none" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px", fontWeight: "600" }}>
                租金或售价金额
              </label>
              <input
                type="number"
                step="0.1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="如：15"
                style={{ width: "100%", background: "#0B132B", border: "1px solid rgba(255,255,255,0.15)", color: "#FFFFFF", borderRadius: "8px", padding: "10px 14px", fontSize: "14px", outline: "none" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px", fontWeight: "600" }}>
                计价单位
              </label>
              <select
                value={priceUnit}
                onChange={(e) => setPriceUnit(e.target.value)}
                style={{ width: "100%", background: "#0B132B", border: "1px solid rgba(255,255,255,0.15)", color: "#FFFFFF", borderRadius: "8px", padding: "10px 12px", fontSize: "14px", outline: "none" }}
              >
                <option value="元/㎡/月">元/㎡/月</option>
                <option value="元/㎡/天">元/㎡/天</option>
                <option value="万元/亩">万元/亩</option>
                <option value="万元/套">万元/套</option>
                <option value="万元/年">万元/年</option>
                <option value="面议">面议</option>
              </select>
            </div>
          </div>

          {/* 工业指标参数 */}
          {(propertyType === "FACTORY" || propertyType === "WAREHOUSE" || propertyType === "PARK") && (
            <div style={{ marginBottom: "20px", background: "rgba(0,0,0,0.2)", padding: "16px", borderRadius: "12px" }}>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#38BDF8", marginBottom: "14px" }}>
                ⚙️ 厂房 / 仓库专业工程指标
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#94A3B8", marginBottom: "4px" }}>建筑类型</label>
                  <select
                    value={buildingType}
                    onChange={(e) => setBuildingType(e.target.value)}
                    style={{ width: "100%", background: "#0B132B", border: "1px solid rgba(255,255,255,0.15)", color: "#FFFFFF", borderRadius: "6px", padding: "8px 10px", fontSize: "13px" }}
                  >
                    <option value="单层钢结构">单层钢结构</option>
                    <option value="多层标准框架">多层标准框架</option>
                    <option value="独门独院厂房">独门独院厂房</option>
                    <option value="高台坡道库">高台坡道库</option>
                    <option value="钢混框架结构">钢混框架结构</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#94A3B8", marginBottom: "4px" }}>建筑层高 (米)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={floorHeight}
                    onChange={(e) => setFloorHeight(e.target.value)}
                    placeholder="如：10.5"
                    style={{ width: "100%", background: "#0B132B", border: "1px solid rgba(255,255,255,0.15)", color: "#FFFFFF", borderRadius: "6px", padding: "8px 10px", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#94A3B8", marginBottom: "4px" }}>地面承重 (吨/㎡)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={bearingCapacity}
                    onChange={(e) => setBearingCapacity(e.target.value)}
                    placeholder="如：3.0"
                    style={{ width: "100%", background: "#0B132B", border: "1px solid rgba(255,255,255,0.15)", color: "#FFFFFF", borderRadius: "6px", padding: "8px 10px", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#94A3B8", marginBottom: "4px" }}>变压配电 (kVA)</label>
                  <input
                    type="number"
                    value={powerCapacity}
                    onChange={(e) => setPowerCapacity(e.target.value)}
                    placeholder="如：630"
                    style={{ width: "100%", background: "#0B132B", border: "1px solid rgba(255,255,255,0.15)", color: "#FFFFFF", borderRadius: "6px", padding: "8px 10px", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#94A3B8", marginBottom: "4px" }}>消防等级</label>
                  <select
                    value={fireRating}
                    onChange={(e) => setFireRating(e.target.value)}
                    style={{ width: "100%", background: "#0B132B", border: "1px solid rgba(255,255,255,0.15)", color: "#FFFFFF", borderRadius: "6px", padding: "8px 10px", fontSize: "13px" }}
                  >
                    <option value="丁类">丁类</option>
                    <option value="丙二类">丙二类</option>
                    <option value="丙一类">丙一类</option>
                    <option value="戊类">戊类</option>
                    <option value="甲乙类防爆">甲乙类防爆</option>
                  </select>
                </div>
              </div>

              {/* 特性勾选 */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "16px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#CBD5E1", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={canSubdivide}
                    onChange={(e) => setCanSubdivide(e.target.checked)}
                  />
                  可按需分租
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#CBD5E1", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={bigTruckAccess}
                    onChange={(e) => setBigTruckAccess(e.target.checked)}
                  />
                  17.5米大货车进出便利
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#CBD5E1", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={hasCrane}
                    onChange={(e) => setHasCrane(e.target.checked)}
                  />
                  配备行车天车
                </label>
                {hasCrane && (
                  <input
                    type="number"
                    placeholder="行车吨位(吨)"
                    value={craneTonnage}
                    onChange={(e) => setCraneTonnage(e.target.value)}
                    style={{ width: "120px", background: "#0B132B", border: "1px solid rgba(255,255,255,0.2)", color: "#FFF", borderRadius: "4px", padding: "4px 8px", fontSize: "12px" }}
                  />
                )}
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#CBD5E1", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={loadingDock}
                    onChange={(e) => setLoadingDock(e.target.checked)}
                  />
                  液压装卸升降平台
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#CBD5E1", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={hasElevator}
                    onChange={(e) => setHasElevator(e.target.checked)}
                  />
                  配载货电梯
                </label>
              </div>
            </div>
          )}

          {/* 配套生活与环评设施 */}
          <div style={{ marginBottom: "20px", background: "rgba(0,0,0,0.2)", padding: "16px", borderRadius: "12px" }}>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#38BDF8", marginBottom: "12px" }}>
              🏢 园区配套与适合行业
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "18px", marginBottom: "14px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#CBD5E1", cursor: "pointer" }}>
                <input type="checkbox" checked={hasOffice} onChange={(e) => setHasOffice(e.target.checked)} />
                配套办公楼
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#CBD5E1", cursor: "pointer" }}>
                <input type="checkbox" checked={hasDormitory} onChange={(e) => setHasDormitory(e.target.checked)} />
                员工宿舍楼
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#CBD5E1", cursor: "pointer" }}>
                <input type="checkbox" checked={hasCanteen} onChange={(e) => setHasCanteen(e.target.checked)} />
                园区职工食堂
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#CBD5E1", cursor: "pointer" }}>
                <input type="checkbox" checked={hasPollutionPermit} onChange={(e) => setHasPollutionPermit(e.target.checked)} />
                具备排污/环评资质许可
              </label>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#94A3B8", marginBottom: "4px" }}>
                适合入驻产业行业
              </label>
              <input
                type="text"
                value={fitIndustries}
                onChange={(e) => setFitIndustries(e.target.value)}
                placeholder="如：食品深加工、机械制造、新材料、电商仓储物流、冷链等"
                style={{ width: "100%", background: "#0B132B", border: "1px solid rgba(255,255,255,0.15)", color: "#FFFFFF", borderRadius: "6px", padding: "8px 12px", fontSize: "13px" }}
              />
            </div>
          </div>

          {/* 图文与相册 */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px", fontWeight: "600" }}>
              图文详细说明
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请详细描述厂房或园区优势、地理交通、变压器容量、招商优惠政策及租售要求..."
              style={{ width: "100%", background: "#0B132B", border: "1px solid rgba(255,255,255,0.15)", color: "#FFFFFF", borderRadius: "8px", padding: "10px 14px", fontSize: "14px", outline: "none" }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px", fontWeight: "600" }}>
              现场实景图片 (最多20张)
            </label>
            <ImageUpload
              value={images}
              onChange={setImages}
              maxCount={20}
            />
          </div>

          {/* 联系人 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "28px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px", fontWeight: "600" }}>
                联系人姓名 *
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="如：王总、李经理"
                style={{ width: "100%", background: "#0B132B", border: "1px solid rgba(255,255,255,0.15)", color: "#FFFFFF", borderRadius: "8px", padding: "10px 14px", fontSize: "14px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px", fontWeight: "600" }}>
                手机联系电话 *
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="11位手机号码"
                style={{ width: "100%", background: "#0B132B", border: "1px solid rgba(255,255,255,0.15)", color: "#FFFFFF", borderRadius: "8px", padding: "10px 14px", fontSize: "14px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px", fontWeight: "600" }}>
                微信号 (选填)
              </label>
              <input
                type="text"
                value={wechat}
                onChange={(e) => setWechat(e.target.value)}
                placeholder="选填"
                style={{ width: "100%", background: "#0B132B", border: "1px solid rgba(255,255,255,0.15)", color: "#FFFFFF", borderRadius: "8px", padding: "10px 14px", fontSize: "14px" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <Link
              href={`/industrial/${id}`}
              style={{ padding: "12px 24px", background: "rgba(255,255,255,0.1)", color: "#CBD5E1", borderRadius: "8px", textDecoration: "none", fontSize: "14px", fontWeight: "600" }}
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "12px 32px",
                background: submitting ? "#64748b" : "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                fontSize: "15px",
                fontWeight: "700",
                cursor: submitting ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px rgba(2, 132, 199, 0.3)",
              }}
            >
              {submitting ? "正在保存..." : "保存修改"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
