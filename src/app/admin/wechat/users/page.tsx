"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

export default function WeChatUsersPage() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    currentFollowers: 0,
    linkedFollowers: 0,
    unlinkedFollowers: 0,
    notFollowingUsers: 0,
    boundPhoneCount: 0,
    totalRecords: 0,
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fetchUsers = async (p = page, s = search) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/wechat/sync?page=${p}&limit=15&search=${encodeURIComponent(s)}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setStats({
          currentFollowers: data.stats?.currentFollowers ?? 0,
          linkedFollowers: data.stats?.linkedFollowers ?? 0,
          unlinkedFollowers: data.stats?.unlinkedFollowers ?? 0,
          notFollowingUsers: data.stats?.notFollowingUsers ?? 0,
          boundPhoneCount: data.stats?.boundPhoneCount ?? 0,
          totalRecords: data.stats?.totalRecords ?? 0,
        });
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch {
      setError("获取微信粉丝列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page, search);
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(1, search);
  };

  const handleSyncAll = async () => {
    setConfirmOpen(false);
    setSyncing(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/admin/wechat/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(data.message);
        fetchUsers(1, search);
      } else {
        setError(data.error || "同步失败，请检查微信配置");
      }
    } catch {
      setError("网络错误，微信粉丝同步请求失败");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <AdminLayout
      title="🟢 微信公众号关注状态"
      subtitle="关注公众号与网站授权登录分别记录，数据来自微信官方关注名单和事件通知。"
      actionButton={
        <button
          onClick={() => setConfirmOpen(true)}
          disabled={syncing}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 18px",
            background: syncing ? "#94a3b8" : "linear-gradient(135deg, #07c160 0%, #059669 100%)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "700",
            fontSize: "13.5px",
            cursor: syncing ? "not-allowed" : "pointer",
            boxShadow: "0 2px 8px rgba(7, 193, 96, 0.25)",
          }}
        >
          <span>{syncing ? "⏳ 正在核对关注状态..." : "🔄 全量核对关注状态"}</span>
        </button>
      }
    >
      <div>
        {/* 提示消息 */}
        {message && (
          <div style={{ padding: "12px 16px", background: "#f0fdf4", border: "1px solid #86efac", color: "#166534", borderRadius: "8px", marginBottom: "1.25rem", fontSize: "13.5px", fontWeight: "600" }}>
            ✅ {message}
          </div>
        )}
        {error && (
          <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: "8px", marginBottom: "1.25rem", fontSize: "13.5px" }}>
            ⚠️ {error}
          </div>
        )}

        {/* 顶部数据看板 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>🟢 当前已关注</div>
            <div style={{ fontSize: "26px", fontWeight: "900", color: "#07c160", marginTop: "4px" }}>
              {Number(stats.currentFollowers).toLocaleString()} <span style={{ fontSize: "13px", fontWeight: "normal", color: "#64748b" }}>人</span>
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>最近一次官方名单核对结果</div>
          </div>

          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>🔗 已关联网站会员</div>
            <div style={{ fontSize: "26px", fontWeight: "900", color: "#0f172a", marginTop: "4px" }}>
              {Number(stats.linkedFollowers).toLocaleString()} <span style={{ fontSize: "13px", fontWeight: "normal", color: "#64748b" }}>人</span>
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>同时已关注并拥有网站账号</div>
          </div>

          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>🔐 已授权但未关注</div>
            <div style={{ fontSize: "26px", fontWeight: "900", color: "#3b82f6", marginTop: "4px" }}>
              {Number(stats.notFollowingUsers).toLocaleString()} <span style={{ fontSize: "13px", fontWeight: "normal", color: "#64748b" }}>人</span>
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>登录成功，但不可按粉丝发送通知</div>
          </div>

          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>📇 仅公众号粉丝</div>
            <div style={{ fontSize: "26px", fontWeight: "900", color: "#7c3aed", marginTop: "4px" }}>
              {Number(stats.unlinkedFollowers).toLocaleString()} <span style={{ fontSize: "13px", fontWeight: "normal", color: "#64748b" }}>人</span>
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>已关注，尚未登录或绑定网站账号</div>
          </div>
        </div>

        {/* 筛选与搜索栏 */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1rem", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px", flex: 1, maxWidth: "460px" }}>
            <input
              type="text"
              placeholder="搜索 OpenID、昵称、用户名或绑定手机号..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13.5px" }}
            />
            <button
              type="submit"
              style={{ padding: "8px 16px", background: "#0B7A75", color: "white", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}
            >
              搜索
            </button>
          </form>

          <div style={{ fontSize: "13px", color: "#64748b" }}>
            共 <b>{stats.totalRecords}</b> 条微信身份记录
          </div>
        </div>

        {/* 粉丝列表 DataTable */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                  <th style={{ padding: "12px 16px" }}>用户资料</th>
                  <th style={{ padding: "12px 16px" }}>微信 OpenID</th>
                  <th style={{ padding: "12px 16px" }}>绑定手机</th>
                  <th style={{ padding: "12px 16px" }}>积分账户</th>
                  <th style={{ padding: "12px 16px" }}>关注状态</th>
                  <th style={{ padding: "12px 16px" }}>关注/注册时间</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
                      ⏳ 正在加载微信用户数据...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>
                      暂无微信身份记录，请点击右上角<b>【全量核对关注状态】</b>。
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const displayName = u.nickname || u.username || "微信用户";
                    const initialChar = (displayName || "微").slice(0, 1).toUpperCase();
                    return (
                      <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            {u.avatar ? (
                              <img
                                src={u.avatar}
                                alt=""
                                style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", background: "#f1f5f9" }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "50%",
                                  background: "linear-gradient(135deg, #07c160 0%, #059669 100%)",
                                  color: "white",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: "800",
                                  fontSize: "13px",
                                  flexShrink: 0,
                                  boxShadow: "0 2px 5px rgba(7, 193, 96, 0.2)",
                                }}
                              >
                                {initialChar}
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: "700", color: "#0f172a" }}>
                                {displayName}
                              </div>
                              <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                                {u.username ? `网站账号: ${u.username}` : "仅公众号档案，未关联网站账号"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: "12px", color: "#475569" }}>
                          {u.wechatOpenId ? (
                            <span style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>
                              {`${u.wechatOpenId.slice(0, 7)}…${u.wechatOpenId.slice(-5)}`}
                            </span>
                          ) : (
                            <span style={{ color: "#cbd5e1" }}>未绑定</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#334155" }}>
                          {u.phone || <span style={{ color: "#94a3b8", fontSize: "12px" }}>未绑定手机</span>}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ color: "#d97706", fontWeight: "700", background: "#fef3c7", padding: "2px 8px", borderRadius: "12px", fontSize: "12px" }}>
                            💎 {u.pointBalance || 0} 积分
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ color: u.subscribed ? "#166534" : "#9a3412", background: u.subscribed ? "#dcfce7" : "#ffedd5", padding: "2px 8px", borderRadius: "12px", fontSize: "11.5px", fontWeight: "700" }}>
                            {u.subscribed ? "✅ 已关注" : u.unsubscribedAt ? "↩ 已取消关注" : "⚠️ 仅授权/未关注"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", color: "#64748b", fontSize: "12.5px" }}>
                          {u.subscribeTime
                            ? `关注：${new Date(u.subscribeTime).toLocaleDateString("zh-CN")}`
                            : u.registeredAt
                              ? `注册：${new Date(u.registeredAt).toLocaleDateString("zh-CN")}`
                              : "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 分页控制栏 */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: "1px solid #e2e8f0", fontSize: "13px", color: "#64748b" }}>
              <span>第 {page} / {totalPages} 页</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  style={{ padding: "4px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "white", cursor: page <= 1 ? "not-allowed" : "pointer" }}
                >
                  上一页
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  style={{ padding: "4px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "white", cursor: page >= totalPages ? "not-allowed" : "pointer" }}
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 同步确认模态框 */}
        <ConfirmDialog
          isOpen={confirmOpen}
          title="确认全量核对公众号关注状态？"
          description="系统将从微信官方接口拉取完整关注名单，更新已关注、已取消关注和账号关联状态。此操作不会批量创建网站会员，也不会批量赠送积分。"
          confirmText="立即核对"
          onConfirm={handleSyncAll}
          onCancel={() => setConfirmOpen(false)}
        />
      </div>
    </AdminLayout>
  );
}
