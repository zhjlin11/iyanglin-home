import React from "react";

interface IdentityChannelsCardProps {
  user: {
    username: string;
    nickname?: string;
    phone?: string | null;
    role: string;
    createdAt: string;
    wechatBound?: boolean;
    wechatNickname?: string | null;
    wechatAvatar?: string | null;
    officialAccountFollowStatus?: "FOLLOWED" | "NOT_FOLLOWED" | "UNKNOWN" | string;
    wechatSubscribed?: boolean;
  } | null;
}

export default function IdentityChannelsCard({ user }: IdentityChannelsCardProps) {
  if (!user) return null;

  const roleText =
    user.role === "ADMIN"
      ? "系统管理员"
      : user.role === "EDITOR"
      ? "运营编辑"
      : "注册会员";

  const registerDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "早期会员";

  const isWechatBound = Boolean(user.wechatBound);
  const isFollowed =
    user.officialAccountFollowStatus === "FOLLOWED" || Boolean(user.wechatSubscribed);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px" }}>
      {/* 标题 */}
      <div>
        <h3
          style={{
            margin: "0 0 4px 0",
            fontSize: "16px",
            fontWeight: "800",
            color: "#0F172A",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>🆔</span> 账号身份与微信生态服务状态
        </h3>
        <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>
          清晰界定网站会员、微信绑定、服务号通知与视频号独立体系，保障您的账号权益与隐私透明
        </p>
      </div>

      {/* 4 栏网格卡片 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "14px",
        }}
      >
        {/* ① 网站会员身份 */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "14px",
            border: "1px solid #E2E8F0",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#0F172A" }}>
                ① 网站会员身份
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  background: "#EFF6FF",
                  color: "#2563EB",
                }}
              >
                {roleText}
              </span>
            </div>
            <div style={{ fontSize: "12px", color: "#475569", lineHeight: "1.8" }}>
              <div>登录账号：<b style={{ fontFamily: "monospace", color: "#1E293B" }}>{user.username}</b></div>
              <div>绑定手机：<b style={{ color: "#1E293B" }}>{user.phone || "未设置手机号"}</b></div>
              <div>注册时间：<span>{registerDate}</span></div>
            </div>
          </div>
          <div
            style={{
              marginTop: "12px",
              paddingTop: "8px",
              borderTop: "1px solid #F1F5F9",
              fontSize: "11px",
              color: "#16A34A",
              fontWeight: "600",
            }}
          >
            ✓ 基础账户功能正常可用
          </div>
        </div>

        {/* ② 微信绑定状态 */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "14px",
            border: isWechatBound ? "1.5px solid #86EFAC" : "1px solid #E2E8F0",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: isWechatBound ? "0 2px 8px rgba(34,197,94,0.08)" : "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#0F172A" }}>
                ② 微信账号绑定
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  background: isWechatBound ? "#DCFCE7" : "#F1F5F9",
                  color: isWechatBound ? "#15803D" : "#64748B",
                }}
              >
                {isWechatBound ? "● 已绑定" : "○ 未绑定"}
              </span>
            </div>
            <div style={{ fontSize: "12px", color: "#475569", lineHeight: "1.8" }}>
              <div>微信昵称：<b style={{ color: "#1E293B" }}>{user.wechatNickname || "未同步"}</b></div>
              <div>快捷登录：<span>{isWechatBound ? "已支持微信扫码免密登录" : "未开启"}</span></div>
              <div style={{ color: "#94A3B8", fontSize: "11px" }}>
                (注：用户OpenID为后台隔离存储，不外显)
              </div>
            </div>
          </div>
          <div
            style={{
              marginTop: "12px",
              paddingTop: "8px",
              borderTop: "1px solid #F1F5F9",
              fontSize: "11px",
              color: isWechatBound ? "#15803D" : "#64748B",
              fontWeight: "600",
            }}
          >
            {isWechatBound ? "✓ 账号关联安全完成" : "可前往微信端直接扫码关联"}
          </div>
        </div>

        {/* ③ 微信公众号服务状态 */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "14px",
            border: isFollowed ? "1.5px solid #93C5FD" : "1px solid #E2E8F0",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: isFollowed ? "0 2px 8px rgba(59,130,246,0.08)" : "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#0F172A" }}>
                ③ 微信公众号服务
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  background: isFollowed ? "#DBEAFE" : "#FEF3C7",
                  color: isFollowed ? "#1D4ED8" : "#B45309",
                }}
              >
                {isFollowed ? "● 已关注服务号" : "○ 建议关注"}
              </span>
            </div>
            <div style={{ fontSize: "12px", color: "#475569", lineHeight: "1.8" }}>
              <div>官方账号：<b style={{ color: "#1E293B" }}>杨林生活网 (服务号)</b></div>
              <div>消息通知：<span style={{ color: isFollowed ? "#16A34A" : "#D97706", fontWeight: "600" }}>{isFollowed ? "已开启实时服务提醒" : "关注后可接收审核与订单提醒"}</span></div>
              <div style={{ color: "#94A3B8", fontSize: "11px" }}>
                用于求职简历、发布审核通过、金币充值变动通知
              </div>
            </div>
          </div>
          <div
            style={{
              marginTop: "12px",
              paddingTop: "8px",
              borderTop: "1px solid #F1F5F9",
              fontSize: "11px",
              color: isFollowed ? "#1D4ED8" : "#B45309",
              fontWeight: "600",
            }}
          >
            {isFollowed ? "✓ 微信通知服务畅通" : "微信搜索「杨林生活网」关注开启通知"}
          </div>
        </div>

        {/* ④ 视频号特别声明 */}
        <div
          style={{
            background: "#F8FAFC",
            borderRadius: "14px",
            border: "1px dashed #CBD5E1",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>
                ④ 视频号官方规范说明
              </span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  padding: "2px 6px",
                  borderRadius: "8px",
                  background: "#E2E8F0",
                  color: "#475569",
                }}
              >
                官方声明
              </span>
            </div>
            <div style={{ fontSize: "11.5px", color: "#64748B", lineHeight: "1.6" }}>
              微信视频号为微信官方闭环产品，腾讯未向任何第三方网站开放关注状态查询接口。
              <div style={{ marginTop: "4px", color: "#0F172A", fontWeight: "600" }}>
                杨林生活网严格合规：绝不将视频号关注作为收费门槛、发布审核或权限验证依据。
              </div>
            </div>
          </div>
          <div
            style={{
              marginTop: "12px",
              paddingTop: "8px",
              borderTop: "1px solid #E2E8F0",
              fontSize: "11px",
              color: "#64748B",
            }}
          >
            🛡️ 平台合规运营声明
          </div>
        </div>
      </div>
    </div>
  );
}
