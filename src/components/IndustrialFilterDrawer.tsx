"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface IndustrialFilterDrawerProps {
  currentRegion?: string;
  currentType?: string;
  currentTransaction?: string;
  currentArea?: string;
  currentHeight?: string;
  currentPower?: string;
  currentSingleFloor?: boolean;
  currentCrane?: boolean;
  currentFire?: boolean;
  currentTruck?: boolean;
  currentCanSplit?: boolean;
  currentLoadingBay?: boolean;
  currentOffice?: boolean;
  currentDormitory?: boolean;
}

export default function IndustrialFilterDrawer({
  currentRegion = "",
  currentType = "",
  currentTransaction = "",
  currentArea = "",
  currentHeight = "",
  currentPower = "",
  currentSingleFloor = false,
  currentCrane = false,
  currentFire = false,
  currentTruck = false,
  currentCanSplit = false,
  currentLoadingBay = false,
  currentOffice = false,
  currentDormitory = false,
}: IndustrialFilterDrawerProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [region, setRegion] = useState(currentRegion);
  const [type, setType] = useState(currentType);
  const [transaction, setTransaction] = useState(currentTransaction);
  const [area, setArea] = useState(currentArea);
  const [height, setHeight] = useState(currentHeight);
  const [power, setPower] = useState(currentPower);

  // 特性 Tag
  const [singleFloor, setSingleFloor] = useState(currentSingleFloor);
  const [crane, setCrane] = useState(currentCrane);
  const [fire, setFire] = useState(currentFire);
  const [truck, setTruck] = useState(currentTruck);
  const [canSplit, setCanSplit] = useState(currentCanSplit);
  const [loadingBay, setLoadingBay] = useState(currentLoadingBay);
  const [office, setOffice] = useState(currentOffice);
  const [dormitory, setDormitory] = useState(currentDormitory);

  const handleApply = () => {
    const params = new URLSearchParams();
    const q = searchParams.get("q");
    if (q) params.set("q", q);

    if (region && region !== "全部区域" && region !== "all") params.set("region", region);
    if (type && type !== "ALL" && type !== "all") params.set("type", type);
    if (transaction && transaction !== "ALL" && transaction !== "all") params.set("transaction", transaction);
    if (area && area !== "all") params.set("area", area);
    if (height && height !== "all") params.set("height", height);
    if (power && power !== "all") params.set("power", power);

    if (singleFloor) params.set("singleFloor", "true");
    if (crane) params.set("crane", "true");
    if (fire) params.set("fire", "true");
    if (truck) params.set("truck", "true");
    if (canSplit) params.set("canSplit", "true");
    if (loadingBay) params.set("loadingBay", "true");
    if (office) params.set("office", "true");
    if (dormitory) params.set("dormitory", "true");

    const queryStr = params.toString();
    router.push(queryStr ? `/industrial?${queryStr}` : "/industrial");
    setOpen(false);
  };

  const handleReset = () => {
    setRegion("");
    setType("");
    setTransaction("");
    setArea("");
    setHeight("");
    setPower("");
    setSingleFloor(false);
    setCrane(false);
    setFire(false);
    setTruck(false);
    setCanSplit(false);
    setLoadingBay(false);
    setOffice(false);
    setDormitory(false);
    router.push("/industrial");
    setOpen(false);
  };

  const activeCount = [
    region && region !== "全部区域" && region !== "all",
    type && type !== "ALL" && type !== "all",
    transaction && transaction !== "ALL" && transaction !== "all",
    area && area !== "all",
    height && height !== "all",
    power && power !== "all",
    singleFloor,
    crane,
    fire,
    truck,
    canSplit,
    loadingBay,
    office,
    dormitory,
  ].filter(Boolean).length;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          background: activeCount > 0 ? "#EEF2FF" : "#F8FAFC",
          color: activeCount > 0 ? "#2563EB" : "#334155",
          border: activeCount > 0 ? "1px solid #BFDBFE" : "1px solid #E2E8F0",
          borderRadius: "8px",
          padding: "7px 14px",
          fontSize: "13px",
          fontWeight: "700",
          cursor: "pointer",
        }}
      >
        <span>⚡ 更多工业筛选</span>
        {activeCount > 0 && (
          <span
            style={{
              background: "#2563EB",
              color: "#FFFFFF",
              borderRadius: "10px",
              padding: "1px 6px",
              fontSize: "11px",
            }}
          >
            {activeCount}
          </span>
        )}
      </button>

      {/* 遮罩与 Bottom Sheet 抽屉 */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderTopLeftRadius: "16px",
              borderTopRightRadius: "16px",
              padding: "20px 16px 24px 16px",
              maxHeight: "85vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 抽屉标题行 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #F1F5F9", paddingBottom: "12px" }}>
              <span style={{ fontSize: "16px", fontWeight: "900", color: "#0F172A" }}>园区物业高级筛选</span>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "transparent", border: "none", fontSize: "18px", color: "#64748B", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* 1. 区域选择 */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: "800", color: "#1E293B", marginBottom: "8px" }}>所在区域</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {["全部", "杨林经开区", "杨林工业园区", "杨林镇", "大学城周边", "空港大道沿线", "嵩明其他"].map((r) => {
                  const val = r === "全部" ? "" : r;
                  const selected = region === val || (r === "全部" && !region);
                  return (
                    <button
                      key={r}
                      onClick={() => setRegion(val)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "12.5px",
                        fontWeight: selected ? "800" : "500",
                        background: selected ? "#EFF6FF" : "#F8FAFC",
                        color: selected ? "#2563EB" : "#475569",
                        border: selected ? "1px solid #3B82F6" : "1px solid #E2E8F0",
                      }}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. 物业类型 */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: "800", color: "#1E293B", marginBottom: "8px" }}>物业类型</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {[
                  { label: "全部", val: "" },
                  { label: "厂房", val: "FACTORY" },
                  { label: "仓库", val: "WAREHOUSE" },
                  { label: "土地/地皮", val: "LAND" },
                  { label: "办公楼", val: "OFFICE" },
                  { label: "产业园物业", val: "INDUSTRIAL_PARK" },
                  { label: "园区商业配套", val: "COMMERCIAL_SUPPORT" },
                ].map((t) => {
                  const selected = type === t.val || (t.val === "" && !type);
                  return (
                    <button
                      key={t.label}
                      onClick={() => setType(t.val)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "12.5px",
                        fontWeight: selected ? "800" : "500",
                        background: selected ? "#EFF6FF" : "#F8FAFC",
                        color: selected ? "#2563EB" : "#475569",
                        border: selected ? "1px solid #3B82F6" : "1px solid #E2E8F0",
                      }}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. 交易方式 */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: "800", color: "#1E293B", marginBottom: "8px" }}>交易方式</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {[
                  { label: "全部", val: "" },
                  { label: "出租", val: "RENT" },
                  { label: "出售", val: "SALE" },
                  { label: "转让", val: "TRANSFER" },
                  { label: "招商合作", val: "COOPERATION" },
                  { label: "求租", val: "WANTED_RENT" },
                  { label: "求购", val: "WANTED_BUY" },
                ].map((tr) => {
                  const selected = transaction === tr.val || (tr.val === "" && !transaction);
                  return (
                    <button
                      key={tr.label}
                      onClick={() => setTransaction(tr.val)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "12.5px",
                        fontWeight: selected ? "800" : "500",
                        background: selected ? "#EFF6FF" : "#F8FAFC",
                        color: selected ? "#2563EB" : "#475569",
                        border: selected ? "1px solid #3B82F6" : "1px solid #E2E8F0",
                      }}
                    >
                      {tr.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. 面积区间 */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: "800", color: "#1E293B", marginBottom: "8px" }}>面积跨度</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {[
                  { label: "全部", val: "" },
                  { label: "0-500㎡", val: "0-500" },
                  { label: "500-1000㎡", val: "500-1000" },
                  { label: "1000-3000㎡", val: "1000-3000" },
                  { label: "3000-5000㎡", val: "3000-5000" },
                  { label: "5000㎡以上", val: "5000+" },
                ].map((ar) => {
                  const selected = area === ar.val || (ar.val === "" && !area);
                  return (
                    <button
                      key={ar.label}
                      onClick={() => setArea(ar.val)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "12.5px",
                        fontWeight: selected ? "800" : "500",
                        background: selected ? "#EFF6FF" : "#F8FAFC",
                        color: selected ? "#2563EB" : "#475569",
                        border: selected ? "1px solid #3B82F6" : "1px solid #E2E8F0",
                      }}
                    >
                      {ar.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. 层高区间 */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: "800", color: "#1E293B", marginBottom: "8px" }}>车间净空层高</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {[
                  { label: "全部", val: "" },
                  { label: "6m以下", val: "0-6" },
                  { label: "6-9m", val: "6-9" },
                  { label: "9-12m", val: "9-12" },
                  { label: "12m以上", val: "12+" },
                ].map((h) => {
                  const selected = height === h.val || (h.val === "" && !height);
                  return (
                    <button
                      key={h.label}
                      onClick={() => setHeight(h.val)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "12.5px",
                        fontWeight: selected ? "800" : "500",
                        background: selected ? "#EFF6FF" : "#F8FAFC",
                        color: selected ? "#2563EB" : "#475569",
                        border: selected ? "1px solid #3B82F6" : "1px solid #E2E8F0",
                      }}
                    >
                      {h.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6. 电力容量 */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: "800", color: "#1E293B", marginBottom: "8px" }}>配电变压器容量</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {[
                  { label: "全部", val: "" },
                  { label: "100kVA以下", val: "0-100" },
                  { label: "100-300kVA", val: "100-300" },
                  { label: "300-500kVA", val: "300-500" },
                  { label: "500-1000kVA", val: "500-1000" },
                  { label: "1000kVA以上", val: "1000+" },
                ].map((p) => {
                  const selected = power === p.val || (p.val === "" && !power);
                  return (
                    <button
                      key={p.label}
                      onClick={() => setPower(p.val)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "12.5px",
                        fontWeight: selected ? "800" : "500",
                        background: selected ? "#EFF6FF" : "#F8FAFC",
                        color: selected ? "#2563EB" : "#475569",
                        border: selected ? "1px solid #3B82F6" : "1px solid #E2E8F0",
                      }}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 7. 关键工业属性 Tag (多选) */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "13px", fontWeight: "800", color: "#1E293B", marginBottom: "8px" }}>核心工程与工艺条件</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {[
                  { label: "单层厂房", checked: singleFloor, toggle: () => setSingleFloor(!singleFloor) },
                  { label: "有行车/吊车", checked: crane, toggle: () => setCrane(!crane) },
                  { label: "带消防喷淋", checked: fire, toggle: () => setFire(!fire) },
                  { label: "大车好进(17.5m)", checked: truck, toggle: () => setTruck(!truck) },
                  { label: "支持分租", checked: canSplit, toggle: () => setCanSplit(!canSplit) },
                  { label: "有高台装卸口", checked: loadingBay, toggle: () => setLoadingBay(!loadingBay) },
                  { label: "配办公楼", checked: office, toggle: () => setOffice(!office) },
                  { label: "配员工宿舍", checked: dormitory, toggle: () => setDormitory(!dormitory) },
                ].map((cond) => (
                  <button
                    key={cond.label}
                    onClick={cond.toggle}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "12.5px",
                      fontWeight: cond.checked ? "800" : "500",
                      background: cond.checked ? "#ECFDF5" : "#F8FAFC",
                      color: cond.checked ? "#059669" : "#475569",
                      border: cond.checked ? "1px solid #10B981" : "1px solid #E2E8F0",
                    }}
                  >
                    {cond.checked ? "✓ " : ""}{cond.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 底部按钮栏 */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleReset}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  borderRadius: "8px",
                  background: "#F1F5F9",
                  color: "#475569",
                  fontWeight: "700",
                  fontSize: "14px",
                  border: "1px solid #CBD5E1",
                  cursor: "pointer",
                }}
              >
                重置
              </button>
              <button
                onClick={handleApply}
                style={{
                  flex: 2,
                  padding: "12px 0",
                  borderRadius: "8px",
                  background: "#2563EB",
                  color: "#FFFFFF",
                  fontWeight: "800",
                  fontSize: "14px",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
                }}
              >
                确定查看结果
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
