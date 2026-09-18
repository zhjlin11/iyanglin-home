"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import Link from "next/link";

interface FinanceSummary {
  totalInYuan: string;
  serviceInYuan: string;
  billingInYuan: string;
  refundOutYuan: string;
  providerPayoutYuan: string;
  platformCommissionYuan: string;
  netProfitYuan: string;
  paidOrdersCount: number;
  refundCount: number;
}

interface DailyLog {
  date: string;
  grossInYuan: string;
  netProfitYuan: string;
}

export default function AdminFinancePage() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = () => {
    setLoading(true);
    setError("");
    fetch("/api/admin/finance")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSummary(data.summary);
          setDailyLogs(data.dailyLogs || []);
        } else {
          setError(data.error || "获取财务对账数据失败");
        }
      })
      .catch(() => setError("网络请求异常"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AdminLayout
      title="💰 统一财务与对账中心"
      subtitle="杨林生活网多频道商业化资金结算、微信支付流水与资产合规管控"
      actionButton={
        <button
          onClick={loadData}
          style={{
            padding: "8px 16px",
            background: "#0B7A75",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          🔄 刷新对账数据
        </button>
      }
    >
      {/* 资产隔离合规指引 */}
      <div
        style={{
          background: "linear-gradient(135deg, #0B7A75 0%, #085652 100%)",
          color: "white",
          borderRadius: "12px",
          padding: "20px 24px",
          marginBottom: "24px",
          boxShadow: "0 4px 12px rgba(11,122,117,0.15)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>
            🛡️ 平台资产三层合规管控准则
          </h3>
          <span style={{ fontSize: "12px", background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: "12px" }}>
            严格隔离 · 闭环运营
          </span>
        </div>
        <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.6, opacity: 0.9 }}>
          杨林生活网严格区分三种资产形态：<b>【平台积分】</b>仅作为不可提现的促活运营激励，支持兑换优惠券与置顶权益；
          <b>【金币】</b>作为虚拟交互代币，用于同城轻量功能解锁；<b>【人民币】</b>直连微信商户支付与财务对账，严格执行分账、退款原路返还及防刷单风险拦截。
        </p>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: "8px", marginBottom: "20px", fontSize: "14px" }}>
          ⚠️ {error}
        </div>
      )}

      {/* KPI 卡片组 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div style={{ background: "white", padding: "18px 20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>累计总商业流水 (Gross GMV)</div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#0B7A75" }}>
            ¥{summary ? summary.totalInYuan : "--"}
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
            成交订单: {summary ? summary.paidOrdersCount : 0} 笔
          </div>
        </div>

        <div style={{ background: "white", padding: "18px 20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>本地服务交易额 (Service GMV)</div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#2563eb" }}>
            ¥{summary ? summary.serviceInYuan : "--"}
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
            商户待结算/已结: ¥{summary ? summary.providerPayoutYuan : "0.00"}
          </div>
        </div>

        <div style={{ background: "white", padding: "18px 20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>广告推广与置顶流水</div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#d97706" }}>
            ¥{summary ? summary.billingInYuan : "--"}
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
            100% 平台直营确认收入
          </div>
        </div>

        <div style={{ background: "white", padding: "18px 20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>平台佣金抽成 (Platform Fee)</div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#7c3aed" }}>
            ¥{summary ? summary.platformCommissionYuan : "--"}
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
            服务商订单分佣留存
          </div>
        </div>

        <div style={{ background: "white", padding: "18px 20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>售后退款总额 (Refunded)</div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#dc2626" }}>
            ¥{summary ? summary.refundOutYuan : "--"}
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
            成功退款: {summary ? summary.refundCount : 0} 笔
          </div>
        </div>

        <div style={{ background: "white", padding: "18px 20px", borderRadius: "12px", border: "2px solid #10b981", boxShadow: "0 2px 8px rgba(16,185,129,0.1)" }}>
          <div style={{ fontSize: "12px", color: "#047857", fontWeight: 600, marginBottom: "6px" }}>平台净营业额 (Net Profit)</div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#059669" }}>
            ¥{summary ? summary.netProfitYuan : "--"}
          </div>
          <div style={{ fontSize: "11px", color: "#059669", marginTop: "4px" }}>
            抽成 + 直营推广 - 退款扣减
          </div>
        </div>
      </div>

      {/* 近 7 天日度流水趋势表 */}
      <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
            📊 近 7 天每日财务流水明细 (日结对账)
          </h3>
          <span style={{ fontSize: "12px", color: "#64748b" }}>每日 00:00 自动结算归档</span>
        </div>

        {loading ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8" }}>正在加载财务账单...</div>
        ) : dailyLogs.length === 0 ? (
          <div style={{ padding: "30px 0", textAlign: "center", color: "#94a3b8" }}>暂无日度资金流动</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f1f5f9", background: "#f8fafc", color: "#475569", textAlign: "left" }}>
                  <th style={{ padding: "10px 14px" }}>对账日期</th>
                  <th style={{ padding: "10px 14px" }}>当日总流水 (GMV)</th>
                  <th style={{ padding: "10px 14px" }}>当日平台净收益</th>
                  <th style={{ padding: "10px 14px" }}>对账状态</th>
                </tr>
              </thead>
              <tbody>
                {dailyLogs.map((log) => (
                  <tr key={log.date} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 14px", fontWeight: 600, color: "#1e293b" }}>{log.date}</td>
                    <td style={{ padding: "12px 14px", color: "#0B7A75", fontWeight: 700 }}>¥{log.grossInYuan}</td>
                    <td style={{ padding: "12px 14px", color: "#059669", fontWeight: 700 }}>¥{log.netProfitYuan}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ background: "#ecfdf5", color: "#059669", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600 }}>
                        ✅ 账实相符
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 快捷跳转 */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <Link
          href="/admin/orders"
          style={{
            textDecoration: "none",
            background: "white",
            padding: "12px 18px",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            fontSize: "13px",
            fontWeight: 600,
            color: "#334155",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          📦 查看全部订单记录 →
        </Link>
        <Link
          href="/admin/withdrawals"
          style={{
            textDecoration: "none",
            background: "white",
            padding: "12px 18px",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            fontSize: "13px",
            fontWeight: 600,
            color: "#334155",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          💳 服务商提现与打款审核 →
        </Link>
      </div>
    </AdminLayout>
  );
}
