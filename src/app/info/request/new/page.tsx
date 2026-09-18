"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CATEGORIES = [
  { key: "家电维修", icon: "🔌", desc: "空调/冰箱/洗衣机/电视/热水器" },
  { key: "管道疏通", icon: "🚿", desc: "马桶疏通/下水管道/地漏清淤" },
  { key: "开锁换锁", icon: "🔑", desc: "急速开锁/换指纹锁/汽车锁" },
  { key: "家政保洁", icon: "🧹", desc: "日常保洁/开荒保洁/油烟机清洗" },
  { key: "房屋修缮", icon: "🔨", desc: "水电漏水/修门窗/刷漆补墙/防水" },
  { key: "搬家拉货", icon: "🚚", desc: "学生搬家/货运拉货/拆装家具" },
  { key: "数码电脑", icon: "💻", desc: "电脑重装/打印机/手机维修/监控" },
  { key: "便民跑腿", icon: "⚡", desc: "同城代买/取送文件/排队急送" },
  { key: "其它便民", icon: "🛠️", desc: "其他生活琐事/咨询服务" },
];

const AREAS = ["杨林大学城", "杨林经开区", "杨林老城区", "职教园区", "嘉丽泽", "杨林全区"];

const URGENCY_OPTIONS = [
  { key: "URGENT", label: "🔥 非常紧急 (1小时内联系)", color: "#ef4444" },
  { key: "NORMAL", label: "⚡ 今天之内响应", color: "#2563eb" },
  { key: "FLEXIBLE", label: "📅 时间灵活 / 预约", color: "#10b981" },
];

const PREFERRED_TIMES = ["尽快上门", "今天上午", "今天下午", "今晚", "明天", "周末随时", "电话协商约定"];

