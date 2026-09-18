import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { getDatingProfile, listDatingProfiles } from "@/lib/love-store";
import DetailActions from "@/components/DetailActions";
import WechatShareHiddenImage from "@/components/WechatShareHiddenImage";
import DatingPhotoGallery from "@/components/DatingPhotoGallery";
import DatingContactCard from "@/components/DatingContactCard";
import { getSession } from "@/lib/auth";
import { parseDatingContact } from "@/lib/dating-contact-utils";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata, ResolvingMetadata } from "next";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

const currentYear = new Date().getFullYear();

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const profile = await getDatingProfile(id);

  if (!profile || profile.status !== "approved") {
    return { title: "相亲嘉宾未找到 | 杨林生活网" };
  }

  const age = currentYear - profile.birthYear;
  const genderText = profile.gender === "female" ? "女嘉宾" : "男嘉宾";
  const title = `${profile.nickname} (${genderText} · ${age}岁 · ${profile.education}) - 嵩明杨林同城单身相亲交友 | 杨林生活网`;
  const description = `杨林同城相亲单身嘉宾 ${profile.nickname}，${age}岁，身高${profile.heightCm}cm，学历${profile.education}，职业：${profile.occupation}。择偶要求：${profile.requirement.slice(0, 60)}...`;

  return {
    title,
    description,
    keywords: `${profile.nickname}, 杨林相亲, 杨林单身, 杨林交友, 嵩明婚恋, 大学城相亲`,
    openGraph: {
      title,
      description,
      type: "profile",
      url: `https://iyanglin.com/love/${profile.id}`,
      siteName: "杨林生活网",
      images: [
        {
          url: (profile.photos && profile.photos[0]) || "https://iyanglin.com/share/v2/default.png?v=20260912",
          width: 600,
          height: 600,
        },
      ],
    },
    alternates: {
      canonical: `https://iyanglin.com/love/${profile.id}`,
    },
  };
}

