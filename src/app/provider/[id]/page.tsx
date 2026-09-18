import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getProviderTrustFacts, formatRemainingTime } from "@/lib/info-promotions";
import {
  ShieldCheck,
  CheckCircle2,
  Phone,
  MessageSquare,
  MapPin,
  Clock,
  Sparkles,
  Calendar,
  Award,
  BadgeCheck,
  ChevronRight,
  ExternalLink,
  Flame,
  Star,
  Layers,
  ArrowLeft,
} from "lucide-react";
import InfoStickyContactBar from "@/components/info/InfoStickyContactBar";
import FollowProviderButton from "@/components/provider/FollowProviderButton";
import ProviderCouponClaimCard from "@/components/provider/ProviderCouponClaimCard";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const provider = await prisma.serviceProvider.findFirst({
    where: { OR: [{ id }, { userId: id }] },
  });

  if (!provider) return { title: "服务者主页未找到 - 杨林生活网" };

  return {
    title: `${provider.name} - ${provider.serviceCategory}认证服务商 - 杨林生活网`,
    description: `${provider.name}，杨林生活网认证${provider.serviceCategory}服务者。服务区域：${provider.serviceAreas.join("、")}。电话：${provider.phone}。${provider.intro.slice(0, 80)}`,
  };
}

export default async function ProviderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getSession();

  const provider = await prisma.serviceProvider.findFirst({
    where: { OR: [{ id }, { userId: id }] },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          nickname: true,
          avatar: true,
          phone: true,
          phoneVerifiedAt: true,
          createdAt: true,
        },
      },
    },
  });

  if (!provider) {
    notFound();
  }

  const roleUpper = String(session?.role || "").toUpperCase();
  const isOwner = session?.id === provider.userId;
  const isAdmin = roleUpper === "ADMIN" || roleUpper === "EDITOR";

  if (provider.verificationStatus !== "APPROVED" && !isOwner && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="max-w-xl mx-auto py-20 px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-4">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            服务商资料正在审核中
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            该服务商刚刚提交认证申请，平台专员正在加速核验中。通过后将正式向全站公开。
          </p>
          <div className="mt-6">
            <Link
              href="/info"
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
            >
              返回便民信息大厅
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 获取发布者真实可信度事实
  const trustFacts = await getProviderTrustFacts(provider.userId);

  const [listings, reviews, coupons, campaigns, followersCount, userFollow] = await Promise.all([
    prisma.listing.findMany({
      where: {
        authorId: provider.userId,
        status: "APPROVED",
      },
      orderBy: [{ isTop: "desc" }, { isFeatured: "desc" }, { refreshedAt: "desc" }],
      take: 30,
    }),
    prisma.review.findMany({
      where: {
        providerId: provider.id,
        status: "APPROVED",
      },
      include: {
        user: { select: { id: true, nickname: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.serviceCoupon.findMany({
      where: {
        providerId: provider.id,
        enabled: true,
      },
    }),
    prisma.merchantCampaign.findMany({
      where: {
        providerId: provider.id,
        status: "ACTIVE",
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.followProvider.count({
      where: { providerId: provider.id },
    }),
    session?.id
      ? prisma.followProvider.findUnique({
          where: {
            userId_providerId: {
              userId: session.id,
              providerId: provider.id,
            },
          },
        })
      : null,
  ]);

  const now = new Date();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 sm:pb-16">
      <Navbar />

      {/* 顶部面包屑 */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-2">
        <nav className="flex items-center text-xs text-slate-500 space-x-2">
          <Link href="/" className="hover:text-blue-600">
            首页
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link href="/info" className="hover:text-blue-600">
            便民信息
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[200px]">
            {provider.name}
          </span>
        </nav>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-2">
        {/* 服务商 Header Hero 形象卡片 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8 mb-6 relative overflow-hidden">
          {/* 背景光晕装饰 */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4 sm:gap-6">
              {/* 头像/门头照 */}
              <div
                style={{
                  background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
                  width: "80px",
                  height: "80px",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "16px",
                  fontWeight: 900,
                  fontSize: "24px",
                  flexShrink: 0,
                  overflow: "hidden",
                  boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
                }}
              >
                {provider.avatar ? (
                  <img
                    src={provider.avatar}
                    alt={provider.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{provider.name.slice(0, 2)}</span>
                )}
              </div>

              {/* 基础信息 */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {provider.name}
                  </h1>

                  {/* 认证 Badge */}
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    {provider.verificationType === "MERCHANT_VERIFIED"
                      ? "实体认证商家"
                      : "官方认证服务者"}
                  </span>

                  {provider.isMember && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                      👑 品牌VIP会员
                    </span>
                  )}

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      provider.operatingStatus === "OPEN"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
                        : provider.operatingStatus === "BUSY"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {provider.operatingStatus === "OPEN"
                      ? "🟢 接单中"
                      : provider.operatingStatus === "BUSY"
                      ? "🟡 稍忙"
                      : "🔴 暂停接单"}
                  </span>

                  {provider.ratingCount >= 3 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      ★ {provider.ratingAvg.toFixed(1)} 分 ({provider.ratingCount}条真实评价)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      🌱 新入驻 · 真实评价积累中
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    主营：{provider.serviceCategory}
                  </span>
                  {provider.yearsOfService && (
                    <span>· 从业经验：{provider.yearsOfService}</span>
                  )}
                  {provider.address && (
                    <span className="flex items-center gap-0.5">
                      · <MapPin className="w-3 h-3" /> {provider.address}
                    </span>
                  )}
                </div>

                {/* 覆盖片区 */}
                {provider.serviceAreas.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    <span className="text-xs text-slate-400">覆盖片区:</span>
                    {provider.serviceAreas.map((area: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* PC端联系方式与关注卡片 */}
            <div className="hidden sm:flex flex-col items-end gap-2.5 flex-shrink-0">
              <div className="flex items-center gap-2">
                <FollowProviderButton
                  providerId={provider.id}
                  initialFollowed={!!userFollow}
                  initialCount={followersCount}
                />
                <a
                  href={`tel:${provider.phone}`}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
                >
                  <Phone className="w-4 h-4" />
                  <span>拨打电话</span>
                </a>
              </div>
              {provider.wechat && (
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                  <span>微信号: <strong className="text-slate-700 dark:text-slate-200">{provider.wechat}</strong></span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 店铺特惠活动与专属优惠券 (P4) */}
        <ProviderCouponClaimCard coupons={coupons} campaigns={campaigns} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：核心内容 (服务介绍 + 信息列表) */}
          <div className="lg:col-span-2 space-y-6">
            {/* 真实可信事实卡片 (严禁虚假信用分，展示真实事实背书) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  平台真实可信度核验事实
                </h3>
                <span className="text-[11px] text-slate-400">
                  人工核验 · 事实背书
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-400">实名核验</div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    已通过实名
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-400">电话核验</div>
                  <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-1 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    真实手机号
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-400">入驻天数</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
                    {trustFacts.registeredDays} 天
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-400">活跃状态</div>
                  <div className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-1">
                    {trustFacts.activeStatusText}
                  </div>
                </div>
              </div>
            </div>

            {/* 服务介绍与专业特长 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                服务优势与专业特长
              </h3>
              <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {provider.intro || "该服务商暂未完善详细介绍。"}
              </div>
            </div>

            {/* 真实客户履约评价 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  真实客户履约评价 ({reviews.length})
                </h3>
                {provider.ratingCount >= 3 ? (
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    综合评分：{provider.ratingAvg.toFixed(1)} / 5.0
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">真实积累中 · 严禁脱离实际刷评</span>
                )}
              </div>

              {reviews.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                  暂无客户评价。真实服务完工后，发布需求的居民将在此发表客观履约评价。
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev: any) => (
                    <div
                      key={rev.id}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-amber-500 text-sm font-bold">
                            {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
                          </span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {rev.user?.nickname || "杨林居民"}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {rev.tags && rev.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {rev.tags.map((t: string) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        “{rev.content}”
                      </p>

                      {rev.replyContent && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                          <span className="font-semibold text-blue-600 dark:text-blue-400">👨‍🔧 师傅公开回复：</span>
                          {rev.replyContent}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 发布的便民信息列表 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-500" />
                  该服务商发布的信息 ({listings.length})
                </h3>
                <span className="text-xs text-slate-400">按最新排序</span>
              </div>

              {listings.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  暂无发布中的有效信息
                </div>
              ) : (
                <div className="space-y-3">
                  {listings.map((item: any) => {
                    const isTop = item.isTop && item.topUntil && item.topUntil > now;
                    const isFeatured = item.isFeatured && item.featuredUntil && item.featuredUntil > now;

                    return (
                      <Link
                        key={item.id}
                        href={`/info/${item.id}`}
                        className={`block p-4 rounded-xl border transition-all hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm ${
                          isTop
                            ? "border-amber-300 dark:border-amber-700 bg-amber-50/20 dark:bg-amber-950/10"
                            : "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              {isTop && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white">
                                  🔥置顶
                                </span>
                              )}
                              {isFeatured && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500 text-white">
                                  ⭐精选
                                </span>
                              )}
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                {item.category}
                              </span>
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white hover:text-blue-600 transition-colors">
                                {item.title}
                              </h4>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                              {item.body.slice(0, 100)}
                            </p>
                          </div>

                          {item.price && (
                            <div className="text-right flex-shrink-0">
                              <span className="text-sm font-black text-red-600 dark:text-red-400">
                                {item.price}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {item.area || "杨林经开区"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 右侧：侧边栏 (联系方式、优惠券、服务保障与投诉举报) */}
          <div className="space-y-6">
            {/* 师傅专属立减优惠券 */}
            {coupons.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  师傅专属立减优惠
                </h3>
                <div className="space-y-2">
                  {coupons.map((c: any) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-xl bg-gradient-to-r from-red-500/10 via-amber-500/10 to-transparent border border-red-200 dark:border-red-900/50 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-sm font-bold text-red-600 dark:text-red-400">
                          {c.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {c.description || `满 ¥${c.minSpendCents / 100} 可用`}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black text-red-600 dark:text-red-400">
                          -¥{c.discountCents / 100}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-500" />
                服务商联系方式
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <span className="text-slate-400">服务热线</span>
                  <a
                    href={`tel:${provider.phone}`}
                    className="font-bold text-blue-600 dark:text-blue-400 text-sm hover:underline"
                  >
                    {provider.phone}
                  </a>
                </div>

                {provider.wechat && (
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                    <span className="text-slate-400">添加微信</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {provider.wechat}
                    </span>
                  </div>
                )}

                {provider.address && (
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                    <div className="text-slate-400 mb-1">经营/门店地址</div>
                    <div className="text-slate-700 dark:text-slate-300 font-medium">
                      {provider.address}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 平台服务公约卡片 */}
            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-2">
              <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                杨林生活网本地服务公约
              </div>
              <p className="leading-relaxed text-[11px]">
                该服务商已在杨林生活网登记并提交核验材料。服务交易双方请遵守国家法律法规，建议线下核验服务质量后再进行结算，防范资金风险。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 手机端吸底联系栏 */}
      <InfoStickyContactBar
        rawPhone={provider.phone}
        wechat={provider.wechat}
        isExpired={false}
      />
    </div>
  );
}
