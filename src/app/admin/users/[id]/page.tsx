"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";

type UserDetail = {
  id: string;
  username: string;
  nickname?: string;
  avatar?: string;
  avatarSource?: string;
  nicknameSource?: string;
  registrationSource?: string;
  wechatAvatar?: string;
  wechatNickname?: string;
  wechatOpenId?: string;
  wechatUnionId?: string;
  phone?: string;
  phoneVerifiedAt?: string;
  role: string;
  status?: string;
  sessionVersion?: number;
  passwordChangedAt?: string;
  createdAt: string;
  lastLoginAt?: string;
  lastActiveAt?: string;
  lastLoginProvider?: string;
  authAccounts?: { provider: string; providerAccountId?: string; createdAt: string; lastLoginAt?: string }[];
  wechatFollower?: {
    openId: string; subscribed: boolean; subscribeTime?: string;
    unsubscribedAt?: string; firstSeenSource?: string; qrScene?: string;
    lastSyncedAt?: string; lastInteractionAt?: string;
  };
  pointAccount?: { balance: number; totalEarned: number };
  _count?: { posts: number; operationLogs: number };
};

const roleLabels: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  ADMIN: { label: "超级管理员", icon: "👑", color: "#1d4ed8", bg: "#eff6ff" },
  EDITOR: { label: "运营编辑", icon: "✍️", color: "#92400e", bg: "#fef3c7" },
  REVIEWER: { label: "内容审核", icon: "🛡️", color: "#6d28d9", bg: "#ede9fe" },
  USER: { label: "普通会员", icon: "👤", color: "#15803d", bg: "#f0fdf4" },
};

const providerLabels: Record<string, string> = {
  PASSWORD: "密码登录",
  WECHAT: "微信授权",
  PHONE: "手机号登录",
  ADMIN: "管理员创建",
};

const sourceLabels: Record<string, string> = {
  PASSWORD: "密码注册",
  WECHAT: "微信注册",
  PHONE: "手机注册",
  ADMIN: "管理创建",
  IMPORT: "老站迁移",
};

