"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { ShieldCheck, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";

export default function AfterSalePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [reason, setReason] = useState("商品损坏");
  const [description, setDescription] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/mall/orders/${id}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setOrder(res.data);
          setRefundAmount((res.data.payAmountCents / 100).toFixed(2));
        }
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!description.trim()) {
      setError("请填写详细的售后申请说明");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/mall/orders/${id}/aftersale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          description,
          refundAmountCents: Math.round(parseFloat(refundAmount) * 100),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "提交售后申请失败");
        setSubmitting(false);
        return;
      }

      alert("售后申请已成功提交，便利店客服将在24小时内核实并原路为您办理退款！");
      router.push(`/mall/orders/${id}`);
    } catch {
      setError("网络请求异常");
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", paddingBottom: "60px" }}>
      <Navbar />

      <div style={{ maxWidth: "650px", margin: "24px auto", padding: "0 16px" }}>
        <Link href={`/mall/orders/${id}`} style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#64748B", textDecoration: "none", fontSize: "13px", marginBottom: "16px" }}>
          <ArrowLeft size={14} />
          <span>返回订单详情</span>
        </Link>

        <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #E2E8F0", padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <ShieldCheck size={20} style={{ color: "#0B7A75" }} />
            <h1 style={{ fontSize: "18px", fontWeight: "800", color: "#0F172A", margin: 0 }}>
              杨林自营便利店 · 售后与退款申请
            </h1>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                售后原因 *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{ width: "100%", padding: "10px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13.5px", background: "#ffffff" }}
              >
                <option value="商品损坏">商品损坏 / 破损漏液</option>
                <option value="商品错误">发错商品 / 与描述不符</option>
                <option value="缺货未送">缺货未送达</option>
                <option value="质量问题">保质期问题 / 质量问题</option>
                <option value="其他">其他原因</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                申请退款金额 (元) *
              </label>
              <input
                type="number"
                step="0.01"
                max={order ? (order.payAmountCents / 100).toFixed(2) : undefined}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                style={{ width: "100%", padding: "10px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13.5px" }}
              />
              <span style={{ fontSize: "12px", color: "#94A3B8" }}>最多可退 ¥{order ? (order.payAmountCents / 100).toFixed(2) : "0.00"}</span>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                详细情况说明 *
              </label>
              <textarea
                rows={4}
                placeholder="请详细描述商品的问题或退款原因，以便便利店客服核对并尽快处理..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: "100%", padding: "10px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13.5px" }}
              />
            </div>

            {error && (
              <div style={{ background: "#FEF2F2", color: "#EF4444", padding: "10px 12px", borderRadius: "6px", fontSize: "13px" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%",
                padding: "12px",
                background: "#0B7A75",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "800",
                fontSize: "15px",
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "正在提交申请..." : "确认提交售后申请"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
