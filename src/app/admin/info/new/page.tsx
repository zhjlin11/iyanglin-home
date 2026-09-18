"use client";

import { useEffect, useState } from "react";
import AdminNavbar from "@/components/AdminNavbar";

type Plan = { id: string; name: string; targetKind: string; priceCents: number; durationDays: number; enabled: boolean };

function yuan(cents: number) {
  const value = cents / 100;
  return value.toFixed(value % 1 === 0 ? 0 : 2);
}

export default function NewListingPage() {
  const [message, setMessage] = useState("");
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    fetch("/api/billing")
      .then((response) => response.json())
      .then((data) => setPlans((data.plans || []).filter((plan: Plan) => plan.enabled && plan.targetKind === "listing")))
      .catch(() => setPlans([]));
  }, []);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get("title") || "").trim();
    const category = String(data.get("category") || "").trim();
    const contact = String(data.get("contact") || "").trim();
    const body = String(data.get("body") || "").trim();
    const billingPlanId = String(data.get("billingPlanId") || "").trim();

    if (!title || !category || !contact || !body) {
      setMessage("请填写标题、分类、联系方式和详情");
      return;
    }

    setMessage("正在提交...");
    const response = await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "listing", title, category, contact, body, status: "pending", billingPlanId: billingPlanId || undefined }),
    });

    if (!response.ok) {
      setMessage("提交失败，请稍后重试");
      return;
    }

    const result = await response.json();
    setMessage(result.order ? "分类信息已提交，并已生成待支付订单" : "分类信息已提交，等待审核");
    setTimeout(() => {
      location.href = result.order ? "/admin/orders" : "/admin/content";
    }, 700);
  };

  return (
    <main className="admin-page">
      <AdminNavbar />
      <div className="shell editor-shell">
        <div className="editor-heading">
          <div>
            <span className="eyebrow">信息编辑</span>
            <h1>发布分类信息</h1>
            <p>填写本地信息后提交审核，可选择收费套餐生成订单。</p>
          </div>
          <button className="button button-primary" type="submit" form="listing-form">提交审核</button>
        </div>

        {message ? (
          <div className={message.includes("失败") || message.includes("填写") ? "notice-error" : "notice-success"} role="status">
            {message}
          </div>
        ) : null}

        <form id="listing-form" className="editor-layout" onSubmit={submit}>
          <div className="editor-main">
            <label>
              信息标题
              <input name="title" required placeholder="例如：九成新书桌转让" />
            </label>
            <label>
              联系方式
              <input name="contact" required placeholder="例如：微信 yanglin-test" />
            </label>
            <label>
              信息详情
              <textarea name="body" className="body-editor" required rows={15} placeholder="描述物品、服务、价格、地点和注意事项" />
            </label>
          </div>
          <aside className="editor-side">
            <div className="editor-card">
              <h2>分类设置</h2>
              <label>
                信息分类
                <select name="category" defaultValue="secondhand">
                  <option value="secondhand">二手物品</option>
                  <option value="service">生活服务</option>
                  <option value="rent">租房合租</option>
                  <option value="notice">本地公告</option>
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
              <p className="field-hint">选择套餐后，提交内容会自动生成待支付订单。</p>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}
