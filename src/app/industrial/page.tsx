import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import IndustrialFilterDrawer from "@/components/IndustrialFilterDrawer";
import { prisma } from "@/lib/prisma";
import {
  Factory,
  Warehouse,
  Map as MapIcon,
  Building2,
  Handshake,
  Search,
  Wrench,
  PlusCircle,
  MapPin,
  BadgeCheck,
  PhoneCall,
  Truck,
  Hammer,
  Cctv,
  ShieldCheck,
  Users,
  Printer,
  Phone,
  SlidersHorizontal,
  X,
  FileText,
  Clock,
  ArrowRight,
  ChevronDown,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "杨林厂房出租_工业园区土地仓库办公楼招商 - 杨林生活网",
  description: "杨林生活网园区招商频道提供杨林经开区、杨林工业园区及嵩明周边厂房出租、仓库出租、工业土地、办公楼、招商合作、求租求购等信息。",
  keywords: ["杨林厂房出租", "杨林经开区厂房", "杨林仓库出租", "杨林工业土地", "杨林招商合作", "杨林办公楼租售", "杨林生活网"],
  openGraph: {
    title: "杨林厂房出租_工业园区土地仓库办公楼招商 - 杨林生活网",
    description: "杨林经开区标准单层厂房、高台仓库、工业用地与招商合作平台，真实对接业主与园区直招。",
    url: "https://iyanglin.com/industrial",
    siteName: "杨林生活网",
  },
  alternates: {
    canonical: "https://iyanglin.com/industrial",
  },
};

export const revalidate = 30; // 每 30 秒增量刷新

type PageProps = {
  searchParams: Promise<{
    type?: string;
    transaction?: string;
    region?: string;
    wanted?: string;
    area?: string;
    height?: string;
    power?: string;
    sort?: string;
    q?: string;
    singleFloor?: string;
    crane?: string;
    fire?: string;
    truck?: string;
    canSplit?: string;
    loadingBay?: string;
    office?: string;
    dormitory?: string;
  }>;
};