export default function NewRequestPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // 表单状态
  const [category, setCategory] = useState("家电维修");
  const [area, setArea] = useState("杨林大学城");
  const [addressDetail, setAddressDetail] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState("NORMAL");
  const [preferredTime, setPreferredTime] = useState("尽快上门");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactWechat, setContactWechat] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleNext = () => {
    setErrorMsg("");
    if (step === 1) {
      if (!category) {
        setErrorMsg("请选择服务分类");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!area) {
        setErrorMsg("请选择所在片区");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!title.trim() || !description.trim()) {
        setErrorMsg("请填写需求标题和详细问题描述");
        return;
      }
      setStep(4);
    }
  };

  const handleSubmit = async () => {
    setErrorMsg("");
    if (!contactName.trim() || !contactPhone.trim()) {
      setErrorMsg("请填写您的称呼与联系手机号");
      return;
    }

    if (!/^1\d{10}$/.test(contactPhone.trim())) {
      setErrorMsg("请填写正确的 11 位手机号码");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/info/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category,
          area,
          addressDetail: addressDetail.trim(),
          description: description.trim(),
          urgency,
          preferredTime,
          budgetMin: budgetMin ? parseInt(budgetMin) * 100 : null,
          budgetMax: budgetMax ? parseInt(budgetMax) * 100 : null,
          contactName: contactName.trim(),
          contactPhone: contactPhone.trim(),
          contactWechat: contactWechat.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "发布失败");
      }

      // 成功直接跳转到该需求的撮合详情页
      router.push(`/info/requests/${data.data.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || "网络异常，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", paddingBottom: "60px" }}>
      {/* 顶部导航 */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          style={{
            maxWidth: "768px",
            margin: "0 auto",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href="/info"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#475569",
              textDecoration: "none",
              fontSize: "0.9rem",
            }}
          >
            ‹ 返回便民大厅
          </Link>
          <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#0f172a" }}>⚡ 发布找师傅需求</div>
          <Link
            href="/info/requests"
            style={{ fontSize: "0.85rem", color: "#2563eb", textDecoration: "none" }}
          >
            需求大厅 ›
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: "680px", margin: "20px auto", padding: "0 16px" }}>
        {/* 步骤条进度指示器 */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "20px",
            border: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {[
            { s: 1, label: "选分类" },
            { s: 2, label: "定位置" },
            { s: 3, label: "填故障" },
            { s: 4, label: "留电话" },
          ].map((item, idx) => (
            <div
              key={item.s}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                flex: idx < 3 ? 1 : "initial",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: step >= item.s ? "#2563eb" : "#f1f5f9",
                  color: step >= item.s ? "#ffffff" : "#94a3b8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                }}
              >
                {step > item.s ? "✓" : item.s}
              </div>
              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: step === item.s ? 700 : 400,
                  color: step === item.s ? "#1e293b" : "#64748b",
                }}
              >
                {item.label}
              </span>
              {idx < 3 && (
                <div
                  style={{
                    flex: 1,
                    height: "2px",
                    backgroundColor: step > item.s ? "#2563eb" : "#e2e8f0",
                    margin: "0 8px",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* 错误警告框 */}
        {errorMsg && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              marginBottom: "16px",
            }}
          >
            ⚠️ {errorMsg}
          </div>
        )}

        {/* 步骤 1: 选择分类 */}
        {step === 1 && (
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "20px",
              border: "1px solid #e2e8f0",
            }}
          >
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
              第 1 步：请选择您需要的服务类别
            </h2>
            <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "16px" }}>
              杨林本地已认证师傅将根据您的类别智能匹配
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: "12px",
                marginBottom: "24px",
              }}
            >
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.key;
                return (
                  <div
                    key={cat.key}
                    onClick={() => setCategory(cat.key)}
                    style={{
                      padding: "14px",
                      borderRadius: "10px",
                      border: isSelected ? "2px solid #2563eb" : "1px solid #e2e8f0",
                      backgroundColor: isSelected ? "#eff6ff" : "#ffffff",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ fontSize: "1.5rem", marginBottom: "6px" }}>{cat.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: isSelected ? "#1d4ed8" : "#1e293b" }}>
                      {cat.key}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>{cat.desc}</div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleNext}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              下一步：选择服务区域 ›
            </button>
          </div>
        )}

        {/* 步骤 2: 选择区域 */}
        {step === 2 && (
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "20px",
              border: "1px solid #e2e8f0",
            }}
          >
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
              第 2 步：师傅需要去哪里上门？
            </h2>
            <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "16px" }}>
              选择片区后，系统将优先派发给覆盖该区域的常驻师傅
            </p>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "8px" }}>
                所在片区 <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {AREAS.map((a) => {
                  const isSelected = area === a;
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setArea(a)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        border: isSelected ? "2px solid #2563eb" : "1px solid #cbd5e1",
                        backgroundColor: isSelected ? "#eff6ff" : "#ffffff",
                        color: isSelected ? "#1d4ed8" : "#475569",
                        fontWeight: isSelected ? 700 : 400,
                        fontSize: "0.9rem",
                        cursor: "pointer",
                      }}
                    >
                      {a}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "8px" }}>
                小区或街道粗略位置 (选填)
              </label>
              <input
                type="text"
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                placeholder="例如：万达公寓B座 / 云南工商学院南门附近"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  boxSizing: "border-box",
                }}
              />
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "4px" }}>
                🔒 隐私保护：具体门牌号请等师傅接单后在电话中告知，前台公开大厅不会展示具体住址
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  padding: "12px 20px",
                  backgroundColor: "#ffffff",
                  color: "#64748b",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  cursor: "pointer",
                }}
              >
                ‹ 上一步
              </button>
              <button
                type="button"
                onClick={handleNext}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                下一步：描述具体故障 ›
              </button>
            </div>
          </div>
        )}

        {/* 步骤 3: 故障描述与时间要求 */}
        {step === 3 && (
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "20px",
              border: "1px solid #e2e8f0",
            }}
          >
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
              第 3 步：具体遇到了什么问题？
            </h2>
            <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "16px" }}>
              准确描述故障情况，师傅能更快为您评估报价和携带工具
            </p>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                需求标题 <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：大学城怡园急需修下水管道漏水 / 格力空调不制冷"
                maxLength={50}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                详细问题描述 <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="请详细描述故障现象、品牌型号、持续时间、是否需要携带零配件等..."
                maxLength={500}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                紧急程度
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {URGENCY_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setUrgency(opt.key)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "8px",
                      border: urgency === opt.key ? `2px solid ${opt.color}` : "1px solid #cbd5e1",
                      backgroundColor: urgency === opt.key ? "#f8fafc" : "#ffffff",
                      color: urgency === opt.key ? opt.color : "#475569",
                      fontWeight: urgency === opt.key ? 700 : 400,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                期望上门时间
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {PREFERRED_TIMES.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setPreferredTime(time)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: preferredTime === time ? "1px solid #2563eb" : "1px solid #e2e8f0",
                      backgroundColor: preferredTime === time ? "#eff6ff" : "#ffffff",
                      color: preferredTime === time ? "#1d4ed8" : "#64748b",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                    }}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                参考预算区间 (元，选填)
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="number"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  placeholder="最低预算"
                  style={{
                    width: "120px",
                    padding: "8px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    fontSize: "0.85rem",
                  }}
                />
                <span style={{ color: "#94a3b8" }}>至</span>
                <input
                  type="number"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  placeholder="最高预算"
                  style={{
                    width: "120px",
                    padding: "8px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    fontSize: "0.85rem",
                  }}
                />
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>元</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setStep(2)}
                style={{
                  padding: "12px 20px",
                  backgroundColor: "#ffffff",
                  color: "#64748b",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  cursor: "pointer",
                }}
              >
                ‹ 上一步
              </button>
              <button
                type="button"
                onClick={handleNext}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                下一步：填写联系人 ›
              </button>
            </div>
          </div>
        )}

        {/* 步骤 4: 联系方式与提交 */}
        {step === 4 && (
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "20px",
              border: "1px solid #e2e8f0",
            }}
          >
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
              第 4 步：请留下您的联系方式
            </h2>
            <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "16px" }}>
              方便匹配到的认证师傅在 15 分钟内与您电话沟通细节
            </p>

            {/* 隐私承诺 */}
            <div
              style={{
                backgroundColor: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "8px",
                padding: "12px 14px",
                fontSize: "0.85rem",
                color: "#1e40af",
                marginBottom: "20px",
                display: "flex",
                gap: "8px",
              }}
            >
              <span>🛡️</span>
              <div>
                <strong>隐私安全承诺</strong>：您的手机号码在大厅公开列表一律严格脱敏（如 138****1234），仅限通过平台实名认证的合格师傅接单后查阅。
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                联系人称呼 <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="例如：张先生 / 李女士"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                联系手机号 <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="请输入11位手机号码"
                maxLength={11}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                微信号 (选填)
              </label>
              <input
                type="text"
                value={contactWechat}
                onChange={(e) => setContactWechat(e.target.value)}
                placeholder="方便师傅加微信发维修图片/位置"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* 需求确认小卡片 */}
            <div
              style={{
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "20px",
                fontSize: "0.85rem",
                color: "#475569",
              }}
            >
              <div>🏷️ 分类：<strong>{category}</strong> | 📍 片区：<strong>{area}</strong></div>
              <div style={{ marginTop: "4px" }}>📋 标题：<strong>{title}</strong></div>
              <div style={{ marginTop: "4px" }}>⏰ 期望时间：<strong>{preferredTime}</strong></div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setStep(3)}
                style={{
                  padding: "12px 20px",
                  backgroundColor: "#ffffff",
                  color: "#64748b",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  cursor: "pointer",
                }}
              >
                ‹ 上一步
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontWeight: 700,
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? "正在为您匹配本地师傅..." : "🚀 立即发布并启动智能匹配"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
