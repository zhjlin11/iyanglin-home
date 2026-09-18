"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/admin/DataTable";

type Order = {
  id: string;
  orderNo: string;
  planName: string;
  targetKind: string;
  targetTitle: string;
  amountCents: number;
  status: "PENDING_PAYMENT" | "PAID" | "CANCELLED" | "REFUNDED";
  createdAt: string;
  transactionId?: string | null;
  refundNo?: string | null;
  wechatRefundId?: string | null;
  refundReason?: string | null;
  user?: { id: string; username?: string; nickname?: string; phone?: string } | null;
};

const KIND_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  shop: { label: "好店推广", color: "#0369a1", bg: "#e0f2fe" },
  coin: { label: "金币充值", color: "#a16207", bg: "#fef9c3" },
  dating_photo: { label: "相亲写真", color: "#be185d", bg: "#fce7f3" },
  membership: { label: "会员套餐", color: "#7c3aed", bg: "#ede9fe" },
  job: { label: "招聘推广", color: "#059669", bg: "#d1fae5" },
  house: { label: "房源推广", color: "#d97706", bg: "#fef3c7" },
  listing: { label: "信息推广", color: "#4f46e5", bg: "#e0e7ff" },
};

function getKindInfo(kind: string) {
  return KIND_LABELS[kind] || { label: kind.toUpperCase(), color: "#64748b", bg: "#f1f5f9" };
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${min}`;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("all");
  const [kindFilter, setKindFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // 原路退款弹窗状态
  const [refundOrder, setRefundOrder] = useState<Order | null>(null);
  const [refundReason, setRefundReason] = useState("用户申请退款 / 业务冲正");
  const [refunding, setRefunding] = useState(false);

  const load = async () => {
    setError("");
    const response = await fetch("/api/admin/orders");
    if (!response.ok) {
      const fallback = await fetch("/api/orders");
      if (!fallback.ok) {
        setError("订单加载失败，请确认当前账号权限。");
        return;
      }
      const d = await fallback.json();
      setOrders(d.orders || []);
      return;
    }
    const data = await response.json();
    setOrders(data.orders || []);
  };

  useEffect(() => {
    load();
  }, []);

  // Stats
  const stats = useMemo(() => {
    const total = orders.length;
    const paid = orders.filter((o) => o.status === "PAID").length;
    const pending = orders.filter((o) => o.status === "PENDING_PAYMENT").length;
    const refunded = orders.filter((o) => o.status === "REFUNDED").length;
    const totalPaid = orders
      .filter((o) => o.status === "PAID")
      .reduce((s, o) => s + o.amountCents, 0);
    return { total, paid, pending, refunded, totalPaid };
  }, [orders]);

  const visible = useMemo(
    () =>
      orders.filter(
        (order) =>
          (filter === "all" || order.status === filter) &&
          (kindFilter === "all" || order.targetKind === kindFilter) &&
          `${order.orderNo} ${order.planName} ${order.targetTitle} ${order.targetKind} ${order.transactionId || ""}`
            .toLowerCase()
            .includes(query.toLowerCase().trim()),
      ),
    [orders, filter, kindFilter, query],
  );

  const updateStatus = async (id: string, action: string) => {
    setMessage("");
    setError("");
    const confirmed = window.confirm(
      `确认执行订单状态更新吗？入账后目标便民内容将实时开启置顶权益！`,
    );
    if (!confirmed) return;

    const response = await fetch("/api/admin/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: id, action }),
    });

    if (!response.ok) {
      setError("订单状态更新失败。");
      return;
    }

    setMessage("订单状态更新成功，对应内容置顶权益已实时生效！");
    await load();
  };

  const handleOpenRefund = (o: Order) => {
    setRefundOrder(o);
    setRefundReason("用户申请退款 / 业务冲正");
  };

  const handleConfirmRefund = async () => {
    if (!refundOrder) return;
    setRefunding(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: refundOrder.id,
          action: "REFUND",
          reason: refundReason.trim() || "管理员后台发起退款",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "退款失败");
      }
      setMessage(data.message || "订单退款成功，对应业务权益已实时冲正回收！");
      setRefundOrder(null);
      await load();
    } catch (err: any) {
      setError(err.message || "退款处理异常");
    } finally {
      setRefunding(false);
    }
  };

  const columns: Column<Order>[] = [
    {
      key: "orderNo",
      header: "订单信息",
      render: (o) => {
        const ki = getKindInfo(o.targetKind);
        return (
          <div>
            <div style={{ fontWeight: "bold", color: "#0f172a", fontSize: "13px" }}>
              {o.orderNo}
            </div>
            <div
              style={{
                display: "inline-block",
                marginTop: "4px",
                padding: "2px 8px",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 600,
                color: ki.color,
                background: ki.bg,
              }}
            >
              {ki.label}
            </div>
            {o.transactionId && (
              <div
                style={{
                  fontSize: "11px",
                  color: "#059669",
                  marginTop: "3px",
                  fontFamily: "monospace",
                }}
                title={`微信交易号: ${o.transactionId}`}
              >
                微信单号: {o.transactionId.length > 18 ? o.transactionId.slice(0, 10) + "..." + o.transactionId.slice(-6) : o.transactionId}
              </div>
            )}
            {o.refundNo && (
              <div
                style={{
                  fontSize: "11px",
                  color: "#dc2626",
                  marginTop: "2px",
                  fontFamily: "monospace",
                }}
              >
                退款单: {o.refundNo}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "targetTitle",
      header: "购买内容",
      render: (o) => (
        <div>
          <div style={{ fontSize: "13px", fontWeight: "bold", color: "#1e293b" }}>
            {o.targetTitle}
          </div>
          <div style={{ fontSize: "12px", color: "#0369a1", marginTop: "2px" }}>
            套餐：{o.planName}
          </div>
        </div>
      ),
    },
    {
      key: "user",
      header: "下单用户",
      width: "130px",
      render: (o) => {
        const u = o.user;
        if (!u) return <span style={{ fontSize: "12px", color: "#94a3b8" }}>未记录</span>;
        const phone = u.phone ? u.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2") : "";
        const isPhoneLike = (s: string) => /^\d{11}$/.test(s) || /^\d{3}\*{4}\d{4}$/.test(s) || /^phone_/.test(s);
        const displayName = u.nickname && !isPhoneLike(u.nickname) ? u.nickname : (u.username && !isPhoneLike(u.username) ? u.username : null);
        return (
          <div>
            {displayName && <div style={{ fontSize: "13px", fontWeight: 500, color: "#1e293b" }}>{displayName}</div>}
            {phone && <div style={{ fontSize: displayName ? "11px" : "13px", color: displayName ? "#94a3b8" : "#1e293b", fontWeight: displayName ? 400 : 500 }}>{phone}</div>}
            {!displayName && !phone && <span style={{ fontSize: "12px", color: "#94a3b8" }}>{u.username || "匿名"}</span>}
          </div>
        );
      },
    },
    {
      key: "amountCents",
      header: "金额",
      width: "100px",
      render: (o) => (
        <span style={{ fontWeight: "bold", color: "#0B7A75", fontSize: "14px" }}>
          ¥{(o.amountCents / 100).toFixed(2)}
        </span>
      ),
    },
    {
      key: "status",
      header: "状态",
      width: "110px",
      render: (o) => <StatusBadge status={o.status} />,
    },
    {
      key: "createdAt",
      header: "创建时间",
      width: "150px",
      render: (o) => (
        <span style={{ fontSize: "12px", color: "#64748b" }}>{formatTime(o.createdAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "操作",
      width: "140px",
      render: (o) => (
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          {o.status === "PENDING_PAYMENT" && (
            <button
              onClick={() => updateStatus(o.id, "CONFIRM_PAID")}
              style={{
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "12px",
                background: "#10b981",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              确认入账
            </button>
          )}
          {o.status === "PAID" && (
            <button
              onClick={() => handleOpenRefund(o)}
              style={{
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "12px",
                background: "#fee2e2",
                color: "#dc2626",
                border: "1px solid #fecaca",
                cursor: "pointer",
                fontWeight: 600,
                transition: "all 0.15s",
              }}
              title="原路退款至微信账户并自动冲正回收业务权益"
            >
              ↩️ 原路退款
            </button>
          )}
          {o.status === "REFUNDED" && (
            <span style={{ fontSize: "12px", color: "#ef4444", fontWeight: 500 }}>
              已退款
            </span>
          )}
          {o.status === "CANCELLED" && (
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>—</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminLayout
      title="💳 订单与收益管理"
      subtitle="管理全站付费订单，包含金币充值、相亲写真解锁、好店推广置顶、会员套餐等。"
      actionButton={
        <a
          href="/admin/billing"
          className="button button-secondary"
          style={{
            padding: "6px 14px",
            borderRadius: "8px",
            textDecoration: "none",
            fontSize: "13px",
          }}
        >
          ⚙️ 收费配置
        </a>
      }
    >
      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "1rem 1.25rem",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ fontSize: "12px", color: "#64748b" }}>总订单数</div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#0f172a" }}>
            {stats.total}
          </div>
        </div>
        <div
          style={{
            background: "white",
            padding: "1rem 1.25rem",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ fontSize: "12px", color: "#64748b" }}>已支付</div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#10b981" }}>
            {stats.paid}
          </div>
        </div>
        <div
          style={{
            background: "white",
            padding: "1rem 1.25rem",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ fontSize: "12px", color: "#64748b" }}>待支付</div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#f59e0b" }}>
            {stats.pending}
          </div>
        </div>
        <div
          style={{
            background: "white",
            padding: "1rem 1.25rem",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ fontSize: "12px", color: "#64748b" }}>已退款</div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#ef4444" }}>
            {stats.refunded}
          </div>
        </div>
        <div
          style={{
            background: "white",
            padding: "1rem 1.25rem",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ fontSize: "12px", color: "#64748b" }}>已收金额</div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#0B7A75" }}>
            ¥{(stats.totalPaid / 100).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      <div
        style={{
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          color: "#166534",
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "1.5rem",
          fontSize: "13px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span style={{ fontSize: "16px" }}>⚡</span>
        <div>
          <b>支付与退款系统说明：</b>{" "}
          全站订单已深度对接真实微信支付回调与【原路退款】引擎。对「已支付」订单点击【原路退款】即可触发退款核销流程，系统将自动冲正回收充值金币或下线置顶权益，杜绝恶意刷单。
        </div>
      </div>

      {message && (
        <div className="notice-success" style={{ marginBottom: "1rem" }}>
          {message}
        </div>
      )}
      {error && (
        <div className="notice-error" style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {/* Filter Bar */}
      <div
        style={{
          background: "white",
          padding: "1.25rem",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          marginBottom: "1.5rem",
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1, minWidth: "200px" }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索订单号、微信交易号、套餐或内容..."
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              outline: "none",
            }}
          />
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            outline: "none",
          }}
        >
          <option value="all">全部状态</option>
          <option value="PAID">已支付</option>
          <option value="PENDING_PAYMENT">待支付</option>
          <option value="REFUNDED">已退款</option>
          <option value="CANCELLED">已取消</option>
        </select>

        <select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            outline: "none",
          }}
        >
          <option value="all">全部类型</option>
          <option value="coin">金币充值</option>
          <option value="dating_photo">相亲写真</option>
          <option value="shop">好店推广</option>
          <option value="membership">会员套餐</option>
          <option value="job">招聘推广</option>
          <option value="house">房源推广</option>
          <option value="listing">信息推广</option>
        </select>

        <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "bold" }}>
          共 {visible.length} 条
        </span>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={visible}
        keyExtractor={(o) => o.id}
        emptyText="暂无匹配的订单记录"
      />

      {/* Refund Confirmation Modal */}
      {refundOrder && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "24px",
              maxWidth: "500px",
              width: "100%",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: "#0f172a" }}>
                ↩️ 发起原路退款与权益冲正
              </div>
              <button
                onClick={() => setRefundOrder(null)}
                disabled={refunding}
                style={{
                  border: "none",
                  background: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#94a3b8",
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                background: "#f8fafc",
                borderRadius: "10px",
                padding: "14px",
                marginBottom: "16px",
                border: "1px solid #e2e8f0",
                fontSize: "13px",
                lineHeight: "1.6",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: "#64748b" }}>订单号：</span>
                <span style={{ fontWeight: 600, color: "#1e293b", fontFamily: "monospace" }}>{refundOrder.orderNo}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: "#64748b" }}>购买项目：</span>
                <span style={{ fontWeight: 500, color: "#1e293b" }}>{refundOrder.targetTitle} ({refundOrder.planName})</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: "#64748b" }}>退款金额：</span>
                <span style={{ fontWeight: "bold", color: "#dc2626", fontSize: "15px" }}>¥{(refundOrder.amountCents / 100).toFixed(2)}</span>
              </div>
              {refundOrder.transactionId && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>微信交易号：</span>
                  <span style={{ fontWeight: 500, color: "#059669", fontFamily: "monospace" }}>{refundOrder.transactionId}</span>
                </div>
              )}
            </div>

            <div
              style={{
                background: "#fff7ed",
                border: "1px solid #fed7aa",
                borderRadius: "8px",
                padding: "10px 12px",
                marginBottom: "16px",
                fontSize: "12px",
                color: "#c2410c",
                lineHeight: "1.5",
              }}
            >
              <b>⚠️ 权益冲正提示：</b>
              <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                <li>退款成功后，系统将自动回收该订单赠送的金币或撤销信息置顶推荐。</li>
                <li>若已部署商户 API 证书，资金将调用微信底层退回用户微信零钱；未配置时将记录退款核销单。</li>
                <li>操作将永久存入管理员审计日志。</li>
              </ul>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                退款原因 / 审核说明：
              </label>
              <input
                type="text"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="请输入退款原因"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setRefundOrder(null)}
                disabled={refunding}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "white",
                  color: "#475569",
                  fontSize: "13px",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                取消
              </button>
              <button
                onClick={handleConfirmRefund}
                disabled={refunding}
                style={{
                  padding: "8px 18px",
                  borderRadius: "8px",
                  border: "none",
                  background: refunding ? "#f87171" : "#dc2626",
                  color: "white",
                  fontSize: "13px",
                  cursor: refunding ? "not-allowed" : "pointer",
                  fontWeight: 600,
                }}
              >
                {refunding ? "退款处理中..." : "确认发起原路退款"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
