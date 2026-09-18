"use client";

import { useEffect, useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";

type AdminUser = {
  id: string;
  username: string;
  nickname?: string | null;
  avatar?: string | null;
  role: "ADMIN" | "EDITOR" | "REVIEWER" | "USER";
  status: string; // ACTIVE | DISABLED
  sessionVersion: number;
  phone?: string | null;
  createdAt: string;
  passwordChangedAt?: string | null;
};

const roleMeta: Record<string, { label: string; desc: string; bg: string; color: string; border: string; icon: string }> = {
  ADMIN: { label: "系统超级管理组", desc: "具备全站全部功能、商业配置、财务结算、管理员增删改查与底层系统控制权限", bg: "#fef2f2", color: "#991b1b", border: "#fecaca", icon: "👑" },
  EDITOR: { label: "运营编辑管理组", desc: "可发布、编辑、置顶便民内容与广告，处理房产/招聘/好店日常运营", bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", icon: "🛡️" },
  REVIEWER: { label: "内容审核管理组", desc: "可查看全站内容与违规举报工单，执行通过/下线/封禁流转", bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0", icon: "💼" },
  USER: { label: "普通注册会员", desc: "前台普通用户，仅具备个人中心与常规便民信息发布权限", bg: "#f8fafc", color: "#475569", border: "#e2e8f0", icon: "👤" },
};

export default function AdminProfilePage() {
  const [activeTab, setActiveTab] = useState<"admins" | "roles" | "password">("admins");
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newNickname, setNewNickname] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPasswordVal, setNewPasswordVal] = useState("");
  const [newRoleVal, setNewRoleVal] = useState<"ADMIN" | "EDITOR" | "REVIEWER">("EDITOR");

  const [passwordTargetUser, setPasswordTargetUser] = useState<AdminUser | null>(null);
  const [resetPasswordInput, setResetPasswordInput] = useState("");

  const [roleTargetUser, setRoleTargetUser] = useState<AdminUser | null>(null);
  const [changeRoleInput, setChangeRoleInput] = useState<"ADMIN" | "EDITOR" | "REVIEWER">("EDITOR");

  // Personal password change
  const [myOldPassword, setMyOldPassword] = useState("");
  const [myNewPassword, setMyNewPassword] = useState("");
  const [myConfirmPassword, setMyConfirmPassword] = useState("");
  const [personalLoading, setPersonalLoading] = useState(false);

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3500);
  };

  const loadAdmins = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/users?adminsOnly=true");
      if (!res.ok) throw new Error("加载管理员数据失败");
      const data = await res.json();
      setAdmins(data.users || []);
    } catch {
      setError("管理员数据加载失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const stats = useMemo(() => {
    const total = admins.length;
    const superAdmins = admins.filter((a) => a.role === "ADMIN").length;
    const editors = admins.filter((a) => a.role === "EDITOR").length;
    const reviewers = admins.filter((a) => a.role === "REVIEWER").length;
    const active = admins.filter((a) => (a.status || "ACTIVE") === "ACTIVE").length;
    return { total, superAdmins, editors, reviewers, active };
  }, [admins]);

  const filteredAdmins = useMemo(() => {
    return admins.filter((a) => {
      const matchesRole = roleFilter === "ALL" || a.role === roleFilter;
      const q = query.toLowerCase().trim();
      const matchesQuery =
        !q ||
        a.username.toLowerCase().includes(q) ||
        (a.nickname && a.nickname.toLowerCase().includes(q)) ||
        (a.phone && a.phone.includes(q));
      return matchesRole && matchesQuery;
    });
  }, [admins, roleFilter, query]);

  // Actions
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPasswordVal.length < 6) {
      setError("密码至少 6 位");
      return;
    }
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername,
          nickname: newNickname,
          phone: newPhone,
          password: newPasswordVal,
          role: newRoleVal,
        }),
      });
      if (res.ok) {
        showMsg("🎉 新管理员已成功添加并分配管理组权限！");
        setShowAddModal(false);
        setNewUsername("");
        setNewNickname("");
        setNewPhone("");
        setNewPasswordVal("");
        loadAdmins();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "添加失败");
      }
    } catch {
      setError("网络请求异常");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTargetUser || resetPasswordInput.length < 6) {
      setError("新密码至少 6 位");
      return;
    }
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: passwordTargetUser.id, newPassword: resetPasswordInput }),
      });
      if (res.ok) {
        showMsg(`🔑 管理员 ${passwordTargetUser.username} 的密码已成功重置！旧会话已强制下线。`);
        setPasswordTargetUser(null);
        setResetPasswordInput("");
        loadAdmins();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "密码重置失败");
      }
    } catch {
      setError("网络请求异常");
    }
  };

  const handleChangeRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleTargetUser) return;
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: roleTargetUser.id, role: changeRoleInput }),
      });
      if (res.ok) {
        showMsg(`🏷️ 管理员 ${roleTargetUser.username} 的管理组已更新为【${roleMeta[changeRoleInput]?.label}】！`);
        setRoleTargetUser(null);
        loadAdmins();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "管理组调整失败");
      }
    } catch {
      setError("网络请求异常");
    }
  };

  const toggleStatus = async (admin: AdminUser) => {
    const nextStatus = (admin.status || "ACTIVE") === "ACTIVE" ? "DISABLED" : "ACTIVE";
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: admin.id, status: nextStatus }),
      });
      if (res.ok) {
        showMsg(nextStatus === "ACTIVE" ? `✅ 管理员 ${admin.username} 已解禁激活` : `🔒 管理员 ${admin.username} 已锁定禁用`);
        loadAdmins();
      }
    } catch {
      setError("网络请求异常");
    }
  };

  const kickSessions = async (admin: AdminUser) => {
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: admin.id, kickSessions: true }),
      });
      if (res.ok) {
        showMsg(`⚡ 已踢出管理员 ${admin.username} 的全设备登录会话（会话版本已递增）`);
        loadAdmins();
      }
    } catch {
      setError("操作失败");
    }
  };

  const handleDeleteAdmin = async (admin: AdminUser) => {
    if (admin.username === "admin") {
      alert("系统主超级管理员账号禁止删除！");
      return;
    }
    if (!window.confirm(`确定要彻底移除管理员【${admin.username}】的管理权限与账号吗？`)) return;
    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: admin.id }),
      });
      if (res.ok) {
        showMsg(`🗑️ 管理员 ${admin.username} 已成功移除`);
        loadAdmins();
      }
    } catch {
      setError("删除失败");
    }
  };

  const handlePersonalPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (myNewPassword.length < 6) {
      setError("新密码长度至少需要 6 位字符");
      return;
    }
    if (myNewPassword !== myConfirmPassword) {
      setError("两次输入的新密码不一致，请核对");
      return;
    }

    setPersonalLoading(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: myOldPassword, newPassword: myNewPassword }),
      });

      if (res.ok) {
        showMsg("🎉 您的个人管理密码已修改成功！旧会话已失效，请使用新密码重新登录。");
        setMyOldPassword("");
        setMyNewPassword("");
        setMyConfirmPassword("");
        setTimeout(() => {
          window.location.href = "/admin/login";
        }, 2000);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "密码修改失败，请核对原密码是否正确");
      }
    } catch {
      setError("网络请求发生异常");
    } finally {
      setPersonalLoading(false);
    }
  };

  return (
    <AdminLayout
      title="🛡️ 网站管理组与全站管理员中心"
      subtitle="集中查看、指派与管理网站所有管理组架构、全量在职管理员账号名单、权限分配、安全改密与设备会话控制。"
    >
      {/* 提示消息条 */}
      {message && (
        <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "12px 18px", borderRadius: "10px", marginBottom: "1.25rem", fontWeight: "700" }}>
          {message}
        </div>
      )}
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "12px 18px", borderRadius: "10px", marginBottom: "1.25rem", fontWeight: "700" }}>
          ⚠️ {error}
        </div>
      )}

      {/* 4 大核心指标卡 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ background: "white", borderRadius: "14px", padding: "1.25rem", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: "12.5px", color: "#64748b", fontWeight: "600", marginBottom: "4px" }}>👥 全体管理员账号</div>
          <div style={{ fontSize: "26px", fontWeight: "900", color: "#0f172a" }}>{stats.total} 位</div>
          <div style={{ fontSize: "11.5px", color: "#10b981", marginTop: "4px" }}>在职运维与管理人员</div>
        </div>

        <div style={{ background: "white", borderRadius: "14px", padding: "1.25rem", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: "12.5px", color: "#991b1b", fontWeight: "600", marginBottom: "4px" }}>👑 超级管理组 (ADMIN)</div>
          <div style={{ fontSize: "26px", fontWeight: "900", color: "#dc2626" }}>{stats.superAdmins} 位</div>
          <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "4px" }}>具备全站最高主控权限</div>
        </div>

        <div style={{ background: "white", borderRadius: "14px", padding: "1.25rem", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: "12.5px", color: "#1d4ed8", fontWeight: "600", marginBottom: "4px" }}>🛡️ 运营与审核组</div>
          <div style={{ fontSize: "26px", fontWeight: "900", color: "#2563eb" }}>{stats.editors + stats.reviewers} 位</div>
          <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "4px" }}>{stats.editors} 位运营 · {stats.reviewers} 位审核</div>
        </div>

        <div style={{ background: "white", borderRadius: "14px", padding: "1.25rem", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: "12.5px", color: "#15803d", fontWeight: "600", marginBottom: "4px" }}>🟢 正常激活状态</div>
          <div style={{ fontSize: "26px", fontWeight: "900", color: "#16a34a" }}>{stats.active} / {stats.total}</div>
          <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "4px" }}>无锁定异常管理员</div>
        </div>
      </div>

      {/* 3 大核心导航选项卡 */}
      <div style={{ display: "flex", gap: "10px", borderBottom: "2px solid #e2e8f0", marginBottom: "1.5rem" }}>
        <button
          onClick={() => setActiveTab("admins")}
          style={{
            padding: "10px 20px",
            border: "none",
            background: "none",
            fontSize: "14.5px",
            fontWeight: "800",
            cursor: "pointer",
            color: activeTab === "admins" ? "#0B7A75" : "#64748b",
            borderBottom: activeTab === "admins" ? "3px solid #0B7A75" : "3px solid transparent",
            marginBottom: "-2px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>👥 全站管理员名单与管理</span>
          <span style={{ fontSize: "12px", background: activeTab === "admins" ? "#ccfbf1" : "#f1f5f9", color: activeTab === "admins" ? "#0f766e" : "#64748b", padding: "1px 7px", borderRadius: "10px" }}>
            {stats.total}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("roles")}
          style={{
            padding: "10px 20px",
            border: "none",
            background: "none",
            fontSize: "14.5px",
            fontWeight: "800",
            cursor: "pointer",
            color: activeTab === "roles" ? "#0B7A75" : "#64748b",
            borderBottom: activeTab === "roles" ? "3px solid #0B7A75" : "3px solid transparent",
            marginBottom: "-2px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>🛡️ 管理组架构与权限范围</span>
          <span style={{ fontSize: "12px", background: "#f1f5f9", color: "#64748b", padding: "1px 7px", borderRadius: "10px" }}>
            4 组
          </span>
        </button>

        <button
          onClick={() => setActiveTab("password")}
          style={{
            padding: "10px 20px",
            border: "none",
            background: "none",
            fontSize: "14.5px",
            fontWeight: "800",
            cursor: "pointer",
            color: activeTab === "password" ? "#0B7A75" : "#64748b",
            borderBottom: activeTab === "password" ? "3px solid #0B7A75" : "3px solid transparent",
            marginBottom: "-2px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>🔑 我的管理员改密</span>
        </button>
      </div>

      {/* TAB 1: 管理员名单与管理 */}
      {activeTab === "admins" && (
        <div>
          {/* 工具栏与新增管理员按钮 */}
          <div
            style={{
              background: "white",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              padding: "1rem 1.25rem",
              marginBottom: "1.25rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            {/* 角色过滤 Tab */}
            <div style={{ display: "inline-flex", background: "#f1f5f9", padding: "4px", borderRadius: "10px", gap: "4px" }}>
              {[
                { key: "ALL", label: `全部管理 (${stats.total})` },
                { key: "ADMIN", label: `👑 超管 (${stats.superAdmins})` },
                { key: "EDITOR", label: `🛡️ 运营 (${stats.editors})` },
                { key: "REVIEWER", label: `💼 审核 (${stats.reviewers})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setRoleFilter(tab.key)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    border: "none",
                    background: roleFilter === tab.key ? "white" : "transparent",
                    color: roleFilter === tab.key ? "#0f172a" : "#64748b",
                    fontWeight: roleFilter === tab.key ? "800" : "600",
                    boxShadow: roleFilter === tab.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 搜索与新增管理员按钮 */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="🔍 搜索管理员账号、昵称、手机..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  outline: "none",
                  minWidth: "240px",
                  background: "#f8fafc",
                }}
              />

              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  background: "#0B7A75",
                  color: "white",
                  border: "none",
                  fontWeight: "800",
                  fontSize: "13.5px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 6px rgba(11, 122, 117, 0.25)",
                }}
              >
                <span>➕</span>
                <span>新增管理员账号</span>
              </button>
            </div>
          </div>

          {/* 管理员详细表格 */}
          <div style={{ background: "white", borderRadius: "14px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div style={{ width: "100%", overflowX: "auto" }}>
              <table style={{ width: "100%", minWidth: "1050px", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: "700" }}>
                    <th style={{ padding: "14px 18px", width: "220px", whiteSpace: "nowrap" }}>管理员账号 / 姓名</th>
                    <th style={{ padding: "14px 18px", width: "200px", whiteSpace: "nowrap" }}>所属管理组与角色</th>
                    <th style={{ padding: "14px 18px", width: "140px", whiteSpace: "nowrap" }}>绑定手机 / 联系</th>
                    <th style={{ padding: "14px 18px", width: "110px", whiteSpace: "nowrap" }}>账号状态</th>
                    <th style={{ padding: "14px 18px", width: "100px", whiteSpace: "nowrap" }}>会话版本</th>
                    <th style={{ padding: "14px 18px", width: "150px", whiteSpace: "nowrap" }}>创建 / 改密时间</th>
                    <th style={{ padding: "14px 18px", textAlign: "right", minWidth: "260px", whiteSpace: "nowrap" }}>权限与账号操作</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "4rem", textAlign: "center", color: "#64748b" }}>
                        ⏳ 正在加载管理员名单...
                      </td>
                    </tr>
                  ) : filteredAdmins.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "4rem", textAlign: "center", color: "#94a3b8" }}>
                        🔍 未检索到匹配的管理员记录
                      </td>
                    </tr>
                  ) : (
                    filteredAdmins.map((admin) => {
                      const meta = roleMeta[admin.role] || roleMeta.USER;
                      const isActive = (admin.status || "ACTIVE") === "ACTIVE";
                      const isSuper = admin.username === "admin";

                      return (
                        <tr
                          key={admin.id}
                          style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "white"; }}
                        >
                          {/* 管理员账号 */}
                          <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div
                                style={{
                                  width: "38px",
                                  height: "38px",
                                  borderRadius: "10px",
                                  background: isSuper ? "linear-gradient(135deg, #ef4444 0%, #991b1b 100%)" : "linear-gradient(135deg, #0B7A75 0%, #044340 100%)",
                                  color: "white",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: "900",
                                  fontSize: "15px",
                                  flexShrink: 0,
                                }}
                              >
                                {isSuper ? "👑" : admin.username.slice(0, 1).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: "800", color: "#0f172a", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span>{admin.username}</span>
                                  {isSuper && (
                                    <span style={{ fontSize: "10.5px", padding: "1px 6px", borderRadius: "4px", background: "#fee2e2", color: "#991b1b", fontWeight: "800" }}>
                                      系统主控
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                                  {admin.nickname || "未设姓名备注"}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 所属管理组 */}
                          <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                            <span
                              style={{
                                padding: "4px 10px",
                                borderRadius: "14px",
                                fontSize: "12px",
                                fontWeight: "800",
                                background: meta.bg,
                                color: meta.color,
                                border: `1px solid ${meta.border}`,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <span>{meta.icon}</span>
                              <span>{meta.label}</span>
                            </span>
                          </td>

                          {/* 绑定手机 */}
                          <td style={{ padding: "14px 18px", color: "#334155", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                            {admin.phone ? admin.phone : "未绑定手机"}
                          </td>

                          {/* 账号状态 */}
                          <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                            <StatusBadge status={admin.status || "ACTIVE"} customLabel={isActive ? "✅ 正常激活" : "🔒 已锁定"} />
                          </td>

                          {/* 会话版本 */}
                          <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                            <span style={{ padding: "2px 8px", borderRadius: "6px", background: "#f1f5f9", color: "#475569", fontSize: "11.5px", fontWeight: "700", fontFamily: "monospace" }}>
                              v{admin.sessionVersion || 1}
                            </span>
                          </td>

                          {/* 创建/改密时间 */}
                          <td style={{ padding: "14px 18px", color: "#64748b", fontSize: "12px", whiteSpace: "nowrap" }}>
                            <div>{new Date(admin.createdAt).toLocaleDateString("zh-CN")}</div>
                            {admin.passwordChangedAt && (
                              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                                改密: {new Date(admin.passwordChangedAt).toLocaleDateString("zh-CN")}
                              </div>
                            )}
                          </td>

                          {/* 权限与账号操作 */}
                          <td style={{ padding: "14px 18px", textAlign: "right", whiteSpace: "nowrap" }}>
                            <div style={{ display: "inline-flex", gap: "6px", justifyContent: "flex-end" }}>
                              {/* 1. 重置密码 */}
                              <button
                                onClick={() => { setPasswordTargetUser(admin); setResetPasswordInput(""); }}
                                style={{
                                  padding: "4px 9px",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: "700",
                                  background: "#f8fafc",
                                  color: "#334155",
                                  border: "1px solid #cbd5e1",
                                  cursor: "pointer",
                                }}
                              >
                                🔑 改密
                              </button>

                              {/* 2. 调整管理组 */}
                              <button
                                onClick={() => { setRoleTargetUser(admin); setChangeRoleInput(admin.role === "USER" ? "EDITOR" : admin.role); }}
                                style={{
                                  padding: "4px 9px",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: "700",
                                  background: "#eff6ff",
                                  color: "#1d4ed8",
                                  border: "1px solid #bfdbfe",
                                  cursor: "pointer",
                                }}
                              >
                                🏷️ 调组
                              </button>

                              {/* 3. 锁定/解禁 (主超管除外) */}
                              {!isSuper && (
                                <button
                                  onClick={() => toggleStatus(admin)}
                                  style={{
                                    padding: "4px 9px",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    background: isActive ? "#fffbeb" : "#ecfdf5",
                                    color: isActive ? "#b45309" : "#15803d",
                                    border: `1px solid ${isActive ? "#fde68a" : "#bbf7d0"}`,
                                    cursor: "pointer",
                                  }}
                                >
                                  {isActive ? "锁定" : "解锁"}
                                </button>
                              )}

                              {/* 4. 踢出设备 */}
                              <button
                                onClick={() => kickSessions(admin)}
                                title="使该管理员所有在线设备登录凭证立即失效"
                                style={{
                                  padding: "4px 9px",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: "700",
                                  background: "#f1f5f9",
                                  color: "#475569",
                                  border: "1px solid #cbd5e1",
                                  cursor: "pointer",
                                }}
                              >
                                ⚡ 踢下线
                              </button>

                              {/* 5. 移除账号 */}
                              {!isSuper && (
                                <button
                                  onClick={() => handleDeleteAdmin(admin)}
                                  style={{
                                    padding: "4px 9px",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    background: "#fef2f2",
                                    color: "#b91c1c",
                                    border: "1px solid #fecaca",
                                    cursor: "pointer",
                                  }}
                                >
                                  移除
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 管理组架构与权限范围 */}
      {activeTab === "roles" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
          {[
            {
              role: "ADMIN",
              title: "👑 系统超级管理组 (SUPER_ADMIN)",
              count: stats.superAdmins,
              desc: "拥有系统全量模块与数据库底层的最高指挥权限，负责关键配置、财务核销与安全运维。",
              perms: [
                "✅ 拥有全站所有页面、API 与配置项最高控制权限",
                "✅ 管理员账号增删改查、权限下发与重置密码",
                "✅ 微信支付商户密钥、API 证书与回调配置",
                "✅ 系统例行关站维护模式切换与紧急停机",
                "✅ 数据库监控、Redis 缓存刷新与全量操作日志审计",
                "✅ 跨模块全量内容与用户数据的物理删除与销户",
              ],
            },
            {
              role: "EDITOR",
              title: "🛡️ 运营编辑管理组 (OPERATOR)",
              count: stats.editors,
              desc: "负责杨林本地便民生态（招聘、房产、好店、活动）的内容编审、置顶推荐与广告运营。",
              perms: [
                "✅ 跨模块内容管理：查看、编辑、通过、下线全站便民内容",
                "✅ 黄金置顶推荐（🔥 置顶）与排序流转",
                "✅ 口碑好店入驻认领审核与商家电话核验",
                "✅ 新闻资讯与同城活动自主发布与编辑",
                "✅ 首页 Banner 与全站广告位运营管理",
                "❌ 无权查看和修改支付私钥及系统底层架构配置",
              ],
            },
            {
              role: "REVIEWER",
              title: "💼 内容审核管理组 (AUDITOR)",
              count: stats.reviewers,
              desc: "负责全站前台内容合规性流转、用户违规举报工单处理与相亲嘉宾实名信息核验。",
              perms: [
                "✅ 全站审核队列流转（待审内容通过 / 驳回 / 下线）",
                "✅ 违规举报工单受理、判定与处理闭环",
                "✅ 相亲交友嘉宾写真、身份证件与联系方式核验",
                "✅ 违规恶意灌水账号临时锁定与警告",
                "❌ 无权进行物理删除内容及修改商业策略",
              ],
            },
            {
              role: "USER",
              title: "👤 普通注册会员 (USER)",
              count: "2,247+",
              desc: "网站注册普通用户，使用前台便民信息发布、相亲牵线与互动功能。",
              perms: [
                "✅ 招聘求职、房屋出租挂牌、二手闲置自主发布",
                "✅ 贴吧社区发帖交流、评论与互动点赞",
                "✅ 个人相亲嘉宾档案登记与红娘牵线申请",
                "✅ 微信一键授权绑定与手机短信核验",
                "❌ 无权访问任何后台控制台页面与管理接口",
              ],
            },
          ].map((r) => {
            const meta = roleMeta[r.role];
            return (
              <div
                key={r.role}
                style={{
                  background: "white",
                  borderRadius: "16px",
                  padding: "1.5rem",
                  border: `1px solid ${meta.border}`,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "900", color: meta.color }}>
                    {r.title}
                  </h3>
                  <span style={{ fontSize: "12px", fontWeight: "800", background: meta.bg, color: meta.color, padding: "2px 8px", borderRadius: "10px", border: `1px solid ${meta.border}` }}>
                    {r.count} 人
                  </span>
                </div>
                <p style={{ fontSize: "12.5px", color: "#64748b", margin: "0 0 1rem 0", lineHeight: "1.5" }}>
                  {r.desc}
                </p>
                <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: "0.75rem", display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                  {r.perms.map((p, idx) => (
                    <div key={idx} style={{ fontSize: "12.5px", color: p.startsWith("✅") ? "#334155" : "#94a3b8", lineHeight: "1.5" }}>
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: 当前个人管理员改密 */}
      {activeTab === "password" && (
        <div style={{ background: "white", padding: "2rem", borderRadius: "16px", border: "1px solid #e2e8f0", maxWidth: "560px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <h3 style={{ margin: "0 0 4px 0", fontSize: "17px", fontWeight: "800", color: "#0f172a" }}>
            🔑 修改我的管理员登录密码
          </h3>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 1.5rem 0" }}>
            提交修改后，您在其他设备上的旧会话将自动失效，请使用新密码重新登录。
          </p>

          <form onSubmit={handlePersonalPasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "13.5px", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
                🔒 当前原密码
              </label>
              <input
                type="password"
                required
                value={myOldPassword}
                onChange={(e) => setMyOldPassword(e.target.value)}
                placeholder="请输入您正在使用的原密码"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13.5px", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
                🔑 设置新密码
              </label>
              <input
                type="password"
                required
                value={myNewPassword}
                onChange={(e) => setMyNewPassword(e.target.value)}
                placeholder="请输入新的登录密码（至少 6 位）"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13.5px", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
                ✅ 再次确认新密码
              </label>
              <input
                type="password"
                required
                value={myConfirmPassword}
                onChange={(e) => setMyConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <button
              type="submit"
              disabled={personalLoading}
              style={{
                background: "#0B7A75",
                color: "white",
                padding: "12px",
                borderRadius: "8px",
                border: "none",
                fontSize: "14px",
                fontWeight: "800",
                cursor: personalLoading ? "not-allowed" : "pointer",
                marginTop: "0.5rem",
              }}
            >
              {personalLoading ? "正在更新中..." : "保存并修改密码"}
            </button>
          </form>
        </div>
      )}

      {/* 模态框 1: 新增管理员账号 */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "white", width: "100%", maxWidth: "500px", borderRadius: "16px", padding: "1.75rem", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "#0f172a" }}>
                ➕ 添加新管理员账号与指派管理组
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ border: "none", background: "none", fontSize: "20px", cursor: "pointer", color: "#94a3b8" }}>✕</button>
            </div>

            <form onSubmit={handleCreateAdmin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  管理员登录账号 *
                </label>
                <input
                  type="text"
                  required
                  placeholder="如 operator_yanglin"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13.5px", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  姓名备注 / 昵称
                </label>
                <input
                  type="text"
                  placeholder="如 杨林专区运营专员"
                  value={newNickname}
                  onChange={(e) => setNewNickname(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13.5px", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  绑定手机号
                </label>
                <input
                  type="text"
                  placeholder="11 位手机号码"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13.5px", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  指派管理组角色 *
                </label>
                <select
                  value={newRoleVal}
                  onChange={(e) => setNewRoleVal(e.target.value as any)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13.5px", background: "white", boxSizing: "border-box" }}
                >
                  <option value="EDITOR">🛡️ 运营编辑管理组 (OPERATOR)</option>
                  <option value="REVIEWER">💼 内容审核管理组 (AUDITOR)</option>
                  <option value="ADMIN">👑 系统超级管理组 (SUPER_ADMIN)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  初始登录密码 *
                </label>
                <input
                  type="password"
                  required
                  placeholder="至少 6 位字符"
                  value={newPasswordVal}
                  onChange={(e) => setNewPasswordVal(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13.5px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ flex: 1, padding: "10px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  style={{ flex: 2, padding: "10px", background: "#0B7A75", color: "white", border: "none", borderRadius: "8px", fontWeight: "800", cursor: "pointer" }}
                >
                  确认添加管理员
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 模态框 2: 重置管理员密码 */}
      {passwordTargetUser && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "white", width: "100%", maxWidth: "440px", borderRadius: "16px", padding: "1.75rem", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 6px 0", fontSize: "17px", fontWeight: "800", color: "#0f172a" }}>
              🔑 重置管理员【{passwordTargetUser.username}】的登录密码
            </h3>
            <p style={{ fontSize: "12.5px", color: "#64748b", margin: "0 0 1.25rem 0" }}>
              重置后，该管理员的所有历史设备登录凭证将立即被强制注销。
            </p>

            <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  输入新登录密码（至少 6 位）
                </label>
                <input
                  type="password"
                  required
                  placeholder="请输入新密码"
                  value={resetPasswordInput}
                  onChange={(e) => setResetPasswordInput(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setPasswordTargetUser(null)}
                  style={{ flex: 1, padding: "10px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  style={{ flex: 2, padding: "10px", background: "#0B7A75", color: "white", border: "none", borderRadius: "8px", fontWeight: "800", cursor: "pointer" }}
                >
                  确认重置密码
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 模态框 3: 调整管理组角色 */}
      {roleTargetUser && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "white", width: "100%", maxWidth: "440px", borderRadius: "16px", padding: "1.75rem", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 6px 0", fontSize: "17px", fontWeight: "800", color: "#0f172a" }}>
              🏷️ 调整【{roleTargetUser.username}】所属管理组
            </h3>
            <p style={{ fontSize: "12.5px", color: "#64748b", margin: "0 0 1.25rem 0" }}>
              变更管理组后，该账号将立即继承目标管理组的全部后台管理权限。
            </p>

            <form onSubmit={handleChangeRole} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  选择目标管理组
                </label>
                <select
                  value={changeRoleInput}
                  onChange={(e) => setChangeRoleInput(e.target.value as any)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13.5px", background: "white", boxSizing: "border-box" }}
                >
                  <option value="ADMIN">👑 系统超级管理组 (SUPER_ADMIN)</option>
                  <option value="EDITOR">🛡️ 运营编辑管理组 (OPERATOR)</option>
                  <option value="REVIEWER">💼 内容审核管理组 (AUDITOR)</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setRoleTargetUser(null)}
                  style={{ flex: 1, padding: "10px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  style={{ flex: 2, padding: "10px", background: "#0B7A75", color: "white", border: "none", borderRadius: "8px", fontWeight: "800", cursor: "pointer" }}
                >
                  保存管理组变更
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
