"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function MessagesPage() {
  const messageTabs = [
    { label: "私信", count: "3", icon: "💬", active: true },
    { label: "通知", count: "1", icon: "🔔", active: false },
    { label: "赞和收藏", count: "5", icon: "💖", active: false },
    { label: "系统通知", count: "0", icon: "📢", active: false },
  ];

  const chatList = [
    {
      id: "1",
      name: "张经理 (昆明自动化设备厂HR)",
      avatar: "👨‍💼",
      avatarBg: "#ecfdf5",
      time: "2分钟前",
      lastMsg: "您好，看到您在杨林生活网投递的岗位意向，请问周一方便到经开区厂区面试吗？",
      badge: "招聘直聊",
      badgeBg: "#ecfdf5",
      badgeColor: "#16A67A",
      unread: true,
    },
    {
      id: "2",
      name: "李房东 (大学城阳光公寓)",
      avatar: "🏠",
      avatarBg: "#eff6ff",
      time: "20分钟前",
      lastMsg: "你好，云南工商学院旁边的精装单间还在租，随时可以过来带看。",
      badge: "房源直租",
      badgeBg: "#eff6ff",
      badgeColor: "#2563eb",
      unread: true,
    },
    {
      id: "3",
      name: "杨林生活网官方审核助手",
      avatar: "🛡️",
      avatarBg: "#fef3c7",
      time: "2小时前",
      lastMsg: "🎉 恭喜！您发布的便民租售信息已通过平台安全审核，已展示在首页推荐流中。",
      badge: "系统提醒",
      badgeBg: "#fef3c7",
      badgeColor: "#d97706",
      unread: true,
    },
    {
      id: "4",
      name: "红娘小杨",
      avatar: "💕",
      avatarBg: "#ffe4e6",
      time: "昨天",
      lastMsg: "为您匹配到 2 位嵩明本地单身嘉宾，点击即可查看写真与择偶要求。",
      badge: "相亲牵线",
      badgeBg: "#ffe4e6",
      badgeColor: "#e11d48",
      unread: false,
    },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "#F6F7F9", paddingBottom: "80px" }}>
      <Navbar />

      {/* 顶部 Header */}
      <div style={{ background: "#ffffff", padding: "14px 16px", borderBottom: "1px solid #E5E7EB", position: "sticky", top: 0, zIndex: 10 }}>
        <h1 style={{ fontSize: "18px", fontWeight: "900", color: "#1F2937", margin: 0, letterSpacing: "-0.3px" }}>
          消息中心
        </h1>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "14px 16px" }}>
        
        {/* 顶部四大消息分类金刚区 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "16px" }}>
          {messageTabs.map((tab, idx) => (
            <div
              key={idx}
              style={{
                background: "#ffffff",
                borderRadius: "14px",
                padding: "12px 6px",
                border: "1px solid #E5E7EB",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                position: "relative",
              }}
            >
              {tab.count !== "0" && (
                <span
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "12px",
                    background: "#ef4444",
                    color: "white",
                    fontSize: "10px",
                    fontWeight: "bold",
                    padding: "1px 5px",
                    borderRadius: "10px",
                  }}
                >
                  {tab.count}
                </span>
              )}
              <span style={{ fontSize: "22px", marginBottom: "4px" }}>{tab.icon}</span>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#1F2937" }}>{tab.label}</span>
            </div>
          ))}
        </div>

        {/* 消息对话列表 */}
        <div style={{ background: "#ffffff", borderRadius: "18px", border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "14px", fontWeight: "800", color: "#1F2937" }}>全部私信对话</span>
            <span style={{ fontSize: "12px", color: "#16A67A", fontWeight: "600", cursor: "pointer" }}>全部已读</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {chatList.map((chat) => (
              <div
                key={chat.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "14px 16px",
                  borderBottom: "1px solid #f8fafc",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
              >
                <div
                  style={{
                    width: "46px",
                    height: "46px",
                    borderRadius: "14px",
                    background: chat.avatarBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    flexShrink: 0,
                  }}
                >
                  {chat.avatar}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "14px", fontWeight: "800", color: "#1F2937" }}>{chat.name}</span>
                      <span style={{ fontSize: "10px", fontWeight: "700", background: chat.badgeBg, color: chat.badgeColor, padding: "1px 6px", borderRadius: "6px" }}>
                        {chat.badge}
                      </span>
                    </div>
                    <span style={{ fontSize: "11px", color: "#9CA3AF" }}>{chat.time}</span>
                  </div>

                  <p style={{ margin: 0, fontSize: "13px", color: "#6B7280", lineHeight: "1.4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {chat.lastMsg}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