export default async function DatingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getDatingProfile(id);

  if (!profile || profile.status !== "approved") {
    notFound();
  }

  const session = await getSession();
  const isLoggedIn = !!session?.id;
  const isAdmin = session?.role === "ADMIN";
  const isOwner = !!(session?.id && profile.authorId === session.id);

  let hasPaidUnlock = false;
  if (session?.id && !isAdmin && !isOwner) {
    const activeVip = await prisma.userMembership.findFirst({
      where: {
        userId: session.id,
        status: "ACTIVE",
      },
    }).catch(() => null);

    if (activeVip) {
      hasPaidUnlock = true;
    } else {
      const paidOrder = await prisma.billingOrder.findFirst({
        where: {
          targetId: profile.id,
          targetKind: "dating_photo",
          status: "PAID",
          targetTitle: { contains: session.id },
        },
      }).catch(() => null);
      if (paidOrder) {
        hasPaidUnlock = true;
      }
    }
  }

  const isUnlocked = isOwner || hasPaidUnlock;
  const contactInfo = parseDatingContact(profile.contact);
  const realContact = isUnlocked ? profile.contact : null;

  const isFemale = profile.gender === "female";
  const age = currentYear - (profile.birthYear || 1995);

  // 推荐同城其他优质嘉宾
  const allProfiles = await listDatingProfiles({ status: "APPROVED" });
  const relatedProfiles = allProfiles
    .filter((p) => p.id !== profile.id && (p.gender !== profile.gender || allProfiles.length < 5))
    .slice(0, 4);

  const rawLoveImg = profile.photos && profile.photos[0];
  const loveShareImg = rawLoveImg
    ? (rawLoveImg.startsWith("http") ? rawLoveImg : `https://iyanglin.com${rawLoveImg.startsWith("/") ? "" : "/"}${rawLoveImg}`)
    : "https://iyanglin.com/share/v2/default.png?v=20260912";
  const genderText = profile.gender === "female" ? "女嘉宾" : "男嘉宾";
  const loveShareTitle = `【同城相亲】${profile.nickname} (${genderText} · ${age}岁) - 嵩明杨林单身交友`;
  const loveShareDesc = `杨林单身嘉宾 ${profile.nickname}，${age}岁，学历：${profile.education || "本科"}，职业：${profile.occupation || "职员"}。点击查看征婚资料与牵线联系。`;

  return (
    <div className="support-page love-detail-page" style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {/* 微信与社交分享爬虫首图兜底 */}
      <WechatShareHiddenImage imageUrl={loveShareImg} alt={loveShareTitle} />
      <Navbar />

      {/* 顶部面包屑与轻奢导航栏 */}
      <div style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "12px 1rem" }}>
        <div style={{ maxWidth: "1140px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <a
            href="/love"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: isFemale ? "#e11d48" : "#0284c7",
              fontWeight: "800",
              fontSize: "14px",
              textDecoration: "none",
            }}
          >
            <span>←</span> 返回相亲大厅
          </a>

          <div style={{ fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>杨林生活网</span> / <span>同城婚恋</span> / <span style={{ color: "#0f172a", fontWeight: "700" }}>{isFemale ? "🌸 女嘉宾" : "👔 男嘉宾"}专栏</span>
          </div>
        </div>
      </div>

      {/* 主体双栏布局容器 */}
      <main style={{ maxWidth: "1140px", margin: "1.5rem auto 4rem auto", padding: "0 1rem" }}>
        <div className="love-detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "1.75rem", alignItems: "start" }}>
          
          {/* 左侧主要内容区 */}
          <div style={{ minWidth: 0 }}>

            {/* 嘉宾 Header 卡片 */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "20px",
                border: "1px solid #e2e8f0",
                padding: "1.75rem",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                marginBottom: "1.5rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  {/* 标牌栏 */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        background: isFemale ? "linear-gradient(135deg, #ec4899, #f43f5e)" : "linear-gradient(135deg, #0284c7, #2563eb)",
                        color: "white",
                        padding: "3px 12px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "800",
                        boxShadow: isFemale ? "0 2px 8px rgba(244, 63, 94, 0.3)" : "0 2px 8px rgba(2, 132, 199, 0.3)",
                      }}
                    >
                      {isFemale ? "🌸 女嘉宾" : "👔 男嘉宾"} · {age}岁
                    </span>

                    <span
                      style={{
                        background: "#dcfce7",
                        color: "#15803d",
                        padding: "3px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "700",
                        border: "1px solid #bbf7d0",
                      }}
                    >
                      🛡️ 平台实名认证
                    </span>

                    <span
                      style={{
                        background: "#f1f5f9",
                        color: "#64748b",
                        padding: "3px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                      }}
                    >
                      📍 嵩明·杨林本地
                    </span>
                  </div>

                  {/* 嘉宾昵称 */}
                  <h1
                    style={{
                      fontSize: "clamp(24px, 4vw, 32px)",
                      fontWeight: "900",
                      color: "#0f172a",
                      margin: "0 0 6px 0",
                      letterSpacing: "-0.5px",
                    }}
                  >
                    {profile.nickname}
                  </h1>

                  <div style={{ fontSize: "13px", color: "#94a3b8" }}>
                    登记发布时间：{new Date(profile.createdAt).toLocaleDateString("zh-CN")} · 浏览人气：{profile.viewsCount || 128} 次
                  </div>
                </div>

                {/* 右上角快速牵线小徽章 */}
                <div
                  style={{
                    background: isFemale ? "#fff1f2" : "#f0fdf4",
                    border: isFemale ? "1px solid #fecdd3" : "1px solid #bbf7d0",
                    padding: "8px 16px",
                    borderRadius: "14px",
                    textAlign: "center",
                  }}
                >
                  <span style={{ fontSize: "18px" }}>💌</span>
                  <div style={{ fontSize: "12px", fontWeight: "800", color: isFemale ? "#e11d48" : "#16a34a" }}>
                    诚意交友中
                  </div>
                </div>
              </div>
            </div>

            {/* 嘉宾风采照片画廊（支持未上传高端空态、未付费毛玻璃遮罩、未登录拦截、微信支付/VIP一键解锁） */}
            <DatingPhotoGallery
              photos={profile.photos || []}
              profileId={profile.id}
              nickname={profile.nickname}
              gender={profile.gender}
              isLoggedIn={isLoggedIn}
              isOwner={isOwner}
            />

            {/* 6 大核心硬性指标规格矩阵网格 */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "20px",
                border: "1px solid #e2e8f0",
                padding: "1.5rem",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                marginBottom: "1.5rem",
              }}
            >
              <div style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>📋</span> 基础档案与硬性条件
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: "12px",
                }}
              >
                {/* 1. 身高 */}
                <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "14px", border: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>📏 身高情况</div>
                  <div style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>{profile.heightCm || 165} cm</div>
                </div>

                {/* 2. 学历 */}
                <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "14px", border: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>🎓 最高学历</div>
                  <div style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>{formatEducation(profile.education)}</div>
                </div>

                {/* 3. 职业 */}
                <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "14px", border: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>💼 从事职业</div>
                  <div style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>{formatOccupation(profile.occupation)}</div>
                </div>

                {/* 4. 月薪 */}
                <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "14px", border: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>💰 薪资收入</div>
                  <div style={{ fontSize: "15px", fontWeight: "800", color: "#e11d48" }}>{formatIncome(profile.income)}</div>
                </div>

                {/* 5. 婚况 */}
                <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "14px", border: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>💍 婚姻状态</div>
                  <div style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>{formatMaritalStatus(profile.maritalStatus)}</div>
                </div>

                {/* 6. 常住地 */}
                <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "14px", border: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>📍 常住地区</div>
                  <div style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>{profile.location || "嵩明·杨林"}</div>
                </div>
              </div>

              {/* 兴趣与生活方式标签 Chips */}
              <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px dashed #f1f5f9" }}>
                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px", fontWeight: "700" }}>
                  🏷️ 嘉宾生活方式与特质标牌：
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {["🚭 不吸烟", "🍷 社交小酌", "🍳 厨艺爱好者", "🏃 爱好运动", "🎬 电影旅游", "🏠 顾家踏实", "🚗 规划购车房"].map((tag, i) => (
                    <span
                      key={i}
                      style={{
                        background: "#f1f5f9",
                        color: "#475569",
                        fontSize: "12px",
                        fontWeight: "600",
                        padding: "3px 10px",
                        borderRadius: "12px",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 自我介绍详细卡片 */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "20px",
                border: "1px solid #e2e8f0",
                padding: "1.75rem",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                marginBottom: "1.5rem",
              }}
            >
              <div style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px" }}>💬</span> 嘉宾独白 · 关于我的性格与生活
              </div>

              <div
                style={{
                  fontSize: "15.5px",
                  lineHeight: "1.85",
                  color: "#334155",
                  whiteSpace: "pre-wrap",
                  background: isFemale ? "#fffafb" : "#f8fafc",
                  padding: "1.25rem",
                  borderRadius: "14px",
                  border: isFemale ? "1px solid #ffe4e6" : "1px solid #e2e8f0",
                  position: "relative",
                }}
              >
                <span style={{ fontSize: "24px", color: isFemale ? "#f43f5e" : "#0284c7", position: "absolute", top: "8px", left: "10px", opacity: 0.25 }}>“</span>
                <p style={{ margin: "0 0 0 16px" }}>{formatIntro(profile.intro)}</p>
              </div>
            </div>

            {/* 择偶要求详细卡片 */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "20px",
                border: "1px solid #e2e8f0",
                padding: "1.75rem",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                marginBottom: "2rem",
              }}
            >
              <div style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px" }}>❤️</span> 择偶标准 · 期待中的另一半
              </div>

              <div
                style={{
                  fontSize: "15.5px",
                  lineHeight: "1.85",
                  color: "#334155",
                  whiteSpace: "pre-wrap",
                  background: "#fff1f2",
                  padding: "1.25rem",
                  borderRadius: "14px",
                  border: "1px solid #fecdd3",
                }}
              >
                {formatRequirement(profile.requirement)}
              </div>
            </div>

            {/* 互动操作栏 (收藏、分享、举报) */}
            <DetailActions
              resourceType="DATING"
              resourceId={profile.id}
              title={loveShareTitle}
              desc={loveShareDesc}
              link={`https://iyanglin.com/love/${profile.id}`}
              imageUrl={loveShareImg}
            />
          </div>

          {/* 右侧悬浮侧边栏：官方红娘牵线保障卡 */}
          <div className="love-detail-sidebar">
            <div
              className="love-sidebar-sticky"
              style={{
                position: "sticky",
                top: "84px",
                background: "#ffffff",
                borderRadius: "20px",
                border: "1px solid #e2e8f0",
                padding: "1.75rem",
                boxShadow: "0 8px 30px rgba(0,0,0,0.05)",
                textAlign: "center",
              }}
            >
              {/* 红娘服务头部 */}
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #ec4899 0%, #e11d48 100%)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "26px",
                  margin: "0 auto 12px auto",
                  boxShadow: "0 8px 20px rgba(225, 29, 72, 0.25)",
                }}
              >
                💌
              </div>

              <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px 0" }}>
                申请牵线联系方式
              </h3>

              <p style={{ fontSize: "12.5px", color: "#64748b", lineHeight: "1.6", margin: "0 0 1.25rem 0" }}>
                为保护嘉宾个人隐私与防骚扰，手机与微信直通信息通过系统安全鉴权调取。
              </p>

              {/* 专属安全鉴权联系方式与红娘牵线卡片 */}
              <div style={{ textAlign: "left", marginBottom: "1rem" }}>
                <DatingContactCard
                  profileId={profile.id}
                  nickname={profile.nickname}
                  gender={profile.gender}
                  contactInfo={contactInfo}
                  isLoggedIn={isLoggedIn}
                  initialUnlocked={isUnlocked}
                  initialRealContact={realContact}
                />
              </div>

              {/* 专属红娘服务权益 */}
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: "12px",
                  padding: "12px",
                  textAlign: "left",
                  fontSize: "12px",
                  color: "#475569",
                  marginBottom: "1rem",
                  border: "1px solid #f1f5f9",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div style={{ fontWeight: "700", color: "#0f172a", marginBottom: "2px" }}>🏆 平台婚恋保障权益：</div>
                <div>✓ 真实身份审核 · 杜绝虚假信息</div>
                <div>✓ 专属官方红娘 · 协助双方牵线破冰</div>
                <div>✓ 隐私电话加密 · 双方同意后互换微信</div>
              </div>

              {/* 官方婚恋安全防骗警示 */}
              <div
                style={{
                  padding: "10px 12px",
                  background: "#fff1f2",
                  color: "#be123c",
                  fontSize: "11.5px",
                  borderRadius: "10px",
                  textAlign: "left",
                  lineHeight: "1.5",
                  border: "1px solid #fecdd3",
                }}
              >
                <strong>⚠️ 婚恋安全防骗提示：</strong> 在交友相亲过程中，切勿与对方发生任何借贷、刷单、投资理财或资金往来！
              </div>
            </div>
          </div>
        </div>

        {/* 底部：猜你喜欢 · 更多优质同城嘉宾推荐 */}
        {relatedProfiles.length > 0 && (
          <section style={{ marginTop: "3.5rem", paddingTop: "2rem", borderTop: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "18px", fontWeight: "900", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>🔥</span> 猜你心仪 · 更多杨林优质单身嘉宾推荐
              </div>
              <Link href="/love" style={{ fontSize: "13px", fontWeight: "700", color: "#e11d48", textDecoration: "none" }}>
                进入相亲大厅查看全部 →
              </Link>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1rem" }}>
              {relatedProfiles.map((p) => {
                const itemAge = currentYear - (p.birthYear || 1995);
                const itemFemale = p.gender === "female";
                const hasPhoto = p.photos && p.photos.length > 0;
                const photoUrl = hasPhoto ? p.photos[0] : null;

                return (
                  <Link
                    key={p.id}
                    href={`/love/${p.id}`}
                    style={{
                      background: "#ffffff",
                      borderRadius: "16px",
                      border: "1px solid #e2e8f0",
                      padding: "1rem",
                      textDecoration: "none",
                      color: "inherit",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "transform 0.15s, box-shadow 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", gap: "12px", marginBottom: "10px" }}>
                      {photoUrl ? (
                        <div style={{ width: "60px", height: "60px", borderRadius: "12px", overflow: "hidden", background: "#fbcfe8", position: "relative", flexShrink: 0 }}>
                          <img src={photoUrl} alt={p.nickname} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(2px)" }} />
                          <span style={{ position: "absolute", bottom: "2px", right: "2px", background: "rgba(0,0,0,0.6)", color: "white", fontSize: "9px", borderRadius: "4px", padding: "1px 3px" }}>🔒</span>
                        </div>
                      ) : (
                        <div style={{ width: "60px", height: "60px", borderRadius: "12px", background: itemFemale ? "linear-gradient(135deg, #f472b6, #ec4899)" : "linear-gradient(135deg, #60a5fa, #3b82f6)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", flexShrink: 0 }}>
                          {itemFemale ? "👩‍🦰" : "👨‍💼"}
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nickname}</div>
                        <span style={{ background: itemFemale ? "#fdf2f8" : "#eff6ff", color: itemFemale ? "#be123c" : "#1d4ed8", padding: "2px 8px", borderRadius: "8px", fontSize: "11px", fontWeight: "bold", border: itemFemale ? "1px solid #fecdd3" : "1px solid #bfdbfe" }}>
                          {itemFemale ? "女嘉宾" : "男嘉宾"} · {itemAge}岁
                        </span>
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          💼 {formatOccupation(p.occupation)}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: "12px", color: "#64748b", background: "#f8fafc", padding: "6px 10px", borderRadius: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      💬 {formatIntro(p.intro)}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function formatOccupation(occ?: string | null) {
  if (!occ) return "企事业单位/文职";
  const cleaned = occ.replace(/["'\\]/g, "").trim();
  if (cleaned === "0" || cleaned === "职业代码 0" || cleaned === "职业代码0") return "企事业单位/文职";
  if (cleaned === "1" || cleaned === "职业代码 1" || cleaned === "职业代码1") return "教育培训/高校教师";
  if (cleaned === "2" || cleaned === "职业代码 2" || cleaned === "职业代码2") return "医疗卫生/医护工作";
  if (cleaned === "3" || cleaned === "职业代码 3" || cleaned === "职业代码3") return "企业白领/金融财务";
  if (cleaned === "4" || cleaned === "职业代码 4" || cleaned === "职业代码4") return "IT互联网/技术研发";
  if (cleaned === "5" || cleaned === "职业代码 5" || cleaned === "职业代码5") return "经商/自主创业";
  return cleaned;
}

function formatMaritalStatus(status?: string | null) {
  if (!status) return "未婚单身";
  const cleaned = status.replace(/["'\\]/g, "").trim();
  if (cleaned === "0" || cleaned === "情感状态 0" || cleaned === "情感状态0") return "未婚单身";
  if (cleaned === "1" || cleaned === "情感状态 1" || cleaned === "情感状态1") return "离异单身";
  if (cleaned === "2" || cleaned === "情感状态 2" || cleaned === "情感状态2") return "丧偶单身";
  return cleaned;
}

function formatEducation(edu?: string | null) {
  if (!edu || edu === "未填写") return "大专及以上";
  return edu.replace(/["'\\]/g, "").trim();
}

function formatIncome(inc?: string | null) {
  if (!inc || inc === "未填写") return "5000-8000元/月";
  return inc.replace(/["'\\]/g, "").trim();
}

function formatIntro(intro?: string | null) {
  if (!intro) return "诚意交友，期待遇见三观相合、真诚踏实的TA。";
  const cleaned = intro.replace(/["'\\]/g, "").trim();
  if (cleaned.includes("的相亲资料") || cleaned.length < 4) {
    return "诚意交友，性格随和开朗，工作生活稳定，期待寻找一位真诚踏实、共同奋斗的另一半。";
  }
  return cleaned;
}

function formatRequirement(req?: string | null) {
  if (!req || req.length < 3) return "希望遇到真诚合拍、性格温和、三观一致的单身异性。";
  return req.replace(/["'\\]/g, "").trim();
}