export default async function IndustrialPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentType = params.type || "";
  const currentTransaction = params.transaction || "";
  const currentRegion = params.region || "";
  const currentWanted = params.wanted || "";
  const currentArea = params.area || "";
  const currentHeight = params.height || "";
  const currentPower = params.power || "";
  const currentSort = params.sort || "DEFAULT";
  const query = (params.q || "").trim();

  const isSingleFloor = params.singleFloor === "true";
  const hasCrane = params.crane === "true";
  const hasFireSystem = params.fire === "true";
  const truckAccessible = params.truck === "true";
  const canSplit = params.canSplit === "true";
  const hasLoadingDock = params.loadingBay === "true";
  const hasOffice = params.office === "true";
  const hasDormitory = params.dormitory === "true";

  // 构建数据库查询
  const where: any = { status: "PUBLISHED" };

  if (currentType && currentType !== "all" && currentType !== "ALL") {
    where.propertyType = currentType.toUpperCase();
  }

  if (currentTransaction && currentTransaction !== "all" && currentTransaction !== "ALL") {
    where.transactionType = currentTransaction.toUpperCase();
  } else if (currentWanted === "true") {
    where.transactionType = { in: ["WANTED_RENT", "WANTED_BUY"] };
  } else if (currentWanted === "false") {
    where.transactionType = { notIn: ["WANTED_RENT", "WANTED_BUY"] };
  }

  if (currentRegion && currentRegion !== "all" && currentRegion !== "全部区域") {
    where.region = currentRegion;
  }

  if (currentArea) {
    if (currentArea === "0-500") {
      where.OR = [{ buildingArea: { lte: 500 } }, { landArea: { lte: 500 } }];
    } else if (currentArea === "500-1000") {
      where.OR = [
        { buildingArea: { gt: 500, lte: 1000 } },
        { landArea: { gt: 500, lte: 1000 } },
      ];
    } else if (currentArea === "1000-3000") {
      where.OR = [
        { buildingArea: { gt: 1000, lte: 3000 } },
        { landArea: { gt: 1000, lte: 3000 } },
      ];
    } else if (currentArea === "3000-5000") {
      where.OR = [
        { buildingArea: { gt: 3000, lte: 5000 } },
        { landArea: { gt: 3000, lte: 5000 } },
      ];
    } else if (currentArea === "5000+") {
      where.OR = [{ buildingArea: { gt: 5000 } }, { landArea: { gt: 5000 } }];
    }
  }

  // 层高区间
  if (currentHeight) {
    if (currentHeight === "0-6") where.floorHeight = { lte: 6 };
    else if (currentHeight === "6-9") where.floorHeight = { gt: 6, lte: 9 };
    else if (currentHeight === "9-12") where.floorHeight = { gt: 9, lte: 12 };
    else if (currentHeight === "12+") where.floorHeight = { gt: 12 };
  }

  // 电力容量
  if (currentPower) {
    if (currentPower === "0-100") where.powerCapacity = { lte: 100 };
    else if (currentPower === "100-300") where.powerCapacity = { gt: 100, lte: 300 };
    else if (currentPower === "300-500") where.powerCapacity = { gt: 300, lte: 500 };
    else if (currentPower === "500-1000") where.powerCapacity = { gt: 500, lte: 1000 };
    else if (currentPower === "1000+") where.powerCapacity = { gt: 1000 };
  }

  if (isSingleFloor) where.isSingleFloor = true;
  if (hasCrane) where.hasCrane = true;
  if (hasFireSystem) where.hasFireSystem = true;
  if (truckAccessible) where.truckAccessible = true;
  if (canSplit) where.canSplit = true;
  if (hasLoadingDock) where.hasLoadingDock = true;
  if (hasOffice) where.hasOffice = true;
  if (hasDormitory) where.hasDormitory = true;

  if (query) {
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { parkName: { contains: query, mode: "insensitive" } },
          { address: { contains: query, mode: "insensitive" } },
        ],
      },
    ];
  }

  // 排序规则
  let orderBy: any = [{ isTop: "desc" }, { createdAt: "desc" }];
  if (currentSort === "LATEST") {
    orderBy = [{ createdAt: "desc" }];
  } else if (currentSort === "PRICE_ASC") {
    orderBy = [{ rentPrice: "asc" }, { salePrice: "asc" }];
  } else if (currentSort === "AREA_ASC") {
    orderBy = [{ buildingArea: "asc" }, { landArea: "asc" }];
  } else if (currentSort === "AREA_DESC") {
    orderBy = [{ buildingArea: "desc" }, { landArea: "desc" }];
  }

  // 并行获取房源与最新求租求购需求
  const [properties, wantedList, totalCount] = await Promise.all([
    prisma.industrialProperty.findMany({
      where,
      orderBy,
      take: 24,
    }),
    prisma.industrialProperty.findMany({
      where: {
        status: "PUBLISHED",
        transactionType: { in: ["WANTED_RENT", "WANTED_BUY"] },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.industrialProperty.count({ where }),
  ]);

  const propertyTypeLabels: Record<string, string> = {
    FACTORY: "厂房",
    WAREHOUSE: "仓库",
    LAND: "土地/地皮",
    OFFICE: "办公楼",
    INDUSTRIAL_PARK: "产业园物业",
    COMMERCIAL_SUPPORT: "商业配套",
    OTHER: "其他",
  };

  const transactionTypeLabels: Record<string, string> = {
    RENT: "出租",
    SALE: "出售",
    TRANSFER: "转让",
    COOPERATION: "合作",
    JOINT_OPERATION: "联营",
    WANTED_RENT: "求租",
    WANTED_BUY: "求购",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F4F6F9", color: "#181818", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif" }}>
      <Navbar />

      {/* =========================================================================
          1. 园区招商首页 Hero (紧凑工业现代风，压减至约 360-400px，删除第二搜索框，节奏向上)
          ========================================================================= */}
      <section
        style={{
          background: "radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(135deg, #071326 0%, #0F2347 50%, #173258 100%)",
          backgroundSize: "22px 22px, 100% 100%",
          color: "#FFFFFF",
          padding: "1.75rem 0 1.5rem 0",
          position: "relative",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}
      >
        {/* 轻量工业建筑/网格纹理背景线稿（透明度 0.04 不干扰文字） */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Cpath d='M0 80 L80 0 L160 80 L80 160 Z' fill='none' stroke='%23ffffff' stroke-width='0.5' stroke-opacity='0.04'/%3E%3Cpath d='M80 0 L80 160 M0 80 L160 80' fill='none' stroke='%2338bdf8' stroke-width='0.5' stroke-opacity='0.03'/%3E%3C/svg%3E")`,
            pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 1.25rem", textAlign: "center", position: "relative", zIndex: 1 }}>
          {/* 1. 顶部小标签 */}
          <div style={{ marginBottom: "14px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(59,130,246,0.18)",
                border: "1px solid rgba(147,197,253,0.35)",
                color: "#BFDBFE",
                padding: "3px 14px",
                borderRadius: "100px",
                fontSize: "12px",
                fontWeight: "700",
                letterSpacing: "0.02em",
              }}
            >
              <Factory size={13} color="#60A5FA" />
              <span>杨林经开区 · 嵩明周边专业工业地产与招商引资入口</span>
            </span>
          </div>

          {/* 2. 主标题 */}
          <h1
            style={{
              fontSize: "clamp(23px, 3.2vw, 32px)",
              fontWeight: "900",
              letterSpacing: "-0.02em",
              margin: "0 0 10px 0",
              color: "#FFFFFF",
              lineHeight: 1.25,
            }}
          >
            杨林 · 嵩明工业地产与园区招商
          </h1>

          {/* 3. 副标题 */}
          <p
            style={{
              fontSize: "14px",
              color: "#CBD5E1",
              maxWidth: "680px",
              margin: "0 auto 18px auto",
              lineHeight: "1.4",
            }}
          >
            找厂房、找仓库、找土地、找办公楼、找项目合作 · 平台直联业主与招商办
          </p>

          {/* 4. 工业频道能力标签 */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "20px",
            }}
          >
            {[
              { label: "厂房出租", href: "/industrial?type=FACTORY&transaction=RENT" },
              { label: "仓库出租", href: "/industrial?type=WAREHOUSE&transaction=RENT" },
              { label: "工业土地", href: "/industrial?type=LAND" },
              { label: "研发办公", href: "/industrial?type=OFFICE" },
              { label: "招商合作", href: "/industrial?type=INDUSTRIAL_PARK" },
              { label: "求租求购", href: "/industrial?wanted=true" },
            ].map((tag, idx) => (
              <Link
                key={idx}
                href={tag.href}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  color: "#E2E8F0",
                  padding: "3px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "600",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span style={{ color: "#38BDF8", fontSize: "10px" }}>●</span>
                <span>{tag.label}</span>
              </Link>
            ))}
          </div>

          {/* 5. 快捷入口导航 (8卡片严谨对称排版：PC 8卡等宽并列 / 平板4+4 / 手机2×4双列紧凑流) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: "10px",
              maxWidth: "1040px",
              margin: "0 auto",
            }}
          >
            {[
              { label: "标准厂房", icon: <Factory size={20} />, href: "/industrial?type=FACTORY", subtext: "独栋/分层" },
              { label: "仓储物流", icon: <Warehouse size={20} />, href: "/industrial?type=WAREHOUSE", subtext: "高台/恒温" },
              { label: "工业土地", icon: <MapIcon size={20} />, href: "/industrial?type=LAND", subtext: "出让/转让" },
              { label: "研发办公", icon: <Building2 size={20} />, href: "/industrial?type=OFFICE", subtext: "总部/配套" },
              { label: "招商合作", icon: <Handshake size={20} />, href: "/industrial?type=INDUSTRIAL_PARK", subtext: "政企直联" },
              { label: "求租求购", icon: <Search size={20} />, href: "/industrial?wanted=true", subtext: "真实客源" },
              { label: "园区服务", icon: <Wrench size={20} />, href: "#park-services", subtext: "环评/电力" },
              {
                label: "+ 发布厂房 / 招商",
                icon: <PlusCircle size={20} />,
                href: "/industrial/publish",
                isPublish: true,
                badge: "免费发布",
                subtext: "出租 · 出售 · 合作 · 求租",
              },
            ].map((entry, i) => (
              <Link
                prefetch={false}
                key={i}
                href={entry.href}
                style={{
                  background: entry.isPublish
                    ? "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
                    : "rgba(255,255,255,0.08)",
                  border: entry.isPublish ? "1px solid #FCD34D" : "1px solid rgba(255,255,255,0.14)",
                  borderRadius: "10px",
                  padding: "10px 6px 8px 6px",
                  textAlign: "center",
                  textDecoration: "none",
                  color: "#FFFFFF",
                  backdropFilter: "blur(4px)",
                  transition: "all 0.15s ease",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "3px",
                  boxShadow: entry.isPublish ? "0 4px 14px rgba(245,158,11,0.35)" : "0 2px 6px rgba(0,0,0,0.15)",
                  position: "relative",
                }}
              >
                {entry.badge && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-7px",
                      right: "6px",
                      background: "#EF4444",
                      color: "#FFFFFF",
                      fontSize: "9.5px",
                      fontWeight: "800",
                      padding: "1px 6px",
                      borderRadius: "10px",
                      boxShadow: "0 2px 6px rgba(239,68,68,0.4)",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {entry.badge}
                  </span>
                )}
                <span style={{ color: entry.isPublish ? "#FFFFFF" : "#93C5FD", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {entry.icon}
                </span>
                <span style={{ fontSize: "13px", fontWeight: "800", marginTop: "1px", whiteSpace: "nowrap" }}>{entry.label}</span>
                {entry.subtext && (
                  <span style={{ fontSize: "10.5px", color: entry.isPublish ? "rgba(255,255,255,0.95)" : "rgba(203, 213, 225, 0.8)", transform: "scale(0.92)" }}>
                    {entry.subtext}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. 最新企业选址 / 求租需求 (高商业价值客源看板，专业参数卡，摒弃假人物图)
          ========================================================================= */}
      {wantedList.length > 0 && !query && !currentType && (
        <section style={{ maxWidth: "1240px", margin: "24px auto 0 auto", padding: "0 1.25rem" }}>
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "16px",
              padding: "20px 24px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #F1F5F9", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", color: "#DC2626" }}>
                  <Sparkles size={16} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "16px", fontWeight: "900", color: "#0F172A" }}>最新企业选址 / 求租求购需求</span>
                    <span style={{ background: "#FEF2F2", color: "#DC2626", fontSize: "11px", fontWeight: "800", padding: "1px 6px", borderRadius: "4px" }}>精准客源</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                    真实企业入驻意向与刚性生产租赁需求，直联企业投资选址决策人
                  </div>
                </div>
              </div>
              <Link prefetch={false} href="/industrial?wanted=true" style={{ fontSize: "13px", color: "#2563EB", fontWeight: "800", textDecoration: "none", display: "flex", alignItems: "center", gap: "2px" }}>
                <span>查看全部需求</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "14px" }}>
              {wantedList.map((w) => {
                const isBuy = w.transactionType === "WANTED_BUY";
                return (
                  <Link
                    prefetch={false}
                    key={w.id}
                    href={`/industrial/${w.id}`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      background: "#F8FAFC",
                      borderRadius: "12px",
                      border: "1px solid #E2E8F0",
                      padding: "14px 16px",
                      textDecoration: "none",
                      color: "inherit",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div>
                      {/* 头部标签与发布时间 */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{
                            background: isBuy ? "#FEF3C7" : "#EFF6FF",
                            color: isBuy ? "#B45309" : "#1D4ED8",
                            fontSize: "11px",
                            fontWeight: "800",
                            padding: "2px 7px",
                            borderRadius: "4px",
                          }}>
                            {isBuy ? "企业求购" : "企业求租"}
                          </span>
                          <span style={{ fontSize: "11.5px", color: "#64748B", display: "flex", alignItems: "center", gap: "3px" }}>
                            <Clock size={12} />
                            {new Date(w.createdAt).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}
                          </span>
                        </div>
                        <span style={{ fontSize: "11px", color: "#059669", fontWeight: "700" }}>
                          {w.verifiedLevel === "PHONE_VERIFIED" ? "电话已核验" : "企业已认证"}
                        </span>
                      </div>

                      {/* 需求标题 */}
                      <h4 style={{
                        fontSize: "14px",
                        fontWeight: "800",
                        color: "#0F172A",
                        margin: "0 0 10px 0",
                        lineHeight: "1.45",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}>
                        {w.title}
                      </h4>

                      {/* 需求关键指标网格 */}
                      <div style={{
                        background: "#FFFFFF",
                        borderRadius: "8px",
                        padding: "8px 10px",
                        border: "1px solid #F1F5F9",
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: "6px",
                        fontSize: "12px",
                      }}>
                        <div>
                          <span style={{ color: "#64748B" }}>期望面积：</span>
                          <strong style={{ color: "#0F172A" }}>
                            {w.buildingArea ? `${w.buildingArea}㎡` : w.landArea ? `${w.landArea}亩` : "面议"}
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: "#64748B" }}>意向区域：</span>
                          <strong style={{ color: "#0F172A" }}>{w.region || "杨林周边"}</strong>
                        </div>
                        <div style={{ gridColumn: "span 2", display: "flex", alignItems: "center", gap: "4px", color: "#475569" }}>
                          <span style={{ color: "#64748B", flexShrink: 0 }}>核心要求：</span>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {w.hasFireSystem ? "合规消防 · " : ""}
                            {w.truckAccessible ? "大车直达 · " : ""}
                            {w.powerCapacity ? `电力≥${w.powerCapacity}kVA` : "手续合规齐全"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 底部查看需求动作条 */}
                    <div style={{
                      marginTop: "12px",
                      paddingTop: "8px",
                      borderTop: "1px dashed #E2E8F0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}>
                      <span style={{ fontSize: "12px", color: "#64748B" }}>
                        联系意向人：{w.contactName}
                      </span>
                      <span style={{
                        fontSize: "12px",
                        color: "#2563EB",
                        fontWeight: "800",
                        display: "flex",
                        alignItems: "center",
                        gap: "2px",
                      }}>
                        查看需求详情 ›
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          3. 综合多维筛选控制台 (PC 顶部 / 手机端唤起抽屉)
          ========================================================================= */}
      <section style={{ maxWidth: "1240px", margin: "20px auto 0 auto", padding: "0 1.25rem" }}>
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "14px",
            border: "1px solid #E2E8F0",
            padding: "16px 20px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
          }}
        >
          {/* PC 筛选栏 */}
          <div className="desktop-only" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* 区域筛选行 */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px" }}>
              <span style={{ fontWeight: "800", color: "#64748B", minWidth: "64px" }}>所属区域：</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {["全部", "杨林经开区", "杨林工业园区", "杨林镇", "大学城周边", "空港大道沿线", "嵩明其他"].map((r) => {
                  const val = r === "全部" ? "" : r;
                  const active = currentRegion === val || (r === "全部" && !currentRegion);
                  return (
                    <Link
                      prefetch={false}
                      key={r}
                      href={`/industrial?region=${encodeURIComponent(val)}&type=${currentType}&transaction=${currentTransaction}`}
                      style={{
                        padding: "3px 10px",
                        borderRadius: "4px",
                        fontWeight: active ? "800" : "500",
                        background: active ? "#2563EB" : "transparent",
                        color: active ? "#FFFFFF" : "#334155",
                        textDecoration: "none",
                      }}
                    >
                      {r}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* 物业类型筛选行 */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px" }}>
              <span style={{ fontWeight: "800", color: "#64748B", minWidth: "64px" }}>物业类型：</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {[
                  { label: "全部", val: "" },
                  { label: "厂房", val: "FACTORY" },
                  { label: "仓库", val: "WAREHOUSE" },
                  { label: "土地/地皮", val: "LAND" },
                  { label: "办公楼", val: "OFFICE" },
                  { label: "产业园", val: "INDUSTRIAL_PARK" },
                  { label: "商业配套", val: "COMMERCIAL_SUPPORT" },
                ].map((t) => {
                  const active = currentType === t.val || (t.val === "" && !currentType);
                  return (
                    <Link
                      prefetch={false}
                      key={t.label}
                      href={`/industrial?region=${currentRegion}&type=${t.val}&transaction=${currentTransaction}`}
                      style={{
                        padding: "3px 10px",
                        borderRadius: "4px",
                        fontWeight: active ? "800" : "500",
                        background: active ? "#2563EB" : "transparent",
                        color: active ? "#FFFFFF" : "#334155",
                        textDecoration: "none",
                      }}
                    >
                      {t.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* 交易方式筛选行 */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px" }}>
              <span style={{ fontWeight: "800", color: "#64748B", minWidth: "64px" }}>交易类型：</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {[
                  { label: "全部", val: "" },
                  { label: "出租", val: "RENT" },
                  { label: "出售", val: "SALE" },
                  { label: "转让", val: "TRANSFER" },
                  { label: "合作", val: "COOPERATION" },
                  { label: "求租", val: "WANTED_RENT" },
                  { label: "求购", val: "WANTED_BUY" },
                ].map((tr) => {
                  const active = currentTransaction === tr.val || (tr.val === "" && !currentTransaction);
                  return (
                    <Link
                      prefetch={false}
                      key={tr.label}
                      href={`/industrial?region=${currentRegion}&type=${currentType}&transaction=${tr.val}`}
                      style={{
                        padding: "3px 10px",
                        borderRadius: "4px",
                        fontWeight: active ? "800" : "500",
                        background: active ? "#2563EB" : "transparent",
                        color: active ? "#FFFFFF" : "#334155",
                        textDecoration: "none",
                      }}
                    >
                      {tr.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* 面积筛选行 */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px" }}>
              <span style={{ fontWeight: "800", color: "#64748B", minWidth: "64px" }}>面积跨度：</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {[
                  { label: "全部", val: "" },
                  { label: "0-500㎡", val: "0-500" },
                  { label: "500-1000㎡", val: "500-1000" },
                  { label: "1000-3000㎡", val: "1000-3000" },
                  { label: "3000-5000㎡", val: "3000-5000" },
                  { label: "5000㎡以上", val: "5000+" },
                ].map((a) => {
                  const active = currentArea === a.val || (a.val === "" && !currentArea);
                  return (
                    <Link
                      prefetch={false}
                      key={a.label}
                      href={`/industrial?region=${currentRegion}&type=${currentType}&transaction=${currentTransaction}&area=${a.val}`}
                      style={{
                        padding: "3px 10px",
                        borderRadius: "4px",
                        fontWeight: active ? "800" : "500",
                        background: active ? "#2563EB" : "transparent",
                        color: active ? "#FFFFFF" : "#334155",
                        textDecoration: "none",
                      }}
                    >
                      {a.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* 层高与工艺筛选快捷栏 */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px", paddingTop: "4px", borderTop: "1px dashed #F1F5F9" }}>
              <span style={{ fontWeight: "800", color: "#64748B", minWidth: "64px" }}>工程指标：</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                {[
                  { label: "单层厂房", key: "singleFloor", active: isSingleFloor },
                  { label: "配备行车", key: "crane", active: hasCrane },
                  { label: "合规消防", key: "fire", active: hasFireSystem },
                  { label: "17.5m大车直达", key: "truck", active: truckAccessible },
                  { label: "支持分租", key: "canSplit", active: canSplit },
                  { label: "装卸平台", key: "loadingBay", active: hasLoadingDock },
                  { label: "配办公楼", key: "office", active: hasOffice },
                  { label: "配宿舍", key: "dormitory", active: hasDormitory },
                ].map((feat) => {
                  const nextVal = feat.active ? "" : "true";
                  return (
                    <Link
                      prefetch={false}
                      key={feat.label}
                      href={`/industrial?region=${currentRegion}&type=${currentType}&transaction=${currentTransaction}&area=${currentArea}&${feat.key}=${nextVal}`}
                      style={{
                        padding: "3px 9px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: feat.active ? "800" : "500",
                        background: feat.active ? "#EFF6FF" : "#F8FAFC",
                        color: feat.active ? "#2563EB" : "#475569",
                        border: feat.active ? "1px solid #3B82F6" : "1px solid #E2E8F0",
                        textDecoration: "none",
                      }}
                    >
                      {feat.active ? "✓ " : ""}{feat.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 当前已选筛选标签条与排序/统计 */}
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "14px",
            paddingTop: "12px",
            borderTop: "1px solid #F1F5F9",
            gap: "10px",
          }}>
            {/* 左侧：统计与已选胶囊 */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", fontSize: "13px" }}>
              <span style={{ color: "#64748B" }}>
                共找到 <strong style={{ color: "#2563EB" }}>{totalCount}</strong> 套园区招商房源
              </span>

              {/* 已选条件胶囊 */}
              {(currentRegion || currentType || currentTransaction || currentArea || isSingleFloor || hasCrane || hasFireSystem || truckAccessible || canSplit || hasLoadingDock || hasOffice || hasDormitory || query) && (
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px" }}>
                  <span style={{ color: "#94A3B8" }}>| 已选：</span>
                  {currentRegion && (
                    <Link prefetch={false} href={`/industrial?type=${currentType}&transaction=${currentTransaction}&area=${currentArea}`} style={{ background: "#EFF6FF", color: "#1D4ED8", padding: "2px 8px", borderRadius: "100px", fontSize: "11.5px", fontWeight: "700", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                      <span>{currentRegion}</span> <X size={12} />
                    </Link>
                  )}
                  {currentType && (
                    <Link prefetch={false} href={`/industrial?region=${currentRegion}&transaction=${currentTransaction}&area=${currentArea}`} style={{ background: "#EFF6FF", color: "#1D4ED8", padding: "2px 8px", borderRadius: "100px", fontSize: "11.5px", fontWeight: "700", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                      <span>{propertyTypeLabels[currentType] || currentType}</span> <X size={12} />
                    </Link>
                  )}
                  {currentTransaction && (
                    <Link prefetch={false} href={`/industrial?region=${currentRegion}&type=${currentType}&area=${currentArea}`} style={{ background: "#EFF6FF", color: "#1D4ED8", padding: "2px 8px", borderRadius: "100px", fontSize: "11.5px", fontWeight: "700", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                      <span>{transactionTypeLabels[currentTransaction] || currentTransaction}</span> <X size={12} />
                    </Link>
                  )}
                  {currentArea && (
                    <Link prefetch={false} href={`/industrial?region=${currentRegion}&type=${currentType}&transaction=${currentTransaction}`} style={{ background: "#EFF6FF", color: "#1D4ED8", padding: "2px 8px", borderRadius: "100px", fontSize: "11.5px", fontWeight: "700", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                      <span>{currentArea}㎡</span> <X size={12} />
                    </Link>
                  )}
                  {hasCrane && (
                    <Link prefetch={false} href={`/industrial?region=${currentRegion}&type=${currentType}&transaction=${currentTransaction}&area=${currentArea}`} style={{ background: "#FEF3C7", color: "#B45309", padding: "2px 8px", borderRadius: "100px", fontSize: "11.5px", fontWeight: "700", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                      <span>有行车</span> <X size={12} />
                    </Link>
                  )}
                  {truckAccessible && (
                    <Link prefetch={false} href={`/industrial?region=${currentRegion}&type=${currentType}&transaction=${currentTransaction}&area=${currentArea}`} style={{ background: "#EFF6FF", color: "#1D4ED8", padding: "2px 8px", borderRadius: "100px", fontSize: "11.5px", fontWeight: "700", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                      <span>大车直达</span> <X size={12} />
                    </Link>
                  )}
                  {query && (
                    <Link prefetch={false} href={`/industrial?region=${currentRegion}&type=${currentType}&transaction=${currentTransaction}&area=${currentArea}`} style={{ background: "#F1F5F9", color: "#334155", padding: "2px 8px", borderRadius: "100px", fontSize: "11.5px", fontWeight: "700", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                      <span>关键词: {query}</span> <X size={12} />
                    </Link>
                  )}
                  <Link prefetch={false} href="/industrial" style={{ fontSize: "12px", color: "#DC2626", fontWeight: "700", textDecoration: "none", marginLeft: "4px" }}>
                    清空筛选
                  </Link>
                </div>
              )}
            </div>

            {/* 右侧：排序选项与抽屉按钮 */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12.5px", color: "#64748B" }}>
                <span>排序：</span>
                {[
                  { label: "默认推荐", val: "DEFAULT" },
                  { label: "最新发布", val: "LATEST" },
                  { label: "价格从低到高", val: "PRICE_ASC" },
                  { label: "面积从大到小", val: "AREA_DESC" },
                ].map((s) => {
                  const active = currentSort === s.val;
                  return (
                    <Link
                      prefetch={false}
                      key={s.label}
                      href={`/industrial?region=${currentRegion}&type=${currentType}&transaction=${currentTransaction}&area=${currentArea}&sort=${s.val}&q=${encodeURIComponent(query)}`}
                      style={{
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: active ? "800" : "500",
                        color: active ? "#2563EB" : "#64748B",
                        background: active ? "#EFF6FF" : "transparent",
                        textDecoration: "none",
                      }}
                    >
                      {s.label}
                    </Link>
                  );
                })}
              </div>

              <IndustrialFilterDrawer
                currentRegion={currentRegion}
                currentType={currentType}
                currentTransaction={currentTransaction}
                currentArea={currentArea}
                currentHeight={currentHeight}
                currentPower={currentPower}
                currentSingleFloor={isSingleFloor}
                currentCrane={hasCrane}
                currentFire={hasFireSystem}
                currentTruck={truckAccessible}
                currentCanSplit={canSplit}
                currentLoadingBay={hasLoadingDock}
                currentOffice={hasOffice}
                currentDormitory={hasDormitory}
              />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. 工业地产独立信息卡片流 (专业工业B2B卡片，杜绝住宅化)
          ========================================================================= */}
      <section style={{ maxWidth: "1240px", margin: "20px auto 3rem auto", padding: "0 1.25rem" }}>
        {properties.length === 0 ? (
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "14px",
              padding: "54px 20px",
              textAlign: "center",
              border: "1px solid #E2E8F0",
              boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "inline-flex", padding: "16px", borderRadius: "50%", background: "#F1F5F9", color: "#64748B", marginBottom: "14px" }}>
              <Factory size={36} />
            </div>
            <h3 style={{ fontSize: "17px", fontWeight: "900", color: "#1E293B", margin: "0 0 6px 0" }}>暂无符合条件的园区物业信息</h3>
            <p style={{ fontSize: "13px", color: "#64748B", margin: "0 0 20px 0" }}>您可以尝试放宽筛选条件，或直接提交您的企业求租/求购需求。</p>
            <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
              <Link
                prefetch={false}
                href="/industrial/publish?action=WANTED_RENT"
                style={{
                  background: "#2563EB",
                  color: "#FFFFFF",
                  padding: "9px 20px",
                  borderRadius: "8px",
                  fontSize: "13.5px",
                  fontWeight: "800",
                  textDecoration: "none",
                }}
              >
                免费提交选址求租
              </Link>
              <Link
                prefetch={false}
                href="/industrial"
                style={{
                  background: "#F1F5F9",
                  color: "#334155",
                  padding: "9px 20px",
                  borderRadius: "8px",
                  fontSize: "13.5px",
                  fontWeight: "700",
                  textDecoration: "none",
                }}
              >
                重置全部筛选
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "16px" }}>
            {properties.map((item) => {
              const coverImg = item.images && item.images[0] ? item.images[0] : "/images/legacy/notfindimg_house.png";
              const isWanted = item.transactionType === "WANTED_RENT" || item.transactionType === "WANTED_BUY";

              // 提取工业特征标签，最多保留 3 个，其余显示 +N
              const featureTags: string[] = [];
              if (item.isSingleFloor) featureTags.push("单层结构");
              if (item.hasCrane) featureTags.push(item.craneTonnage ? `行车${item.craneTonnage}吨` : "配备行车");
              if (item.hasFireSystem) featureTags.push(item.fireStatus ? `${item.fireStatus}消防` : "合规消防");
              if (item.canSplit) featureTags.push("支持分租");
              if (item.hasLoadingDock) featureTags.push("装卸平台");
              if (item.hasOffice) featureTags.push("配办公楼");
              if (item.hasDormitory) featureTags.push("配员工宿舍");

              const visibleTags = featureTags.slice(0, 3);
              const extraCount = featureTags.length - visibleTags.length;

              return (
                <Link
                  prefetch={false}
                  key={item.id}
                  href={`/industrial/${item.id}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    background: "#FFFFFF",
                    borderRadius: "14px",
                    overflow: "hidden",
                    border: item.isTop ? "1.5px solid #F59E0B" : "1px solid #E2E8F0",
                    boxShadow: item.isTop ? "0 4px 20px rgba(245,158,11,0.08)" : "0 4px 15px rgba(0,0,0,0.02)",
                    textDecoration: "none",
                    color: "inherit",
                    position: "relative",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", gap: "14px", padding: "14px" }}>
                    {/* 物业封面图 (统一 4:3 比例 132x99px) */}
                    <div
                      style={{
                        width: "132px",
                        height: "99px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        background: "#E2E8F0",
                        flexShrink: 0,
                        position: "relative",
                      }}
                    >
                      <img
                        loading="lazy"
                        decoding="async"
                        src={coverImg}
                        alt={item.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      {/* 物业类型角标 */}
                      <span
                        style={{
                          position: "absolute",
                          bottom: "5px",
                          left: "5px",
                          background: "rgba(15,23,42,0.8)",
                          color: "#FFFFFF",
                          fontSize: "10px",
                          fontWeight: "700",
                          padding: "1px 5px",
                          borderRadius: "3px",
                          backdropFilter: "blur(4px)",
                        }}
                      >
                        {propertyTypeLabels[item.propertyType] || "厂房"}
                      </span>

                      {/* 金色/橙色置顶精选微标 */}
                      {item.isTop && (
                        <span
                          style={{
                            position: "absolute",
                            top: "5px",
                            left: "5px",
                            background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                            color: "#FFFFFF",
                            fontSize: "9.5px",
                            fontWeight: "800",
                            padding: "1px 5px",
                            borderRadius: "3px",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                          }}
                        >
                          精选置顶
                        </span>
                      )}
                    </div>

                    {/* 右侧核心工业指标 */}
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        {/* 标题与交易类别 */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                          <span
                            style={{
                              background: isWanted ? "#FEF2F2" : "#EFF6FF",
                              color: isWanted ? "#DC2626" : "#2563EB",
                              fontSize: "11px",
                              fontWeight: "800",
                              padding: "1px 6px",
                              borderRadius: "3px",
                              flexShrink: 0,
                            }}
                          >
                            {transactionTypeLabels[item.transactionType] || "出租"}
                          </span>
                          <h3
                            style={{
                              fontSize: "14.5px",
                              fontWeight: "900",
                              color: "#0F172A",
                              margin: 0,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              lineHeight: "1.3",
                            }}
                          >
                            {item.title}
                          </h3>
                        </div>

                        {/* 核心参数单行：面积 · 层高 · 电力 · 大车 */}
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#475569",
                            margin: "4px 0 2px 0",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <strong style={{ color: "#0F172A", fontSize: "13px" }}>
                            {item.buildingArea ? `${item.buildingArea}㎡` : item.landArea ? `${item.landArea}亩` : "面积面议"}
                          </strong>
                          {item.floorHeight && <span style={{ color: "#64748B" }}> · 层高{item.floorHeight}m</span>}
                          {item.powerCapacity && <span style={{ color: "#64748B" }}> · {item.powerCapacity}kVA</span>}
                          {item.truckAccessible && <span style={{ color: "#059669" }}> · 大车直达</span>}
                        </div>

                        {/* 位置与园区 */}
                        <div
                          style={{
                            fontSize: "11.5px",
                            color: "#64748B",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          <MapPin size={12} style={{ color: "#94A3B8", flexShrink: 0 }} />
                          <span>{item.region || "杨林"}</span>
                          {item.parkName && <span>· {item.parkName}</span>}
                        </div>
                      </div>

                      {/* 价格大标与核验标识 */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "4px" }}>
                        <div style={{ fontSize: "16px", fontWeight: "900", color: "#DC2626", letterSpacing: "-0.3px" }}>
                          {item.negotiable
                            ? "面议"
                            : item.rentPrice
                            ? `${item.rentPrice} ${item.priceUnit}`
                            : item.salePrice
                            ? `${item.salePrice} 万元`
                            : "面议"}
                        </div>

                        {/* 规范平台认证 Badge */}
                        <div>
                          {item.verifiedLevel === "PHONE_VERIFIED" && (
                            <span style={{ fontSize: "10.5px", color: "#2563EB", background: "#EFF6FF", border: "1px solid #BFDBFE", fontWeight: "700", padding: "1px 5px", borderRadius: "3px", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                              <PhoneCall size={10} /> 电话已核验
                            </span>
                          )}
                          {item.verifiedLevel === "OWNER_VERIFIED" && (
                            <span style={{ fontSize: "10.5px", color: "#059669", background: "#ECFDF5", border: "1px solid #A7F3D0", fontWeight: "700", padding: "1px 5px", borderRadius: "3px", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                              <BadgeCheck size={10} /> 业主已验照
                            </span>
                          )}
                          {item.verifiedLevel === "ENTERPRISE_VERIFIED" && (
                            <span style={{ fontSize: "10.5px", color: "#7C3AED", background: "#F5F3FF", border: "1px solid #DDD6FE", fontWeight: "700", padding: "1px 5px", borderRadius: "3px", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                              <Building2 size={10} /> 企业已认证
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 底部工业特征胶囊标签栏 (最多 3 个 + 超额标) */}
                  {featureTags.length > 0 && (
                    <div style={{ background: "#F8FAFC", borderTop: "1px solid #F1F5F9", padding: "6px 14px", display: "flex", gap: "6px", alignItems: "center" }}>
                      {visibleTags.map((t, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: "#FFFFFF",
                            color: "#475569",
                            fontSize: "11px",
                            padding: "1px 6px",
                            borderRadius: "3px",
                            border: "1px solid #E2E8F0",
                            fontWeight: "500",
                          }}
                        >
                          {t}
                        </span>
                      ))}
                      {extraCount > 0 && (
                        <span style={{ fontSize: "10px", color: "#94A3B8", fontWeight: "600" }}>
                          +{extraCount}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* =========================================================================
          5. 园区综合企业配套服务入口 (采用专业 Lucide 图标体系)
          ========================================================================= */}
      <section id="park-services" style={{ maxWidth: "1240px", margin: "0 auto 2.5rem auto", padding: "0 1.25rem" }}>
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "14px",
            border: "1px solid #E2E8F0",
            padding: "20px 24px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "900", color: "#0F172A", margin: 0 }}>
                  园区企业综合配套服务通道
                </h3>
                <span style={{ background: "#EFF6FF", color: "#2563EB", fontSize: "11px", fontWeight: "800", padding: "1px 6px", borderRadius: "4px" }}>
                  落地支持
                </span>
              </div>
              <p style={{ fontSize: "12px", color: "#64748B", margin: "3px 0 0 0" }}>
                直联杨林经开区本地认证工程服务商与企业配套，为入驻企业提供全流程落地保障
              </p>
            </div>
            <Link prefetch={false} href="/haodian" style={{ fontSize: "12.5px", color: "#2563EB", fontWeight: "800", textDecoration: "none", display: "flex", alignItems: "center", gap: "2px" }}>
              <span>进入好店企业黄页</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))", gap: "10px", textAlign: "center" }}>
            {[
              { label: "物流仓储货运", icon: <Truck size={20} color="#2563EB" />, href: "/info?cat=move", desc: "货运挂车·装卸搬运" },
              { label: "厂房装修建材", icon: <Hammer size={20} color="#D97706" />, href: "/haodian?q=装修", desc: "地坪漆·隔断钢构" },
              { label: "弱电安防监控", icon: <Cctv size={20} color="#059669" />, href: "/haodian?q=监控", desc: "网络布线·门禁闸机" },
              { label: "工业消防工程", icon: <ShieldCheck size={20} color="#DC2626" />, href: "/haodian?q=消防", desc: "消防喷淋·维保检测" },
              { label: "园区批量招工", icon: <Users size={20} color="#7C3AED" />, href: "/jobs", desc: "普工技工·专场招聘" },
              { label: "办公设备租赁", icon: <Printer size={20} color="#0284C7" />, href: "/info?cat=digital", desc: "打印耗材·桌椅采购" },
              { label: "便民生活专线", icon: <Phone size={20} color="#475569" />, href: "/bianmin", desc: "开锁送水·应急热线" },
            ].map((srv, idx) => (
              <Link
                prefetch={false}
                key={idx}
                href={srv.href}
                style={{
                  background: "#F8FAFC",
                  padding: "12px 8px",
                  borderRadius: "10px",
                  border: "1px solid #E2E8F0",
                  textDecoration: "none",
                  color: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  transition: "background 0.15s ease",
                }}
              >
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #E2E8F0" }}>
                  {srv.icon}
                </div>
                <span style={{ fontSize: "12.5px", fontWeight: "800", color: "#1E293B", marginTop: "2px" }}>{srv.label}</span>
                <span style={{ fontSize: "10px", color: "#64748B" }}>{srv.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. 工业专属高效底部转化 CTA Banner
          ========================================================================= */}
      <section style={{ maxWidth: "1240px", margin: "0 auto 2rem auto", padding: "0 1.25rem" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
            borderRadius: "16px",
            padding: "24px 28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            boxShadow: "0 8px 24px rgba(15,23,42,0.15)",
          }}
        >
          <div>
            <div style={{ fontSize: "18px", fontWeight: "900", color: "#FFFFFF", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>有厂房、仓库、土地要出租出售？</span>
              <span style={{ background: "#F59E0B", color: "#78350F", fontSize: "11px", fontWeight: "800", padding: "1px 6px", borderRadius: "4px" }}>免费直通</span>
            </div>
            <p style={{ fontSize: "13px", color: "#94A3B8", margin: "4px 0 0 0" }}>
              面向杨林经开区入驻企业与制造业投资者精准展示，高效去化闲置工业资产
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link
              prefetch={false}
              href="/industrial/publish?action=RENT"
              style={{
                background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                color: "#FFFFFF",
                padding: "9px 20px",
                borderRadius: "8px",
                fontSize: "13.5px",
                fontWeight: "800",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                boxShadow: "0 4px 12px rgba(245,158,11,0.3)",
              }}
            >
              <PlusCircle size={16} />
              <span>免费发布工业租售</span>
            </Link>
            <Link
              prefetch={false}
              href="/industrial/publish?action=WANTED_RENT"
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "#FFFFFF",
                border: "1px solid rgba(255,255,255,0.2)",
                padding: "9px 18px",
                borderRadius: "8px",
                fontSize: "13.5px",
                fontWeight: "700",
                textDecoration: "none",
                backdropFilter: "blur(4px)",
              }}
            >
              提交企业求租求购
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. 工业地产交易安全风险提示 (精简合规版)
          ========================================================================= */}
      <section style={{ maxWidth: "1240px", margin: "0 auto 3rem auto", padding: "0 1.25rem" }}>
        <div
          style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "10px",
            padding: "12px 16px",
            fontSize: "12px",
            color: "#64748B",
            lineHeight: "1.6",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ShieldCheck size={16} style={{ color: "#F59E0B", flexShrink: 0 }} />
            <span>
              <strong>安全合规提示：</strong>本平台展示的厂房、仓库、土地性质、规划用途及环评条件由发布方提供。实地勘察前请务必核验证照原件，大宗交易建议签署规范书面合同。
            </span>
          </div>
          <Link prefetch={false} href="/info" style={{ color: "#2563EB", fontWeight: "700", textDecoration: "none", fontSize: "11.5px", flexShrink: 0 }}>
            平台免责声明 ›
          </Link>
        </div>
      </section>
    </div>
  );
}
