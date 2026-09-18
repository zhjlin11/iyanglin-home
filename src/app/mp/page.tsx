"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function MiniProgramContainerPage() {
  const [activeTab, setActiveTab] = useState<"home" | "category" | "publish" | "messages" | "my">("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [publishModal, setPublishModal] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const [resJobs, resProviders, resProfile] = await Promise.all([
          fetch("/api/jobs?limit=5").then((r) => r.json()).catch(() => ({ jobs: [] })),
          fetch("/api/services/recommended").then((r) => r.json()).catch(() => ({ providers: [] })),
          fetch("/api/user/profile").then((r) => r.json()).catch(() => ({})),
        ]);
        setJobs(resJobs?.jobs || []);
        setProviders(resProviders?.providers || []);
        if (resProfile?.user) setUser(resProfile.user);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center items-center py-0 sm:py-6" style={{ minHeight: "100vh", backgroundColor: "#0f172a" }}>
      <div
        className="w-full bg-slate-50 shadow-2xl flex flex-col relative overflow-hidden text-slate-900 font-sans"
        style={{ maxWidth: "420px", minHeight: "860px", height: "860px", borderRadius: "36px", border: "6px solid #1e293b", position: "relative" }}
      >
        
        {/* 顶部胶囊栏 */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white pt-3 pb-3 px-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center space-x-1 text-xs font-bold">
            <span className="text-base">📍</span>
            <span>昆明 · 杨林经开区</span>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white ml-1">晴 22℃</span>
          </div>

          <div className="bg-black/20 border border-white/20 rounded-full px-3 py-1 flex items-center space-x-2.5 text-xs text-white">
            <span className="cursor-pointer hover:opacity-80">•••</span>
            <span className="h-3 w-px bg-white/30" />
            <span className="cursor-pointer hover:opacity-80">⊙</span>
          </div>
        </div>

        {/* 主内容区域 */}
        <div className="flex-1 overflow-y-auto pb-20">
          {activeTab === "home" && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 pb-4 pt-1">
                <div className="bg-white rounded-2xl p-2.5 flex items-center space-x-2 shadow-md">
                  <span className="text-slate-400 text-sm">🔍</span>
                  <input
                    type="text"
                    placeholder="搜索经开区岗位、大学城租房、便民维修..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
                  />
                  <button className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm">
                    搜索
                  </button>
                </div>
              </div>

              {/* 5 大高频金刚区入口 */}
              <div className="px-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 grid grid-cols-5 gap-2 text-center">
                  {[
                    { title: "招工", icon: "💼", link: "/jobs", color: "bg-blue-50 text-blue-600" },
                    { title: "租房", icon: "🏡", link: "/house", color: "bg-emerald-50 text-emerald-600" },
                    { title: "便民", icon: "⚡", link: "/info", color: "bg-amber-50 text-amber-600" },
                    { title: "园区", icon: "🏭", link: "/industrial", color: "bg-purple-50 text-purple-600" },
                    { title: "商城", icon: "🛒", link: "/services", color: "bg-rose-50 text-rose-600" },
                  ].map((item) => (
                    <Link key={item.title} href={item.link} className="flex flex-col items-center space-y-1">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-sm ${item.color}`}>
                        {item.icon}
                      </div>
                      <span className="text-[11px] font-bold text-slate-700">{item.title}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* 快捷找师傅横幅 */}
              <div className="px-4">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-3.5 text-white shadow-md flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-extrabold text-sm flex items-center space-x-1">
                      <span>⚡ 找水电·保洁·开锁师傅</span>
                      <span className="text-[10px] bg-white text-orange-600 px-1.5 py-0.2 rounded font-bold">急速响应</span>
                    </div>
                    <div className="text-[11px] text-amber-100">本地认证师傅直连，官方担保无套路</div>
                  </div>
                  <Link
                    href="/info/request/new"
                    className="bg-white text-orange-600 text-xs font-extrabold px-3 py-1.5 rounded-xl shadow shrink-0"
                  >
                    一键发需求
                  </Link>
                </div>
              </div>

              {/* 推荐服务商 */}
              <div className="px-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-sm text-slate-800">🌟 本地口碑好店与精选服务</div>
                  <Link href="/services" className="text-xs text-blue-600 font-bold">全部 &gt;</Link>
                </div>

                <div className="space-y-2">
                  {providers.slice(0, 3).map((p: any) => (
                    <Link
                      key={p.id}
                      href={`/provider/${p.id}`}
                      className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3 block hover:border-blue-200 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center text-xl shrink-0">
                        {p.avatar ? <img src={p.avatar} alt="" className="w-full h-full object-cover" /> : "🏪"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-slate-800 truncate">{p.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{p.serviceCategory} · {p.yearsOfService || "本地老店"}</div>
                        <div className="text-[11px] text-amber-500 font-bold mt-0.5">⭐ {p.ratingAvg || 5.0} 评分</div>
                      </div>
                      <div className="text-xs bg-blue-50 text-blue-600 font-bold px-2.5 py-1 rounded-lg">
                        进店
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* 最新招聘 */}
              <div className="px-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-sm text-slate-800">💼 最新园区直招岗位</div>
                  <Link href="/jobs" className="text-xs text-blue-600 font-bold">更多 &gt;</Link>
                </div>

                <div className="space-y-2">
                  {jobs.slice(0, 4).map((j: any) => (
                    <Link
                      key={j.id}
                      href={`/jobs/${j.id}`}
                      className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm block hover:border-blue-200 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="font-bold text-xs text-slate-800">{j.title}</div>
                        <span className="font-extrabold text-xs text-rose-500">{j.salary}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                        <span>{j.company || "经开区企业"}</span>
                        <span>{j.area}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "category" && (
            <div className="p-4 space-y-4">
              <div className="font-extrabold text-base text-slate-800">🗂️ 全平台服务分类大厅</div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "招聘求职", desc: "经开区企业直招", link: "/jobs", icon: "💼" },
                  { name: "租房买房", desc: "大学城直租公寓", link: "/house", icon: "🏡" },
                  { name: "园区招商", desc: "厂房车间与独栋", link: "/industrial", icon: "🏭" },
                  { name: "便民家政", desc: "开锁修水管换纱窗", link: "/info", icon: "⚡" },
                  { name: "自营商城", desc: "一口价上门服务", link: "/services", icon: "🛒" },
                  { name: "相亲交友", desc: "杨林同城嘉宾推荐", link: "/love", icon: "❤️" },
                ].map((c) => (
                  <Link
                    key={c.name}
                    href={c.link}
                    className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1 block hover:border-blue-300"
                  >
                    <div className="text-2xl">{c.icon}</div>
                    <div className="font-bold text-xs text-slate-800">{c.name}</div>
                    <div className="text-[10px] text-slate-400">{c.desc}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {activeTab === "messages" && (
            <div className="p-4 space-y-3">
              <div className="font-extrabold text-base text-slate-800">💬 消息与通知中心</div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>🔔 平台事务服务通知</span>
                  <span className="text-[10px] text-slate-400">刚刚</span>
                </div>
                <div className="text-slate-500">
                  您的多端统一数字账号已激活。可在网页、小程序与服务号随时查收订单提醒。
                </div>
              </div>
            </div>
          )}

          {activeTab === "my" && (
            <div className="p-4 space-y-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center space-x-3">
                <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                  {user?.nickname?.[0] || user?.username?.[0] || "U"}
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-800">{user?.nickname || user?.username || "微信小程序用户"}</div>
                  <div className="text-xs text-slate-400 mt-0.5">账号ID: {user?.id?.slice(-8) || "微信授权已连通"}</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-2 divide-y divide-slate-100 text-xs font-bold text-slate-700">
                <Link href="/workspace" className="p-3 flex items-center justify-between hover:bg-slate-50 rounded-xl">
                  <span>💼 进入商家 / 企业 SaaS 工作台</span>
                  <span>&gt;</span>
                </Link>
                <Link href="/orders" className="p-3 flex items-center justify-between hover:bg-slate-50 rounded-xl">
                  <span>📦 我的订单与预约</span>
                  <span>&gt;</span>
                </Link>
                <Link href="/profile?tab=coupons" className="p-3 flex items-center justify-between hover:bg-slate-50 rounded-xl">
                  <span>🎫 我的优惠券包</span>
                  <span>&gt;</span>
                </Link>
                <Link href="/contact" className="p-3 flex items-center justify-between hover:bg-slate-50 rounded-xl">
                  <span>📞 24小时智能在线客服</span>
                  <span>&gt;</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* 底部原生感 TabBar */}
        <div
          className="bg-white border-t border-slate-200 z-30"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            width: "100%",
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            backgroundColor: "#ffffff",
            borderTop: "1px solid #e2e8f0",
          }}
        >
          <button
            onClick={() => setActiveTab("home")}
            className={`text-xs font-bold ${activeTab === "home" ? "text-blue-600" : "text-slate-400"}`}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", border: "none", background: "none", cursor: "pointer" }}
          >
            <span className="text-lg">🏠</span>
            <span className="text-[10px]">首页</span>
          </button>
          <button
            onClick={() => setActiveTab("category")}
            className={`text-xs font-bold ${activeTab === "category" ? "text-blue-600" : "text-slate-400"}`}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", border: "none", background: "none", cursor: "pointer" }}
          >
            <span className="text-lg">🗂️</span>
            <span className="text-[10px]">分类</span>
          </button>
          <button
            onClick={() => setPublishModal(true)}
            className="text-white rounded-full shadow-lg"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "-20px",
              background: "linear-gradient(135deg, #2563eb, #4f46e5)",
              color: "#ffffff",
              width: "48px",
              height: "48px",
              borderRadius: "9999px",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(37,99,235,0.4)",
            }}
          >
            <span style={{ fontSize: "24px", lineHeight: "1" }}>+</span>
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            className={`text-xs font-bold ${activeTab === "messages" ? "text-blue-600" : "text-slate-400"}`}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", border: "none", background: "none", cursor: "pointer" }}
          >
            <span className="text-lg">💬</span>
            <span className="text-[10px]">消息</span>
          </button>
          <button
            onClick={() => setActiveTab("my")}
            className={`text-xs font-bold ${activeTab === "my" ? "text-blue-600" : "text-slate-400"}`}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", border: "none", background: "none", cursor: "pointer" }}
          >
            <span className="text-lg">👤</span>
            <span className="text-[10px]">我的</span>
          </button>
        </div>

        {/* 快速发布弹层 */}
        {publishModal && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end">
            <div className="bg-white rounded-t-3xl p-6 space-y-4 animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-800 text-base">✨ 请选择你要发布的内容类型</div>
                <button onClick={() => setPublishModal(false)} className="text-slate-400 text-lg font-bold">✕</button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { name: "发招聘", icon: "💼", link: "/jobs/new", color: "bg-blue-50 text-blue-600" },
                  { name: "发房产", icon: "🏡", link: "/house/new", color: "bg-emerald-50 text-emerald-600" },
                  { name: "发便民", icon: "⚡", link: "/info/new", color: "bg-amber-50 text-amber-600" },
                  { name: "发厂房", icon: "🏭", link: "/industrial/publish", color: "bg-purple-50 text-purple-600" },
                  { name: "发需求", icon: "🛠️", link: "/info/request/new", color: "bg-rose-50 text-rose-600" },
                  { name: "发社区", icon: "💬", link: "/community/new", color: "bg-cyan-50 text-cyan-600" },
                ].map((item) => (
                  <Link
                    key={item.name}
                    href={item.link}
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl flex flex-col items-center space-y-1.5 transition-all"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${item.color}`}>
                      {item.icon}
                    </div>
                    <span className="text-xs font-bold text-slate-700">{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
