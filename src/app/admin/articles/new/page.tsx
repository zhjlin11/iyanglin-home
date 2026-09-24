"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

type Plan = { id: string; name: string; targetKind: string; priceCents: number; durationDays: number; enabled: boolean };

function yuan(cents: number) {
  const value = cents / 100;
  return value.toFixed(value % 1 === 0 ? 0 : 2);
}

export default function NewArticlePage() {
  const [message, setMessage] = useState("");
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    fetch("/api/billing")
      .then((response) => response.json())
      .then((data) => setPlans((data.plans || []).filter((plan: Plan) => plan.enabled && plan.targetKind === "article")))
      .catch(() => setPlans([]));
  }, []);

  const save = async (status: "draft" | "pending", form: HTMLFormElement) => {
    const data = new FormData(form);
    const title = String(data.get("title") || "").trim();
    const body = String(data.get("body") || "").trim();
    const category = String(data.get("category") || "life").trim();
    const billingPlanId = String(data.get("billingPlanId") || "").trim();

    if (!title || !body) {
      setMessage("请填写文章标题和正文");
      return;
    }

    setMessage("正在保存...");
    const response = await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "article", title, body, category, status, billingPlanId: status === "pending" ? billingPlanId || undefined : undefined }),
    });

    if (!response.ok) {
      setMessage("保存失败，请稍后重试");
      return;
    }

    const result = await response.json();
    if (status === "draft") {
      setMessage("草稿已保存");
      return;
    }

    setMessage(result.order ? "文章已提交，并已生成待支付订单" : "文章已提交，等待审核");
    setTimeout(() => {
      location.href = result.order ? "/admin/orders" : "/admin/content";
    }, 700);
  };

  return (
    <AdminLayout
      title="发布新文章"
      subtitle="完善内容后保存草稿或提交审核，可选择文章套餐生成订单。"
      actionButton={
        <div style={{ display: "flex", gap: "8px" }}>
          <button type="button" className="button button-secondary" onClick={() => save("draft", document.getElementById("article-form") as HTMLFormElement)}>
            保存草稿
          </button>
          <button type="submit" form="article-form" className="button button-primary">提交审核</button>
        </div>
      }
    >
      <div className="editor-shell" style={{ maxWidth: "100%", margin: 0, padding: 0 }}>
        <div className="editor-heading">
          <div>
            <span className="eyebrow">文章编辑</span>
            <h1>发布新文章</h1>
            <p>完善内容后保存草稿或提交审核，可选择文章套餐生成订单。</p>
          </div>
          <div className="editor-actions">
            <button type="button" className="button button-secondary" onClick={() => save("draft", document.getElementById("article-form") as HTMLFormElement)}>
              保存草稿
            </button>
            <button type="submit" form="article-form" className="button button-primary">提交审核</button>
          </div>
        </div>

        {message ? (
          <div className={message.includes("失败") || message.includes("填写") ? "notice-error" : "notice-success"} role="status">
            {message}
          </div>
        ) : null}

        <form id="article-form" className="editor-layout" onSubmit={(event) => { event.preventDefault(); save("pending", event.currentTarget); }}>
          <div className="editor-main">
            <label>
              文章标题
              <input name="title" required placeholder="请输入文章标题" />
            </label>
            <label>
              文章摘要
              <textarea rows={3} name="summary" placeholder="用一两句话概括文章内容" />
            </label>
            <label>
              正文内容
              <textarea name="body" className="body-editor" required rows={15} placeholder="请输入文章正文" />
            </label>
          </div>
          <aside className="editor-side">
            <div className="editor-card">
              <h2>发布设置</h2>
              <label>
                文章分类
                <select name="category" defaultValue="life">
                  <option value="life">本地生活</option>
                  <option value="guide">实用攻略</option>
                  <option value="notice">平台公告</option>
                </select>
              </label>
            </div>
            <div className="editor-card">
              <h2>收费套餐</h2>
              <label>
                选择套餐
                <select name="billingPlanId" defaultValue="">
                  <option value="">不选择套餐</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.name} · ¥{yuan(plan.priceCents)} · {plan.durationDays}天</option>
                  ))}
                </select>
              </label>
              <p className="field-hint">提交审核时选择套餐会自动生成待支付订单，保存草稿不会生成订单。</p>
            </div>
          </aside>
        </form>
      </div>
    </AdminLayout>
  );
}
