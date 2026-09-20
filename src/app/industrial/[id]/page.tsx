import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import IndustrialGallery from "@/components/IndustrialGallery";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import DetailActions from "@/components/DetailActions";
import WechatShareHiddenImage from "@/components/WechatShareHiddenImage";
import CrossChannelRecommendations from "@/components/common/CrossChannelRecommendations";
import { canViewResource } from "@/lib/resource-access";
import ReviewStatusBanner, { VisitorPendingCard } from "@/components/common/ReviewStatusBanner";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const item = await prisma.industrialProperty.findUnique({ where: { id } });
  if (!item) return {};

  const typeName =
    item.propertyType === "FACTORY"
      ? "厂房"
      : item.propertyType === "WAREHOUSE"
      ? "仓库"
      : item.propertyType === "LAND"
      ? "工业土地"
      : item.propertyType === "OFFICE"
      ? "办公楼"
      : "园区物业";

  const areaStr = item.buildingArea ? `${item.buildingArea}㎡` : item.landArea ? `${item.landArea}亩` : "";
  const title = `${item.title} - ${item.region}${typeName}租售 - 杨林生活网`;
  const description = `${item.region}${item.title}，面积：${areaStr}，租售价格：${item.negotiable ? "面议" : `${item.rentPrice || item.salePrice || "面议"} ${item.priceUnit}`}，位于${item.address}。杨林生活网园区招商频道真实直供。`;

  return {
    title,
    description,
    keywords: [item.title, item.region, typeName, "杨林厂房", "杨林园区招商", "杨林生活网"].filter(Boolean),
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://iyanglin.com/industrial/${item.id}`,
      siteName: "杨林生活网",
      images: [
        {
          url: (item.images && item.images[0]) || "https://iyanglin.com/share/v2/industrial.png?v=20260912",
          width: 600,
          height: 600,
        },
      ],
    },
    alternates: {
      canonical: `https://iyanglin.com/industrial/${item.id}`,
    },
  };
}

