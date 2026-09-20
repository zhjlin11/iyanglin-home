import { getContent } from "@/lib/content-store";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import ContactRevealer from "@/components/ContactRevealer";
import DetailActions from "@/components/DetailActions";
import { parseJobBody } from "@/lib/job-parser";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CONTACT_VIEW_COIN_COST } from "@/lib/coin-wallet-store";
import Link from "next/link";
import WechatShareHiddenImage from "@/components/WechatShareHiddenImage";
import CrossChannelRecommendations from "@/components/common/CrossChannelRecommendations";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const item = await getContent(id);
  if (!item || item.kind !== "job") return {};

  const parsed = parseJobBody(item.body);
  const title = `${parsed.jobTitle || item.title} - ${item.company || "杨林企业"}招聘`;
  const description = `${item.company || "杨林企业"}在嵩明杨林诚聘${parsed.jobTitle || item.title}，薪资：${parsed.salary || item.salary || "面议"}，工作地点：${parsed.area || item.area || "杨林经开区"}。更多杨林本地名企招聘与求职信息请上杨林生活网。`;

  return {
    title,
    description,
    keywords: [parsed.jobTitle || item.title, item.company || "杨林企业", parsed.area || "杨林", "杨林招聘", "杨林求职", "杨林生活网"].filter(Boolean) as string[],
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://iyanglin.com/jobs/${item.id}`,
      siteName: "杨林生活网",
      images: [
        {
          url: (item.images && item.images[0]) || "https://iyanglin.com/share/v2/job.png?v=20260912",
          width: 600,
          height: 600,
        },
      ],
    },
    alternates: {
      canonical: `https://iyanglin.com/jobs/${item.id}`,
    },
  };
}

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;
  const item = await getContent(id);

  if (!item || item.kind !== "job") {
    return notFound();
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("yanglin_session")?.value;
  const isLoggedIn = !!sessionCookie;
  const session = await getSession();

  const isAuthor = Boolean(session?.id && item.authorId && session.id === item.authorId);
  const isAdmin = session?.role === "ADMIN" || session?.role === "EDITOR";
  const canPreview = isAuthor || isAdmin;

  const parsed = parseJobBody(item.body);

  // 提取电话并生成脱敏号码
  let rawPhone = parsed.contact || item.contact || "";
  if (!rawPhone) {
    const phoneMatch = item.body.match(/1[3-9]\d{9}/);
    if (phoneMatch) rawPhone = phoneMatch[0];
  }

  if (!rawPhone && item.authorId) {
    try {
      const u = await prisma.user.findUnique({
        where: { id: item.authorId },
        select: { phone: true },
      });
      if (u?.phone) rawPhone = u.phone;
    } catch {}
  }
  if (!rawPhone && item.company) {
    try {
      const s = await prisma.shop.findFirst({
        where: { name: { contains: item.company.trim() } },
        select: { phone: true },
      });
      if (s?.phone) rawPhone = s.phone;
    } catch {}
  }

  // 非审核通过状态拦截与专用视图呈现（满足“没有真实审核在会员中心点击详情显示待审核，后台审核通过显示审核通过的职位详情”）
  if (item.status !== "approved") {
    // 1. 外部普通访客访问未公开内容：给出友好提示，绝不抛出冷冰冰的 404
    if (!canPreview) {
      return (
        <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", flexDirection: "column" }}>
          <Navbar />
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
            <div style={{ maxWidth: "480px", width: "100%", background: "white", borderRadius: "16px", padding: "2.5rem 2rem", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "52px", marginBottom: "1rem" }}>⏳</div>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#1e293b", marginBottom: "8px" }}>
                {item.status === "pending" ? "职位正在审核中" : item.status === "offline" ? "职位已暂停招聘" : "内容暂未公开"}
              </h2>
              <p style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.6", marginBottom: "1.5rem" }}>
                {item.status === "pending"
                  ? "该招聘岗位已由发布者成功提交，平台专员正在进行企业资质与岗位真实性合规审核。审核通过后将自动对全网求职者公开展示，敬请期待！"
                  : item.status === "offline"
                  ? "该招聘岗位目前处于暂停招募或下线状态。您可以浏览杨林本地其他正在招聘的名企岗位。"
                  : "该信息目前不可见，请浏览其他招聘信息。"}
              </p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/jobs" style={{ padding: "10px 20px", background: "#1967D2", color: "white", borderRadius: "8px", textDecoration: "none", fontSize: "14px", fontWeight: "700" }}>
                  浏览招聘大厅
                </Link>
                <Link href="/" style={{ padding: "10px 20px", background: "#f1f5f9", color: "#475569", borderRadius: "8px", textDecoration: "none", fontSize: "14px", fontWeight: "700" }}>
                  返回网站首页
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 2. 作者本人或管理员访问待审核岗位：呈现专属的【待审核 · 职位预览与审核跟踪】页面
    if (item.status === "pending") {
      const createdDateStr = item.createdAt
        ? new Date(item.createdAt).toLocaleString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "刚刚提交";

      return (
        <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", flexDirection: "column" }}>
          <Navbar />

          {/* 顶部面包屑 */}
          <section style={{ background: "#ffffff", borderBottom: "1px solid #E5E7EB", padding: "0.85rem 0" }}>
            <div style={{ maxWidth: "860px", margin: "0 auto", padding: "0 1.25rem", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#6B7280" }}>
              <Link href="/" style={{ color: "#4B5563", textDecoration: "none" }}>网站首页</Link>
              <span>/</span>
              <Link href="/profile" style={{ color: "#4B5563", textDecoration: "none" }}>会员中心</Link>
              <span>/</span>
              <span style={{ color: "#D97706", fontWeight: "700" }}>职位待审核详情</span>
            </div>
          </section>

          {/* 主体容器 */}
          <main style={{ maxWidth: "860px", width: "100%", margin: "1.5rem auto 3rem auto", padding: "0 1.25rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            
            {/* 卡片 1：审核状态与三步流转进度 */}
            <div style={{ background: "white", borderRadius: "16px", border: "1px solid #fde68a", padding: "1.75rem", boxShadow: "0 4px 16px rgba(245, 158, 11, 0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "28px" }}>⏳</span>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <h1 style={{ fontSize: "18px", fontWeight: "800", color: "#92400e", margin: 0 }}>职位待审核</h1>
                      <span style={{ padding: "2px 8px", borderRadius: "10px", fontSize: "12px", fontWeight: "700", background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a" }}>
                        平台审核中
                      </span>
                    </div>
                    <p style={{ fontSize: "13px", color: "#78350f", margin: "3px 0 0 0" }}>
                      您提交的招聘信息正在平台人工审核中，暂未对公众公开展示。
                    </p>
                  </div>
                </div>

                {isAdmin && (
                  <Link
                    href="/admin/content?kind=job"
                    style={{
                      padding: "6px 14px",
                      background: "#16a34a",
                      color: "white",
                      borderRadius: "8px",
                      textDecoration: "none",
                      fontSize: "12px",
                      fontWeight: "700",
                    }}
                  >
                    🛠️ 管理员前往后台审核上线 →
                  </Link>
                )}
              </div>

              {/* 三步审核进度轴 */}
              <div style={{ background: "#fffbeb", borderRadius: "12px", padding: "1.25rem", border: "1px solid #fef08a", marginTop: "0.5rem" }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#92400e", marginBottom: "12px" }}>
                  📋 平台审核流转进度：
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                  {/* 步骤 1 */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#16a34a", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", flexShrink: 0 }}>
                      ✓
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#166534" }}>1. 提交成功</div>
                      <div style={{ fontSize: "11px", color: "#65a30d" }}>{createdDateStr}</div>
                    </div>
                  </div>
                  {/* 步骤 2 */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#f59e0b", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", flexShrink: 0 }}>
                      2
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#b45309" }}>2. 平台人工审核 (进行中)</div>
                      <div style={{ fontSize: "11px", color: "#d97706" }}>核验用人企业与合规性，工作日约2小时</div>
                    </div>
                  </div>
                  {/* 步骤 3 */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#cbd5e1", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", flexShrink: 0 }}>
                      3
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#64748b" }}>3. 审核通过全网公开</div>
                      <div style={{ fontSize: "11px", color: "#94a3b8" }}>上线全站招聘大厅与求职推荐</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 隐私与安全提示 */}
              <div style={{ marginTop: "1rem", fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>🔒</span>
                <span>当前页面为已提交内容的专属预览视图，外部非发布者访客访问将显示“审核中”，无法查看内部联系人信息。</span>
              </div>
            </div>

            {/* 卡片 2：已提交职位信息核对预览 */}
            <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "1.75rem", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "1rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "1rem" }}>
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px 0" }}>
                    {parsed.jobTitle || item.title}
                  </h2>
                  <div style={{ fontSize: "14px", color: "#64748b", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: "700", color: "#334155" }}>🏢 {item.company || "招聘企业"}</span>
                    <span>·</span>
                    <span>📍 {parsed.area || item.area || "杨林"}</span>
                    <span>·</span>
                    <span>💼 {item.jobType || "全职"}</span>
                  </div>
                </div>
                <div style={{ fontSize: "22px", fontWeight: "900", color: "#d97706" }}>
                  {parsed.salary || item.salary || "面议"}
                </div>
              </div>

              {/* 核心要求标签 */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "1.25rem" }}>
                <span style={{ padding: "4px 10px", borderRadius: "6px", background: "#f1f5f9", color: "#475569", fontSize: "12px", fontWeight: "600" }}>
                  学历：{parsed.education || "不限学历"}
                </span>
                <span style={{ padding: "4px 10px", borderRadius: "6px", background: "#f1f5f9", color: "#475569", fontSize: "12px", fontWeight: "600" }}>
                  经验：{parsed.experience || "经验不限"}
                </span>
                {parsed.benefits && (
                  <span style={{ padding: "4px 10px", borderRadius: "6px", background: "#fef3c7", color: "#92400e", fontSize: "12px", fontWeight: "600" }}>
                    福利：{parsed.benefits}
                  </span>
                )}
              </div>

              {/* 岗位职责与详细说明 */}
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}>
                  📄 职位描述与任职要求：
                </div>
                <div style={{ fontSize: "13.5px", color: "#334155", lineHeight: "1.7", background: "#f8fafc", padding: "1rem 1.25rem", borderRadius: "10px", whiteSpace: "pre-wrap", border: "1px solid #f1f5f9" }}>
                  {parsed.description || item.body || "暂无详细描述"}
                </div>
              </div>

              {/* 联系方式（作者本人核对） */}
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "1rem 1.25rem" }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#1d4ed8", marginBottom: "4px" }}>
                  📞 提交的联系方式（作者本人核对）：
                </div>
                <div style={{ fontSize: "14px", color: "#1e40af", fontWeight: "600" }}>
                  电话：{rawPhone || "暂未填写手机号"} {item.contactName ? `（联系人：${item.contactName}）` : ""}
                </div>
              </div>
            </div>

            {/* 卡片 3：底部快捷操作与客服加急 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "1.25rem 1.75rem" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <Link
                  href="/profile"
                  style={{
                    padding: "9px 18px",
                    borderRadius: "8px",
                    background: "#f1f5f9",
                    color: "#334155",
                    fontSize: "13px",
                    fontWeight: "700",
                    textDecoration: "none",
                  }}
                >
                  ← 返回会员中心
                </Link>
                <Link
                  href="/jobs/new"
                  style={{
                    padding: "9px 18px",
                    borderRadius: "8px",
                    background: "#1967D2",
                    color: "white",
                    fontSize: "13px",
                    fontWeight: "700",
                    textDecoration: "none",
                  }}
                >
                  + 发布其他职位
                </Link>
              </div>

              <div style={{ fontSize: "12.5px", color: "#64748b", textAlign: "right" }}>
                <span>如需加急审核，可联系平台专属客服电话/微信：</span>
                <b style={{ color: "#d97706", marginLeft: "4px" }}>15887208151</b>
              </div>
            </div>

          </main>
        </div>
      );
    }

    // 3. 已下架状态处理
    if (item.status === "offline") {
      return (
        <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", flexDirection: "column" }}>
          <Navbar />
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
            <div style={{ maxWidth: "480px", width: "100%", background: "white", borderRadius: "16px", padding: "2.5rem 2rem", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "52px", marginBottom: "1rem" }}>📦</div>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#1e293b", marginBottom: "8px" }}>职位已暂停招聘 (已下架)</h2>
              <p style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.6", marginBottom: "1.5rem" }}>
                该职位当前处于下架状态，未对前台求职者开放。如需重新招聘，请前往个人中心重新上架。
              </p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <Link href="/profile" style={{ padding: "10px 20px", background: "#1967D2", color: "white", borderRadius: "8px", textDecoration: "none", fontSize: "14px", fontWeight: "700" }}>
                  前往会员中心
                </Link>
                <Link href="/jobs" style={{ padding: "10px 20px", background: "#f1f5f9", color: "#475569", borderRadius: "8px", textDecoration: "none", fontSize: "14px", fontWeight: "700" }}>
                  浏览招聘大厅
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // 检查当前用户是否已解锁该招聘联系方式
  let contactUnlocked = false;
  if (session?.id) {
    const purchase = await prisma.contactPurchase.findUnique({
      where: { userId_targetKind_targetId: { userId: session.id, targetKind: "job", targetId: id } },
    });
    if (purchase) contactUnlocked = true;
    if (!contactUnlocked && isAdmin) contactUnlocked = true;
    if (!contactUnlocked) {
      const vip = await prisma.userMembership.findFirst({ where: { userId: session.id, status: "ACTIVE" } });
      if (vip) contactUnlocked = true;
    }
    // 发布者本人免费
    if (!contactUnlocked && isAuthor) contactUnlocked = true;
  }

  let companyEntity: any = null;
  let companyActiveJobsCount = 1;
  try {
    const jobRecord = await prisma.job.findUnique({
      where: { id: item.id },
      include: {
        companyEntity: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logo: true,
            industry: true,
            companySize: true,
            companyType: true,
            address: true,
            isVerified: true,
            verificationStatus: true,
            isFeaturedEmployer: true,
          },
        },
        organization: {
          select: { id: true, name: true, type: true, industry: true, address: true, contactName: true, contactPhone: true },
        },
      },
    });

    if (jobRecord?.companyEntity) {
      companyEntity = jobRecord.companyEntity;
    } else if (item.company) {
      companyEntity = await prisma.company.findFirst({
        where: { name: item.company.trim(), status: "ACTIVE" },
        select: {
          id: true,
          name: true,
          shortName: true,
          logo: true,
          industry: true,
          companySize: true,
          companyType: true,
          address: true,
          isVerified: true,
          verificationStatus: true,
          isFeaturedEmployer: true,
        },
      });
    }

    if (companyEntity) {
      companyActiveJobsCount = await prisma.job.count({
        where: { companyId: companyEntity.id, status: "APPROVED" },
      });
    }
  } catch {}

  const isCompanyVerified = companyEntity?.isVerified && companyEntity?.verificationStatus === "VERIFIED";
  const companyPageHref = companyEntity ? `/company/${companyEntity.id}` : `/jobs?q=${encodeURIComponent(item.company || "")}`;

  // 未登录时脱敏电话号码（支持手机号和座机号）
  function maskPhone(phone: string): string {
    const digits = phone.replace(/[\s-]/g, "");
    if (!digits || digits.length < 4) return "****";
    // 统一策略：保留前3位和后2位，中间用****替代
    const keep = Math.min(3, Math.floor(digits.length / 3));
    const keepEnd = Math.min(2, digits.length - keep - 1);
    return digits.slice(0, keep) + "****" + digits.slice(digits.length - keepEnd);
  }
  const maskedPhone = rawPhone ? maskPhone(rawPhone) : "";
  const displayPhone = contactUnlocked ? rawPhone : maskedPhone;

  let cleanDescription = parsed.description || item.body;
  // 无论是否解锁，正文中的电话号码一律移除 —— 联系方式只在专属区域展示（需点击查看）
  cleanDescription = cleanDescription
    .replace(/【联系电话】[：:]\s*[^\n]*/g, "")
    .replace(/【联系方式】[：:]?[^\n]*/g, "")
    .replace(/【微信[号]?】[：:]?[^\n]*/g, "")
    .replace(/联系[电话方式]?[：:]\s*1[3-9]\d{9}[^\n]*/g, "")
    .replace(/电话[：:]\s*1[3-9]\d{9}[^\n]*/g, "")
    .replace(/1[3-9]\d{9}/g, "****")
    .replace(/0\d{2,3}[\s-]*\d{7,8}/g, "****")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const jobTitle = parsed.jobTitle || item.title;
  const companyName = item.company || "嵩明杨林本地名企";
  const salaryStr = parsed.salary || item.salary || "面议";
  const areaStr = parsed.area || item.area || "杨林经开区";
  const eduStr = parsed.education || "不限学历";
  const expStr = parsed.experience || "经验不限";
  const headcountStr = "若干名";

  // 企业徽标生成（首字）
  const companyInitial = companyName.trim().slice(0, 1) || "企";

  // JobPosting 结构化数据
  const jobJsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: jobTitle,
    description: (parsed.description || item.body)
      .replace(/<[^>]*>/g, "")
      .replace(/【联系方式】[：:]?[^\n]*/g, "")
      .replace(/【联系电话】[：:]?[^\n]*/g, "")
      .replace(/【微信[号]?】[：:]?[^\n]*/g, "")
      .replace(/联系[电话方式]?[：:]\s*1[3-9]\d{9}[^\n]*/g, "")
      .replace(/电话[：:]\s*1[3-9]\d{9}[^\n]*/g, "")
      .replace(/1[3-9]\d{9}/g, "")
      .replace(/0\d{2,3}[\s-]*\d{7,8}/g, "")
      .replace(/联系[：:]\s+/g, "")
      .replace(/\s{2,}/g, " ")
      .trim()
      .slice(0, 500),
    datePosted: item.createdAt,
    hiringOrganization: {
      "@type": "Organization",
      name: companyName,
      sameAs: `https://iyanglin.com/jobs?company=${encodeURIComponent(companyName)}`,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: areaStr,
        addressRegion: "云南省昆明市嵩明县",
        addressCountry: "CN",
      },
    },
    employmentType: "FULL_TIME",
    ...(salaryStr !== "面议" && {
      baseSalary: {
        "@type": "MonetaryAmount",
        currency: "CNY",
        value: { "@type": "QuantitativeValue", value: salaryStr, unitText: "MONTH" },
      },
    }),
  };

  const rawFirstImg = item.images && item.images[0];
  const shareImageUrl = rawFirstImg
    ? (rawFirstImg.startsWith("http") ? rawFirstImg : `https://iyanglin.com${rawFirstImg.startsWith("/") ? "" : "/"}${rawFirstImg}`)
    : "https://iyanglin.com/share/v2/job.png?v=20260912";
  const shareTitle = `【招聘】${jobTitle} - ${companyName}`;
  const shareDesc = `${companyName}诚聘${jobTitle}，薪资：${salaryStr}，工作地点：${areaStr}。立即点击查看岗位与联系方式。`;

  return (
    <main className="template-page jobzilla-page jobzilla-detail-page" style={{ minHeight: "100vh", background: "#F9FAFB", paddingBottom: "5rem" }}>
      {/* 微信与社交爬虫首图兜底（确保微信朋友圈与聊天直接抓取到300x300以上高清分享卡片封面） */}
      <WechatShareHiddenImage imageUrl={shareImageUrl} alt={shareTitle} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobJsonLd) }} />
      <Navbar />

      {/* =========================================================================
          1. 顶部面包屑导航
          ========================================================================= */}
      <section style={{ background: "#ffffff", borderBottom: "1px solid #E5E7EB", padding: "1rem 0" }}>
        <div className="jobzilla-shell" style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#6B7280" }}>
            <Link prefetch={false} href="/" style={{ color: "#4B5563", textDecoration: "none" }}>网站首页</Link>
            <span>/</span>
            <Link prefetch={false} href="/jobs" style={{ color: "#4B5563", textDecoration: "none" }}>求职招聘</Link>
            <span>/</span>
            <span style={{ color: "#1967D2", fontWeight: "700" }}>职位详情</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. Jobzilla 经典职位详情双栏架构 (job-detail.html)
          ========================================================================= */}
      <div className="jobzilla-shell" style={{ maxWidth: "1240px", margin: "2rem auto 0 auto", padding: "0 1.25rem" }}>
        <div className="jobzilla-detail-layout" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "32px", alignItems: "start" }}>
          
          {/* 左侧主体 */}
          <div>
            {/* Jobzilla 顶部企业封面与岗位概览大卡片 (twm-job-self-wrap) */}
            <div
              style={{
                borderRadius: "16px",
                overflow: "hidden",
                background: "#ffffff",
                boxShadow: "0 10px 30px rgba(25,103,210,0.06)",
                border: "1px solid #E5E7EB",
                marginBottom: "28px",
              }}
            >
              {/* 企业封面蓝调渐变横幅 */}
              <div
                style={{
                  height: "140px",
                  background: "linear-gradient(135deg, #0B2240 0%, #1967D2 100%)",
                  position: "relative",
                  padding: "20px 24px",
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(6px)", color: "#ffffff", padding: "4px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" }}>
                  <span>✓</span> 平台资质人工审核认证
                </div>
              </div>

              {/* 岗位核心信息区 (含悬浮企业 Logo) */}
              <div className="jobzilla-detail-body" style={{ padding: "0 32px 32px 32px", position: "relative" }}>
                {/* 悬浮企业 Logo 徽章 */}
                <div
                  className="jobzilla-company-badge"
                  style={{
                    width: "84px",
                    height: "84px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #1967D2 0%, #0F4FA8 100%)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "36px",
                    fontWeight: "900",
                    boxShadow: "0 8px 24px rgba(25,103,210,0.25)",
                    marginTop: "-42px",
                    marginBottom: "16px",
                    border: "4px solid #ffffff",
                  }}
                >
                  {companyInitial}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", borderBottom: "1px solid #F3F4F6", paddingBottom: "24px", marginBottom: "24px" }}>
                  <div style={{ flex: 1, minWidth: "260px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <h1 style={{ margin: 0, fontSize: "26px", fontWeight: "900", color: "#17171D", lineHeight: "1.3" }}>
                        {jobTitle}
                      </h1>
                      <span style={{ background: "#F0F6FE", color: "#1967D2", padding: "3px 10px", borderRadius: "4px", fontSize: "12px", fontWeight: "700" }}>
                        企业直招
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                      <Link
                        href={companyPageHref}
                        title={`点击进入 ${companyName} 主页并查看全部在招职位`}
                        style={{
                          fontSize: "15px",
                          fontWeight: "700",
                          color: "#1967D2",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span>🏢</span>
                        <span style={{ textDecoration: "underline", textUnderlineOffset: "3px" }}>{companyName}</span>
                      </Link>
                      {isCompanyVerified ? (
                        <span style={{ fontSize: "11px", fontWeight: "700", background: "#DCFCE7", color: "#166534", border: "1px solid #BBF7D0", padding: "1px 8px", borderRadius: "999px" }}>
                          ✓ 官方认证企业
                        </span>
                      ) : (
                        <span style={{ fontSize: "11px", color: "#64748B", background: "#F1F5F9", padding: "1px 8px", borderRadius: "4px" }}>
                          平台收录单位
                        </span>
                      )}
                      {companyEntity?.isFeaturedEmployer && (
                        <span style={{ fontSize: "11px", fontWeight: "700", background: "#FEF3C7", color: "#92400E", padding: "1px 8px", borderRadius: "4px", border: "1px solid #FDE68A" }}>
                          ★ 推荐名企
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "16px", fontSize: "13.5px", color: "#6B7280", flexWrap: "wrap" }}>
                      <span>📍 工作地点：{areaStr}</span>
                      <span>🕒 审核状态：正常招募中</span>
                      <span>👥 招聘人数：{headcountStr}</span>
                    </div>
                  </div>

                  {/* 右侧：薪资待遇大标 */}
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "13px", color: "#6B7280" }}>薪酬待遇</div>
                    <div style={{ fontSize: "32px", fontWeight: "900", color: "#FD7E14", lineHeight: "1.2" }}>
                      {salaryStr}
                    </div>
                    <div style={{ fontSize: "12px", color: "#10B981", fontWeight: "700", marginTop: "4px" }}>
                      ✓ 按月足额发放
                    </div>
                  </div>
                </div>

                {/* Jobzilla 经典 4 宫格岗位核心参数矩阵 */}
                <div
                  className="jobzilla-facts-grid"
                  style={{
                    background: "#F8F9FA",
                    borderRadius: "12px",
                    padding: "20px",
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "16px",
                    textAlign: "center",
                    border: "1px solid #E5E7EB",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "18px", fontWeight: "900", color: "#17171D" }}>{eduStr}</div>
                    <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "4px" }}>最低学历要求</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "18px", fontWeight: "900", color: "#17171D" }}>{expStr}</div>
                    <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "4px" }}>经验年限要求</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "18px", fontWeight: "900", color: "#17171D" }}>{headcountStr}</div>
                    <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "4px" }}>拟招聘名额</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "18px", fontWeight: "900", color: "#1967D2" }}>企业直聊</div>
                    <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "4px" }}>招聘服务模式</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 岗位职责与任职资格卡片 (Jobzilla Description & Requirements) */}
            <div
              className="jobzilla-desc-card"
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #E5E7EB",
                padding: "28px 32px",
                boxShadow: "0 4px 20px rgba(25,103,210,0.03)",
                marginBottom: "28px",
              }}
            >
              {/* 福利待遇保障 */}
              <div style={{ marginBottom: "28px" }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "800", color: "#17171D", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "4px", height: "18px", background: "#1967D2", borderRadius: "2px" }}></span>
                  岗位福利与企业保障
                </h3>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
                  {[
                    "企业直招直接签订用工合同，免收任何中介报名费",
                    "薪资准时发放，工作环境规范整洁",
                    "完善的新员工带薪入职培训与专业技能指导",
                    "享受法定节假日与带薪休假福利待遇",
                    "表现优秀者享受快速晋升加薪与年终奖金通道",
                    "杨林本地企业，工作通勤便利稳定",
                  ].map((text, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "#F0F6FE", borderRadius: "8px", border: "1px solid #DBEAFE", fontSize: "13.5px", color: "#1E3A8A" }}>
                      <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#1967D2", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "900", flexShrink: 0 }}>
                        ✓
                      </span>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 岗位详细说明与职责正文 */}
              <div>
                <h3 style={{ margin: "0 0 14px 0", fontSize: "18px", fontWeight: "800", color: "#17171D", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "4px", height: "18px", background: "#1967D2", borderRadius: "2px" }}></span>
                  职位描述与任职要求
                </h3>
                <div
                  style={{
                    background: "#F9FAFB",
                    borderRadius: "12px",
                    padding: "24px",
                    fontSize: "15px",
                    lineHeight: "1.8",
                    color: "#374151",
                    whiteSpace: "pre-wrap",
                    border: "1px solid #E5E7EB",
                  }}
                >
                  {cleanDescription || "企业暂未填写详细岗位描述，建议直接联系招聘人事沟通工作细节与面试安排。"}
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：雇主信息与联系直达中枢 */}
          <aside className="jobzilla-contact-rail" style={{ position: "sticky", top: "20px" }}>
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #E5E7EB",
                padding: "24px",
                boxShadow: "0 10px 30px rgba(25,103,210,0.06)",
                textAlign: "center",
              }}
            >
              {/* 企业 Logo 与企业名称 */}
              <Link
                href={companyPageHref}
                style={{ textDecoration: "none", display: "block", textAlign: "center" }}
              >
                <div
                  style={{
                    width: "68px",
                    height: "68px",
                    borderRadius: "14px",
                    background: companyEntity?.logo ? `#ffffff url(${companyEntity.logo}) center/contain no-repeat` : "linear-gradient(135deg, #1967D2 0%, #0F4FA8 100%)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "30px",
                    fontWeight: "900",
                    margin: "0 auto 12px auto",
                    boxShadow: "0 4px 15px rgba(25,103,210,0.2)",
                  }}
                >
                  {!companyEntity?.logo && companyInitial}
                </div>

                <h3 style={{ margin: "0 0 6px 0", fontSize: "17px", fontWeight: "800", color: "#17171D", textDecoration: "none" }}>
                  {companyName}
                </h3>
              </Link>

              <div style={{ display: "flex", justifyContent: "center", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
                {isCompanyVerified ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#DCFCE7", color: "#166534", padding: "2px 10px", borderRadius: "20px", fontSize: "11.5px", fontWeight: "700", border: "1px solid #BBF7D0" }}>
                    <span>✓</span> 平台官方认证企业
                  </span>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#F1F5F9", color: "#64748B", padding: "2px 10px", borderRadius: "20px", fontSize: "11.5px", fontWeight: "600" }}>
                    平台收录企业
                  </span>
                )}
              </div>

              {/* 企业简要指标 */}
              <div style={{ background: "#F8FAFC", borderRadius: "8px", padding: "10px 14px", fontSize: "12px", color: "#64748B", marginBottom: "16px", display: "flex", justifyContent: "space-around" }}>
                <div>
                  <div style={{ color: "#94A3B8" }}>所属行业</div>
                  <div style={{ color: "#0F172A", fontWeight: "700", marginTop: "2px" }}>{companyEntity?.industry || "综合产业"}</div>
                </div>
                <div style={{ width: "1px", background: "#E2E8F0" }} />
                <div>
                  <div style={{ color: "#94A3B8" }}>在招岗位</div>
                  <div style={{ color: "#1967D2", fontWeight: "800", marginTop: "2px" }}>{companyActiveJobsCount} 个</div>
                </div>
              </div>

              <Link
                href={companyPageHref}
                style={{
                  display: "block",
                  textAlign: "center",
                  background: "#F0F6FE",
                  color: "#1967D2",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "700",
                  textDecoration: "none",
                  marginBottom: "16px",
                  border: "1px solid #BFDBFE",
                }}
              >
                查看企业主页与全部在招职位 &gt;
              </Link>

              {/* 电话解锁与拨打模块 */}
              <div style={{ background: "#F8F9FA", borderRadius: "12px", padding: "16px", border: "1px solid #E5E7EB", marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", color: "#6B7280", marginBottom: "6px" }}>招聘负责人联系电话</div>
                <div style={{ fontSize: "20px", fontWeight: "900", color: "#17171D", letterSpacing: "0.05em", marginBottom: "12px" }}>
                  {displayPhone || "同城直面直招"}
                </div>
                {!isLoggedIn && rawPhone && (
                  <div style={{ fontSize: "11px", color: "#EF4444", marginBottom: "8px" }}>
                    🔒 登录后查看完整号码
                  </div>
                )}
                {isLoggedIn && !contactUnlocked && rawPhone && (
                  <div style={{ fontSize: "11px", color: "#B45309", marginBottom: "8px" }}>
                    🪙 需消耗 {CONTACT_VIEW_COIN_COST} 金币解锁联系方式
                  </div>
                )}
                <ContactRevealer
                  contact={contactUnlocked ? rawPhone : ""}
                  maskedPhone={maskedPhone}
                  isLoggedIn={isLoggedIn}
                  redirectUrl={`/jobs/${item.id}`}
                  targetKind="job"
                  targetId={item.id}
                  coinCost={CONTACT_VIEW_COIN_COST}
                  unlocked={contactUnlocked}
                />
              </div>

              {/* 微信扫码一键咨询通道 */}
              <div style={{ borderTop: "1px dashed #E5E7EB", paddingTop: "16px" }}>
                <div style={{ fontSize: "12px", color: "#6B7280", marginBottom: "8px" }}>
                  支持添加微信 · 预约面试沟通
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "13px", fontWeight: "700", color: "#059669" }}>
                  <span>🟢</span> 微信扫码即刻在线直聊
                </div>
              </div>

              {/* 收藏、举报与安全提示 */}
              <div style={{ marginTop: "20px", paddingTop: "14px", borderTop: "1px solid #F3F4F6", display: "flex", justifyContent: "center", gap: "16px" }}>
                <DetailActions
                  resourceType="JOB"
                  resourceId={item.id}
                  title={shareTitle}
                  desc={shareDesc}
                  link={`https://iyanglin.com/jobs/${item.id}`}
                  imageUrl={shareImageUrl}
                />
              </div>
            </div>

            {/* 求职安全防骗提示 */}
            <div style={{ background: "#EFF6FF", borderRadius: "12px", border: "1px solid #DBEAFE", padding: "16px", marginTop: "16px", fontSize: "12px", color: "#1E40AF", lineHeight: "1.6" }}>
              <div style={{ fontWeight: "800", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                <span>🛡️</span> 求职安全防诈骗温馨提醒
              </div>
              正规招聘严禁收取报名费、押金或任何培训费用。如遇索要财物或诱导网络刷单转账，请立即停止沟通并在平台上进行举报。
            </div>
          </aside>
        </div>

        {/* P5 跨频道联动推荐：周边租房与通勤拼车 */}
        <CrossChannelRecommendations
          targetType="JOB"
          targetId={item.id}
          area={item.area || "杨林"}
        />
      </div>
    </main>
  );
}