function fmt(d?: string) {
  if (!d) return "-";
  return new Date(d).toLocaleString("zh-CN", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [pwModal, setPwModal] = useState(false);
  const [newPw, setNewPw] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/users/${userId}`);
      if (r.status === 401 || r.status === 403) { setError("AUTH_EXPIRED"); return; }
      const d = await r.json();
      if (d.user) setUser(d.user);
      else setError(d.error || "加载失败");
    } catch { setError("请求异常"); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (userId) load(); }, [userId]);

  const adminAction = async (action: string, extra?: Record<string, any>) => {
    setMsg(""); setError("");
    const r = await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action, ...extra }),
    });
    if (r.ok) {
      load();
      return true;
    }
    setError("操作失败");
    return false;
  };

  const resetPassword = async () => {
    if (newPw.length < 6) { setError("密码至少6位"); return; }
    const ok = await adminAction("RESET_PASSWORD", { newPassword: newPw });
    if (ok) { setMsg("✅ 密码已重置"); setPwModal(false); setNewPw(""); }
  };

  const s = {
    section: { background: "white", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "20px", marginBottom: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" } as React.CSSProperties,
    label: { fontSize: "12px", color: "#94a3b8", fontWeight: 600, marginBottom: "4px" } as React.CSSProperties,
    value: { fontSize: "14px", color: "#0f172a", fontWeight: 500, wordBreak: "break-all" as const } as React.CSSProperties,
    row: { display: "grid", gridTemplateColumns: "120px 1fr", gap: "8px", padding: "10px 0", borderBottom: "1px solid #f1f5f9" } as React.CSSProperties,
    chip: (bg: string, color: string) => ({
      display: "inline-flex", alignItems: "center", gap: "4px",
      padding: "3px 10px", borderRadius: "12px", fontSize: "12px",
      fontWeight: 600, background: bg, color,
    }),
    btn: (bg: string, color: string) => ({
      padding: "8px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 600,
      cursor: "pointer", border: "none", background: bg, color,
      display: "inline-flex", alignItems: "center", gap: "5px",
    }),
  };

  if (loading) {
    return <AdminLayout title="用户详情" subtitle="加载中..."><div style={{ textAlign: "center", padding: "4rem", color: "#94a3b8" }}>⏳ 加载中...</div></AdminLayout>;
  }

  if (error === "AUTH_EXPIRED") {
    return (
      <AdminLayout title="用户详情" subtitle="">
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "20px", borderRadius: "12px" }}>
          <strong>⚠️ 登录已过期</strong>
          <a href="/admin/login" style={{ marginLeft: "16px", padding: "8px 16px", background: "#16A67A", color: "white", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" }}>重新登录</a>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return <AdminLayout title="用户详情" subtitle=""><div style={{ textAlign: "center", padding: "4rem", color: "#dc2626" }}>❌ {error || "用户不存在"}</div></AdminLayout>;
  }

  const avatar = user.wechatAvatar || user.avatar;
  const displayName = user.wechatNickname || user.nickname || user.username;
  const initial = (displayName || "用").slice(0, 1).toUpperCase();
  const roleInfo = roleLabels[user.role] || roleLabels.USER;
  const isLocked = user.status === "DISABLED";
  const hasWechat = !!user.wechatOpenId;

  return (
    <AdminLayout title="用户详情" subtitle={`${displayName} 的账号信息`}>
      {msg && <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "12px 18px", borderRadius: "10px", marginBottom: "1rem", fontWeight: 700, fontSize: "13px" }}>{msg}</div>}
      {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "12px 18px", borderRadius: "10px", marginBottom: "1rem", fontWeight: 700, fontSize: "13px" }}>⚠️ {error}</div>}

      {/* 顶部用户概况 */}
      <div style={{ ...s.section, display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
        {avatar ? (
          <img src={avatar} alt="" referrerPolicy="no-referrer"
            style={{ width: "72px", height: "72px", borderRadius: "50%", objectFit: "cover", border: "2px solid #e2e8f0", flexShrink: 0 }} />
        ) : (
          <div style={{
            width: "72px", height: "72px", borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg,#0d9488,#047857)", color: "white",
            display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "24px",
          }}>{initial}</div>
        )}
        <div style={{ flex: 1, minWidth: "200px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
            <span style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>{displayName}</span>
            <span style={s.chip(roleInfo.bg, roleInfo.color)}>{roleInfo.icon} {roleInfo.label}</span>
            <span style={s.chip(isLocked ? "#fef2f2" : "#f0fdf4", isLocked ? "#dc2626" : "#16a34a")}>
              {isLocked ? "🔒 已锁定" : "✅ 正常"}
            </span>
          </div>
          <div style={{ fontSize: "13px", color: "#64748b", fontFamily: "monospace" }}>
            @{user.username}
            {user.phone && <span style={{ marginLeft: "12px" }}>📞 {user.phone}</span>}
          </div>
          <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
            ID: {user.id} · 注册于 {fmt(user.createdAt)}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button onClick={() => router.push("/admin/users")} style={s.btn("#f1f5f9", "#475569")}>← 返回列表</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "16px" }}>
        {/* 基本资料 */}
        <div style={s.section}>
          <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>📋 基本资料</h3>
          <div style={s.row}><div style={s.label}>用户名</div><div style={s.value}>{user.username}</div></div>
          <div style={s.row}><div style={s.label}>昵称</div><div style={s.value}>{user.nickname || "-"} <span style={{ fontSize: "11px", color: "#94a3b8" }}>({user.nicknameSource || "未知"})</span></div></div>
          <div style={s.row}><div style={s.label}>头像来源</div><div style={s.value}>{user.avatarSource || "未设置"}</div></div>
          <div style={s.row}><div style={s.label}>注册来源</div><div style={s.value}>{sourceLabels[user.registrationSource || ""] || user.registrationSource || "未知"}</div></div>
          <div style={s.row}><div style={s.label}>手机号</div><div style={s.value}>{user.phone || "未绑定"} {user.phoneVerifiedAt && <span style={{ fontSize: "11px", color: "#16a34a" }}>✅ 已验证</span>}</div></div>
          <div style={s.row}><div style={s.label}>积分</div><div style={s.value}>{user.pointAccount ? `${user.pointAccount.balance} (累计 ${user.pointAccount.totalEarned})` : "-"}</div></div>
          <div style={{ ...s.row, borderBottom: "none" }}><div style={s.label}>发帖数</div><div style={s.value}>{user._count?.posts ?? "-"}</div></div>
        </div>

        {/* 登录方式 */}
        <div style={s.section}>
          <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>🔐 登录方式</h3>
          {user.authAccounts && user.authAccounts.length > 0 ? (
            user.authAccounts.map((a, i) => (
              <div key={i} style={{ ...s.row, gridTemplateColumns: "1fr" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: "13px", color: "#0f172a" }}>{providerLabels[a.provider] || a.provider}</span>
                    {a.providerAccountId && (
                      <span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "8px", fontFamily: "monospace" }}>
                        {a.providerAccountId.length > 20 ? a.providerAccountId.slice(0, 20) + "..." : a.providerAccountId}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", textAlign: "right" }}>
                    <div>创建: {fmt(a.createdAt)}</div>
                    {a.lastLoginAt && <div>最近: {fmt(a.lastLoginAt)}</div>}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: "#94a3b8", fontSize: "13px", padding: "16px 0" }}>暂无登录方式记录</div>
          )}

          <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
            <div style={s.row}><div style={s.label}>最近登录</div><div style={s.value}>{fmt(user.lastLoginAt)}</div></div>
            <div style={s.row}><div style={s.label}>最近活跃</div><div style={s.value}>{fmt(user.lastActiveAt)}</div></div>
            <div style={{ ...s.row, borderBottom: "none" }}><div style={s.label}>上次方式</div><div style={s.value}>{providerLabels[user.lastLoginProvider || ""] || user.lastLoginProvider || "-"}</div></div>
          </div>
        </div>

        {/* 微信信息 */}
        <div style={s.section}>
          <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>💬 微信信息</h3>
          {hasWechat ? (
            <>
              <div style={s.row}><div style={s.label}>微信昵称</div><div style={s.value}>{user.wechatNickname || "未获取"}</div></div>
              <div style={s.row}><div style={s.label}>OpenID</div><div style={{ ...s.value, fontFamily: "monospace", fontSize: "12px" }}>{user.wechatOpenId}</div></div>
              {user.wechatUnionId && <div style={s.row}><div style={s.label}>UnionID</div><div style={{ ...s.value, fontFamily: "monospace", fontSize: "12px" }}>{user.wechatUnionId}</div></div>}
              <div style={s.row}><div style={s.label}>微信头像</div><div style={s.value}>{user.wechatAvatar ? "✅ 已获取" : "❌ 未获取"}</div></div>

              {user.wechatFollower ? (
                <>
                  <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#475569", marginBottom: "8px" }}>公众号关注状态</div>
                  </div>
                  <div style={s.row}><div style={s.label}>关注状态</div>
                    <div style={s.value}>
                      <span style={s.chip(
                        user.wechatFollower.subscribed ? "#f0fdf4" : "#fef2f2",
                        user.wechatFollower.subscribed ? "#15803d" : "#dc2626"
                      )}>
                        {user.wechatFollower.subscribed ? "✅ 已关注" : "❌ 已取消关注"}
                      </span>
                    </div>
                  </div>
                  <div style={s.row}><div style={s.label}>关注时间</div><div style={s.value}>{fmt(user.wechatFollower.subscribeTime)}</div></div>
                  {user.wechatFollower.unsubscribedAt && <div style={s.row}><div style={s.label}>取关时间</div><div style={s.value}>{fmt(user.wechatFollower.unsubscribedAt)}</div></div>}
                  {user.wechatFollower.qrScene && <div style={s.row}><div style={s.label}>来源渠道</div><div style={s.value}>{user.wechatFollower.qrScene}</div></div>}
                  <div style={{ ...s.row, borderBottom: "none" }}><div style={s.label}>首次来源</div><div style={s.value}>{user.wechatFollower.firstSeenSource || "-"}</div></div>
                </>
              ) : (
                <div style={{ color: "#94a3b8", fontSize: "13px", padding: "8px 0" }}>无公众号关注记录</div>
              )}
            </>
          ) : (
            <div style={{ color: "#94a3b8", fontSize: "13px", padding: "16px 0", textAlign: "center" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>📵</div>
              未绑定微信账号
            </div>
          )}
        </div>

        {/* 安全操作 */}
        <div style={s.section}>
          <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>⚙️ 账号操作</h3>

          <div style={s.row}><div style={s.label}>Session 版本</div><div style={s.value}>{user.sessionVersion || 1}</div></div>
          <div style={{ ...s.row, borderBottom: "none" }}><div style={s.label}>密码修改时间</div><div style={s.value}>{fmt(user.passwordChangedAt)}</div></div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
            <button onClick={() => { setPwModal(true); setNewPw(""); }} style={s.btn("#f1f5f9", "#0f172a")}>
              🔑 重置密码
            </button>
            <button
              onClick={async () => {
                const ok = await adminAction("TOGGLE_STATUS", { status: isLocked ? "ACTIVE" : "DISABLED" });
                if (ok) setMsg(`✅ 已${isLocked ? "解锁" : "锁定"}用户`);
              }}
              style={s.btn(isLocked ? "#f0fdf4" : "#fff7ed", isLocked ? "#15803d" : "#c2410c")}
            >
              {isLocked ? "🔓 解锁账号" : "🔒 锁定账号"}
            </button>
            <button
              onClick={async () => {
                const ok = await adminAction("REVOKE_SESSION");
                if (ok) setMsg("✅ 已强制登出所有设备");
              }}
              style={s.btn("#fef2f2", "#dc2626")}
            >
              ⚡ 强制登出所有设备
            </button>
          </div>
        </div>
      </div>

      {/* 重置密码弹窗 */}
      {pwModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div style={{ background: "white", borderRadius: "16px", padding: "1.5rem", width: "100%", maxWidth: "420px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>🔑 重置密码</h3>
            <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#64748b" }}>
              为「<b>{displayName}</b>」重置密码，旧 Session 将失效。
            </p>
            <input type="text" placeholder="新密码（至少6位）" value={newPw} onChange={e => setNewPw(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", marginBottom: "16px" }} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={() => setPwModal(false)}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "white", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>取消</button>
              <button onClick={resetPassword}
                style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "#16A67A", color: "white", cursor: "pointer", fontSize: "13px", fontWeight: 700 }}>确认重置</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