export default async function IndustrialDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getSession();

  const item = await prisma.industrialProperty.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          nickname: true,
          avatar: true,
        },
      },
    },
  });

  if (!item) {
    return notFound();
  }

  const access = canViewResource({
    status: item.status,
    authorId: item.userId,
    currentUser: session,
  });

  if (!access.canView) {
    return (
      <VisitorPendingCard
        moduleName="园区招商信息"
        channelUrl="/industrial"
        channelName="园区招商频道"
        status={access.normalizedStatus}
      />
    );
  }

  // 浏览量轻量防刷递增
  await prisma.industrialProperty.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {});

  // 获取同区域相关推荐 (最多 3 条)
  const relatedProperties = await prisma.industrialProperty.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: id },
      region: item.region,
    },
    take: 3,
    orderBy: { createdAt: "desc" },
  });

  // 获取园区附近招聘岗位推荐 (最多 3 条)
  const nearbyJobs = await prisma.job.findMany({
    where: {
      status: "APPROVED",
      area: { contains: "杨林" },
    },
    take: 3,
    orderBy: { createdAt: "desc" },
  });

  const propertyTypeLabels: Record<string, string> = {
    FACTORY: "标准厂房",
    WAREHOUSE: "仓储物流",
    LAND: "工业土地/地皮",
    OFFICE: "办公楼/写字楼",
    INDUSTRIAL_PARK: "产业园物业",
    COMMERCIAL_SUPPORT: "园区商业配套",
    OTHER: "其他物业",
  };

  const transactionTypeLabels: Record<string, string> = {
    RENT: "出租",
    SALE: "出售",
    TRANSFER: "转让",
    COOPERATION: "招商合作",
    JOINT_OPERATION: "联营合作",
    WANTED_RENT: "求租",
    WANTED_BUY: "求购",
  };

  const isWanted = item.transactionType === "WANTED_RENT" || item.transactionType === "WANTED_BUY";

  // 电话脱敏
  const isLoggedIn = !!session;
  const rawPhone = item.contactPhone || "";
  const maskedPhone =
    rawPhone.length >= 7
      ? `${rawPhone.slice(0, 3)}****${rawPhone.slice(-4)}`
      : rawPhone;

  const areaStr = item.buildingArea ? `${item.buildingArea}㎡` : item.landArea ? `${item.landArea}亩` : "";
  const rawIndustrialImg = item.images && item.images[0];
  const industrialShareImg = rawIndustrialImg
    ? (rawIndustrialImg.startsWith("http") ? rawIndustrialImg : `https://iyanglin.com${rawIndustrialImg.startsWith("/") ? "" : "/"}${rawIndustrialImg}`)
    : "https://iyanglin.com/share/v2/industrial.png?v=20260912";
  const industrialShareTitle = `【园区招商】${item.title} - ${item.region}${propertyTypeLabels[item.propertyType] || "厂房"}直租`;
  const industrialShareDesc = `${item.region}${item.title}，面积：${areaStr || "详见介绍"}，租售价格：${item.negotiable ? "面议" : `${item.rentPrice || item.salePrice || "面议"} ${item.priceUnit}`}。杨林经开区真实园区直通。`;

  return (
    <div style={{ minHeight: "100vh", background: "#F4F6F9", color: "#181818", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif" }}>
      {/* 微信与社交分享爬虫首图兜底 */}
      <WechatShareHiddenImage imageUrl={industrialShareImg} alt={industrialShareTitle} />
      <Navbar />

      {/* 待审核或非公开提示条 */}
      {access.normalizedStatus !== "APPROVED" && (
        <ReviewStatusBanner
          status={access.normalizedStatus}
          moduleName="园区招商信息"
          channelUrl="/industrial"
          channelName="园区招商"
          isOwner={access.isOwner}
          isAdmin={access.isAdmin}
          createdAt={item.createdAt}
          adminReviewUrl="/admin/industrial"
        />
      )}

      {/* 面包屑导航 */}
      <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "14px 1.25rem", fontSize: "13px", color: "#64748B" }}>
        <Link prefetch={false} href="/" style={{ color: "#64748B", textDecoration: "none" }}>首页</Link>
        <span style={{ margin: "0 6px" }}>/</span>
        <Link prefetch={false} href="/industrial" style={{ color: "#64748B", textDecoration: "none" }}>园区招商</Link>
        <span style={{ margin: "0 6px" }}>/</span>
        <span style={{ color: "#2563EB", fontWeight: "700" }}>{item.title}</span>
      </div>

      <main style={{ maxWidth: "1240px", margin: "0 auto 4rem auto", padding: "0 1.25rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", alignItems: "start" }}>
          
          {/* =========================================================================
              左侧 2/3：物业画廊大图 + 核心参数矩阵 + 详细介绍
              ========================================================================= */}
          <div style={{ flex: 2, display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* 1. 主视觉卡片 (大图与画廊) */}
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid #E2E8F0",
                boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              }}
            >
              {/* 交互式物业画廊（点击放大轮播/缩略图切换） */}
              <IndustrialGallery
                title={item.title}
                images={item.images || []}
                badgeTag={transactionTypeLabels[item.transactionType] || "出租"}
                badgeType={propertyTypeLabels[item.propertyType] || "厂房"}
              />

              {/* 标题与主要指标大栏 */}
              <div style={{ padding: "20px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "12px", marginBottom: "10px" }}>
                  <h1 style={{ fontSize: "22px", fontWeight: "900", color: "#0F172A", margin: 0, lineHeight: "1.3" }}>
                    {item.title}
                  </h1>
                  <div style={{ fontSize: "26px", fontWeight: "900", color: "#DC2626" }}>
                    {item.negotiable
                      ? "面议"
                      : item.rentPrice
                      ? `${item.rentPrice} ${item.priceUnit}`
                      : item.salePrice
                      ? `${item.salePrice} 万元`
                      : "面议"}
                  </div>
                </div>

                <div style={{ fontSize: "13px", color: "#64748B", display: "flex", gap: "16px", flexWrap: "wrap", borderBottom: "1px solid #F1F5F9", paddingBottom: "12px" }}>
                  <span>📍 所属园区：{item.region} {item.parkName ? `· ${item.parkName}` : ""}</span>
                  <span>📅 发布时间：{new Date(item.createdAt).toLocaleDateString()}</span>
                  <span>👁️ 浏览量：{item.viewCount}次</span>
                </div>
              </div>
            </div>

            {/* 2. 核心工业工程参数矩阵 (工业地产核心精髓，PC 4列，手机 2列) */}
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: "16px",
                border: "1px solid #E2E8F0",
                padding: "22px 24px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              }}
            >
              <h2 style={{ fontSize: "17px", fontWeight: "900", color: "#0F172A", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>⚙️</span> 核心技术与工程参数
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "12px",
                }}
              >
                <div style={{ background: "#F8FAFC", padding: "12px", borderRadius: "8px", border: "1px solid #F1F5F9" }}>
                  <div style={{ fontSize: "11.5px", color: "#64748B" }}>建筑 / 使用面积</div>
                  <div style={{ fontSize: "16px", fontWeight: "900", color: "#0F172A", marginTop: "2px" }}>
                    {item.buildingArea ? `${item.buildingArea} ㎡` : item.factoryArea ? `${item.factoryArea} ㎡` : "面议"}
                  </div>
                </div>

                <div style={{ background: "#F8FAFC", padding: "12px", borderRadius: "8px", border: "1px solid #F1F5F9" }}>
                  <div style={{ fontSize: "11.5px", color: "#64748B" }}>车间层高</div>
                  <div style={{ fontSize: "16px", fontWeight: "900", color: "#0F172A", marginTop: "2px" }}>
                    {item.floorHeight ? `${item.floorHeight} 米` : "标准高"}
                  </div>
                </div>

                <div style={{ background: "#F8FAFC", padding: "12px", borderRadius: "8px", border: "1px solid #F1F5F9" }}>
                  <div style={{ fontSize: "11.5px", color: "#64748B" }}>变压供电容量</div>
                  <div style={{ fontSize: "16px", fontWeight: "900", color: "#0F172A", marginTop: "2px" }}>
                    {item.powerCapacity ? `${item.powerCapacity} kVA` : "按需报装"}
                  </div>
                </div>

                <div style={{ background: "#F8FAFC", padding: "12px", borderRadius: "8px", border: "1px solid #F1F5F9" }}>
                  <div style={{ fontSize: "11.5px", color: "#64748B" }}>地面设计承重</div>
                  <div style={{ fontSize: "16px", fontWeight: "900", color: "#0F172A", marginTop: "2px" }}>
                    {item.loadBearing ? `${item.loadBearing} 吨/㎡` : "标准承重"}
                  </div>
                </div>

                <div style={{ background: "#F8FAFC", padding: "12px", borderRadius: "8px", border: "1px solid #F1F5F9" }}>
                  <div style={{ fontSize: "11.5px", color: "#64748B" }}>行车配备</div>
                  <div style={{ fontSize: "16px", fontWeight: "900", color: "#0F172A", marginTop: "2px" }}>
                    {item.hasCrane ? (item.craneTonnage ? `${item.craneTonnage} 吨` : "有行车") : "未配备"}
                  </div>
                </div>

                <div style={{ background: "#F8FAFC", padding: "12px", borderRadius: "8px", border: "1px solid #F1F5F9" }}>
                  <div style={{ fontSize: "11.5px", color: "#64748B" }}>消防配置等级</div>
                  <div style={{ fontSize: "16px", fontWeight: "900", color: "#0F172A", marginTop: "2px" }}>
                    {item.hasFireSystem ? (item.fireStatus ? `${item.fireStatus}消防` : "带消防") : "基础消防"}
                  </div>
                </div>

                <div style={{ background: "#F8FAFC", padding: "12px", borderRadius: "8px", border: "1px solid #F1F5F9" }}>
                  <div style={{ fontSize: "11.5px", color: "#64748B" }}>物流大车进出</div>
                  <div style={{ fontSize: "16px", fontWeight: "900", color: "#0F172A", marginTop: "2px" }}>
                    {item.truckAccessible ? item.maxTruckLength || "17.5m大车" : "限中小货车"}
                  </div>
                </div>

                <div style={{ background: "#F8FAFC", padding: "12px", borderRadius: "8px", border: "1px solid #F1F5F9" }}>
                  <div style={{ fontSize: "11.5px", color: "#64748B" }}>起租与交付</div>
                  <div style={{ fontSize: "16px", fontWeight: "900", color: "#0F172A", marginTop: "2px" }}>
                    {item.availableDate || "随时可进驻"}
                  </div>
                </div>
              </div>

              {/* 土地特有指标声明 (若属于土地) */}
              {item.propertyType === "LAND" && (
                <div style={{ marginTop: "16px", padding: "12px 14px", background: "#FEF3C7", borderRadius: "8px", border: "1px solid #FDE68A", fontSize: "12.5px", color: "#92400E" }}>
                  <strong>土地性质与规划说明：</strong>
                  <div>• 土地性质：{item.landUseType || "工业用地"} · 产权情况：{item.propertyRightStatus || "出让用地"} · 面积：{item.landArea ? `${item.landArea} 亩` : "面议"}</div>
                  <div style={{ marginTop: "4px", fontSize: "11.5px", color: "#B45309" }}>
                    ⚠️ 以上土地及产权信息由发布者提供，交易前请自行核实规划图与土地红线。
                  </div>
                </div>
              )}
            </div>

            {/* 3. 详细图文描述与招商说明 */}
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: "16px",
                border: "1px solid #E2E8F0",
                padding: "22px 24px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              }}
            >
              <h2 style={{ fontSize: "17px", fontWeight: "900", color: "#0F172A", margin: "0 0 14px 0" }}>
                📋 物业详情与招商合作说明
              </h2>
              <div style={{ fontSize: "14.5px", lineHeight: "1.8", color: "#334155", whiteSpace: "pre-wrap" }}>
                {item.description}
              </div>

              {/* 适合行业参考 */}
              {item.suitableIndustries && item.suitableIndustries.length > 0 && (
                <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #F1F5F9" }}>
                  <div style={{ fontSize: "13.5px", fontWeight: "800", color: "#1E293B", marginBottom: "8px" }}>适合行业参考：</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {item.suitableIndustries.map((ind, i) => (
                      <span key={i} style={{ background: "#EFF6FF", color: "#1D4ED8", padding: "3px 10px", borderRadius: "100px", fontSize: "12px", fontWeight: "700" }}>
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 4. 交易安全风险声明 */}
            <div
              style={{
                background: "#FFFBEB",
                border: "1px solid #FEF3C7",
                borderRadius: "12px",
                padding: "16px 20px",
                fontSize: "12.5px",
                color: "#92400E",
                lineHeight: "1.8",
              }}
            >
              <strong>🛡️ 工业地产交易安全合规告知：</strong>
              <div>• 厂房承重、供电容量、排污、环评及土地性质等重要生产要素，签约前请务必实地勘察并查验发改、规自、生态环境等部门相关批复或不动产权证照；</div>
              <div>• 涉及大额转让金、定金或设备交割，请签署正规书面协议，切勿在未确认权属前向个人账户转账。</div>
            </div>

          </div>

          {/* =========================================================================
              右侧 1/3：联系人卡片 + 收藏/分享 + 园区周边招聘联动
              ========================================================================= */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* 联系人名片 */}
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: "16px",
                border: "1px solid #E2E8F0",
                padding: "22px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>
                  👤
                </div>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: "900", color: "#0F172A" }}>{item.contactName}</div>
                  <div style={{ fontSize: "12px", color: "#2563EB", fontWeight: "700", marginTop: "2px" }}>
                    {item.verifiedLevel === "PHONE_VERIFIED"
                      ? "✓ 电话已核验"
                      : item.verifiedLevel === "OWNER_VERIFIED"
                      ? "✓ 业主直租直售"
                      : item.verifiedLevel === "ENTERPRISE_VERIFIED"
                      ? "✓ 企业直发"
                      : "招商联系人"}
                  </div>
                </div>
              </div>

              {/* 联系电话显示 */}
              <div style={{ background: "#F8FAFC", borderRadius: "10px", padding: "14px", textAlign: "center", marginBottom: "14px", border: "1px solid #F1F5F9" }}>
                <div style={{ fontSize: "12px", color: "#64748B", marginBottom: "4px" }}>招商咨询直通专线</div>
                <div style={{ fontSize: "20px", fontWeight: "900", color: "#0F172A", letterSpacing: "1px" }}>
                  {isLoggedIn ? rawPhone : maskedPhone}
                </div>
                {!isLoggedIn && (
                  <div style={{ fontSize: "11px", color: "#B45309", marginTop: "4px" }}>
                    🔒 登录杨林生活网后即可查看完整电话
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <a
                  href={`tel:${rawPhone}`}
                  style={{
                    background: "#2563EB",
                    color: "#FFFFFF",
                    textAlign: "center",
                    padding: "12px 0",
                    borderRadius: "8px",
                    fontWeight: "800",
                    fontSize: "14.5px",
                    textDecoration: "none",
                    boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
                  }}
                >
                  📞 拨打电话咨询
                </a>

                {/* 收藏与分享组件 */}
                <DetailActions
                  resourceType="INDUSTRIAL"
                  resourceId={item.id}
                  title={industrialShareTitle}
                  desc={industrialShareDesc}
                  link={`https://iyanglin.com/industrial/${item.id}`}
                  imageUrl={industrialShareImg}
                />
              </div>
            </div>

            {/* 园区附近招聘联动推荐 (如果有) */}
            {nearbyJobs.length > 0 && (
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: "16px",
                  border: "1px solid #E2E8F0",
                  padding: "20px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontSize: "15px", fontWeight: "900", color: "#0F172A" }}>💼 经开区热门企业招工</span>
                  <Link prefetch={false} href="/jobs" style={{ fontSize: "12px", color: "#2563EB", fontWeight: "700", textDecoration: "none" }}>更多 ›</Link>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {nearbyJobs.map((j) => (
                    <Link
                      prefetch={false}
                      key={j.id}
                      href={`/jobs/${j.id}`}
                      style={{
                        padding: "8px 10px",
                        background: "#F8FAFC",
                        borderRadius: "8px",
                        textDecoration: "none",
                        color: "inherit",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "800", color: "#0F172A" }}>{j.title}</div>
                        <div style={{ fontSize: "11px", color: "#64748B" }}>{j.company}</div>
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: "800", color: "#DC2626" }}>{j.salary}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 同园区其他物业推荐 */}
            {relatedProperties.length > 0 && (
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: "16px",
                  border: "1px solid #E2E8F0",
                  padding: "20px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ fontSize: "15px", fontWeight: "900", color: "#0F172A", marginBottom: "12px" }}>
                  🏢 同区域其他园区物业
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {relatedProperties.map((p) => (
                    <Link
                      prefetch={false}
                      key={p.id}
                      href={`/industrial/${p.id}`}
                      style={{
                        display: "flex",
                        gap: "10px",
                        textDecoration: "none",
                        color: "inherit",
                        background: "#F8FAFC",
                        padding: "8px",
                        borderRadius: "8px",
                      }}
                    >
                      <img
                        src={p.images && p.images[0] ? p.images[0] : "/images/legacy/notfindimg_house.png"}
                        alt={p.title}
                        style={{ width: "60px", height: "45px", objectFit: "cover", borderRadius: "4px" }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: "12.5px", fontWeight: "800", color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.title}
                        </div>
                        <div style={{ fontSize: "12px", color: "#DC2626", fontWeight: "800" }}>
                          {p.negotiable ? "面议" : `${p.rentPrice || p.salePrice || "面议"} ${p.priceUnit}`}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
        {/* P5 跨频道智能联动推荐：周边招工岗位与厂区配套生活服务 */}
        <CrossChannelRecommendations
          targetType="INDUSTRIAL"
          targetId={item.id}
          area={item.region || "杨林经开区"}
        />
      </main>
    </div>
  );
}
