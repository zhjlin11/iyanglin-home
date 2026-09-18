"use client";

import React, { useState, useEffect } from "react";
import ContactRevealer from "./ContactRevealer";
import { calculateEventStatus, formatSignupDeadline } from "@/lib/activity-parser";

export type Signup = {
  id: string;
  name: string;
  phone: string;
  numPeople: number;
  note?: string | null;
  createdAt: string;
};

interface EventSignupSectionProps {
  eventId: string;
  eventTitle: string;
  startTime?: string;
  endTime?: string;
  deadline?: string;
  quota?: string;
  eventStatus?: string;
  signupMethod?: string;
  contactPhone?: string;
  wechat?: string;
  externalLink?: string;
  initialSignups: Signup[];
}

export default function EventSignupSection({
  eventId,
  eventTitle,
  startTime,
  endTime,
  deadline,
  quota,
  eventStatus,
  signupMethod = "在线报名",
  contactPhone,
  wechat,
  externalLink,
  initialSignups = [],
}: EventSignupSectionProps) {
  const [signups, setSignups] = useState<Signup[]>(initialSignups);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [numPeople, setNumPeople] = useState(1);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [copiedWechat, setCopiedWechat] = useState(false);
  const [userHasSignedUp, setUserHasSignedUp] = useState<Signup | null>(null);

  const totalHeadcount = signups.reduce((sum, s) => sum + (s.numPeople || 1), 0);

  // Dynamic Status Calculation
  const statusInfo = calculateEventStatus(
    startTime,
    endTime,
    deadline,
    totalHeadcount,
    quota,
    eventStatus
  );

  // Check local storage for previous signup
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`signup_${eventId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setUserHasSignedUp(parsed);
      }
    } catch {
      // ignore
    }
  }, [eventId]);

  const validatePhone = (val: string) => {
    setPhone(val);
    if (!val) {
      setPhoneError("");
    } else if (!/^1[3-9]\d{9}$/.test(val)) {
      setPhoneError("请输入正确的11位手机号码");
    } else {
      setPhoneError("");
    }
  };

  const submitSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setMessage("请填写姓名和联系电话");
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phone.trim())) {
      setPhoneError("请输入正确的11位手机号码");
      return;
    }

    setSubmitting(true);
    setMessage("");

    const response = await fetch("/api/events/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        name: name.trim(),
        phone: phone.trim(),
        numPeople,
        note: note.trim() || undefined,
      }),
    });

    setSubmitting(false);

    if (!response.ok) {
      const res = await response.json().catch(() => ({}));
      setMessage(res.error || "报名失败，请稍后重试");
      return;
    }

    const newSignup: Signup = {
      id: "temp_" + Date.now(),
      name: name.trim(),
      phone: phone.trim(),
      numPeople,
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    setSignups([newSignup, ...signups]);
    setUserHasSignedUp(newSignup);

    try {
      localStorage.setItem(`signup_${eventId}`, JSON.stringify(newSignup));
    } catch {
      // ignore
    }

    setName("");
    setPhone("");
    setNote("");
    setMessage("🎉 恭喜！活动在线报名成功！");
  };

  const copyWechat = () => {
    if (!wechat) return;
    navigator.clipboard.writeText(wechat);
    setCopiedWechat(true);
    setTimeout(() => setCopiedWechat(false), 2000);
  };

  return (
    <div style={{ position: "sticky", top: "90px" }}>
      <div style={{ padding: "1.5rem", border: "1px solid var(--border)", borderRadius: "12px", background: "white", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", marginBottom: "1rem" }}>
        
        {/* Header Status Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "bold", color: "#0B7A75" }}>
            🎟️ 活动报名与联系
          </h3>
          <span style={{ fontSize: "12px", background: statusInfo.badgeColor, color: "white", padding: "2px 10px", borderRadius: "20px", fontWeight: "bold" }}>
            {statusInfo.statusText}
          </span>
        </div>

        {deadline && (
          <div style={{ fontSize: "12px", color: "#ef4444", background: "#fef2f2", padding: "6px 10px", borderRadius: "6px", marginBottom: "1rem" }}>
            ⏳ 报名截止：{formatSignupDeadline(deadline)}
          </div>
        )}

        {/* Action based on signupMethod */}
        {signupMethod === "外部链接" && externalLink ? (
          <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
            <a
              href={externalLink}
              target="_blank"
              rel="noreferrer"
              className="button button-primary"
              style={{ display: "block", background: "#0B7A75", borderColor: "#0B7A75", padding: "0.75rem", textDecoration: "none", fontWeight: "bold" }}
            >
              🚀 打开外部报名页面
            </a>
          </div>
        ) : signupMethod === "微信联系" && wechat ? (
          <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "8px" }}>微信号联系主办方报名</div>
            <div style={{ padding: "12px", background: "#f0fdf4", color: "#16a34a", borderRadius: "8px", fontWeight: "bold", marginBottom: "8px" }}>
              {wechat}
            </div>
            <button onClick={copyWechat} className="button button-secondary" style={{ width: "100%", padding: "0.5rem" }}>
              {copiedWechat ? "已复制微信号！" : "📋 复制微信号"}
            </button>
          </div>
        ) : signupMethod === "电话报名" ? (
          <div style={{ padding: "0.5rem 0" }}>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "8px" }}>电话联系主办方报名</div>
            {contactPhone && <ContactRevealer contact={contactPhone} />}
          </div>
        ) : (
          /* Online Signup Form */
          <div>
            {userHasSignedUp ? (
              <div style={{ padding: "1rem", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "8px", textDecoration: "none", color: "#065f46" }}>
                <div style={{ fontWeight: "bold", fontSize: "1.05rem", marginBottom: "6px" }}>✅ 您已成功报名此活动</div>
                <div style={{ fontSize: "13px" }}>报名姓名：{userHasSignedUp.name} ({userHasSignedUp.numPeople}人)</div>
                <div style={{ fontSize: "13px" }}>联系电话：{userHasSignedUp.phone}</div>
                {userHasSignedUp.note && <div style={{ fontSize: "12px", color: "#047857", marginTop: "4px" }}>备注：{userHasSignedUp.note}</div>}
              </div>
            ) : (
              <form onSubmit={submitSignup} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {message && (
                  <div style={{ padding: "0.5rem 0.75rem", borderRadius: "6px", fontSize: "13px", background: message.includes("失败") ? "#fef2f2" : "#ecfdf5", color: message.includes("失败") ? "#ef4444" : "#16a34a" }}>
                    {message}
                  </div>
                )}

                <label style={{ fontSize: "13px", fontWeight: "bold", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span>姓名 / 昵称 <span style={{ color: "#ef4444" }}>*</span></span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="如：张同学"
                    disabled={!statusInfo.canSignup}
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid var(--border)", boxSizing: "border-box" }}
                  />
                </label>

                <label style={{ fontSize: "13px", fontWeight: "bold", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span>联系手机号 <span style={{ color: "#ef4444" }}>*</span></span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => validatePhone(e.target.value)}
                    placeholder="如：13800000000"
                    disabled={!statusInfo.canSignup}
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: phoneError ? "1px solid #ef4444" : "1px solid var(--border)", boxSizing: "border-box" }}
                  />
                  {phoneError && <span style={{ color: "#ef4444", fontSize: "11px" }}>{phoneError}</span>}
                </label>

                <label style={{ fontSize: "13px", fontWeight: "bold", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span>报名人数 <span style={{ color: "#ef4444" }}>*</span></span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={numPeople}
                    onChange={(e) => setNumPeople(parseInt(e.target.value) || 1)}
                    disabled={!statusInfo.canSignup}
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid var(--border)", boxSizing: "border-box" }}
                  />
                </label>

                <label style={{ fontSize: "13px", fontWeight: "bold", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span>备注说明 (选填)</span>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="如：自驾前往、携带天幕或球拍"
                    disabled={!statusInfo.canSignup}
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid var(--border)", boxSizing: "border-box", fontSize: "13px" }}
                  />
                </label>

                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                  🔒 隐私说明：手机号仅用于主办方联系和活动通知，不会在活动页面公开展示。
                </div>

                <button
                  type="submit"
                  className="button button-primary"
                  disabled={submitting || !statusInfo.canSignup}
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.75rem",
                    background: statusInfo.canSignup ? "#0B7A75" : "#94a3b8",
                    borderColor: statusInfo.canSignup ? "#0B7A75" : "#94a3b8",
                    fontWeight: "bold",
                  }}
                >
                  {submitting ? "正在提交..." : statusInfo.canSignup ? "立即在线快捷报名" : statusInfo.reason}
                </button>
              </form>
            )}
          </div>
        )}

        <hr style={{ borderColor: "var(--border)", margin: "1.25rem 0" }} />
        <a
          className="button button-secondary"
          href={`/billing/promote?kind=event&id=${eventId}&title=${encodeURIComponent(eventTitle)}`}
          style={{ display: "block", textAlign: "center", color: "#ef4444", borderColor: "#ef4444", textDecoration: "none", fontSize: "13px", fontWeight: "bold" }}
        >
          🔥 申请活动置顶推荐
        </a>
      </div>

      {/* Registered Participants Display */}
      {signupMethod === "在线报名" && (
        <div style={{ padding: "1.25rem", border: "1px solid var(--border)", borderRadius: "12px", background: "white", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", fontWeight: "bold", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>👥 已报名伙伴</span>
            <span style={{ fontSize: "12px", color: "#0B7A75", fontWeight: "bold" }}>共 {totalHeadcount} 人</span>
          </h4>

          {signups.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: "13px", textAlign: "center", padding: "1rem 0" }}>
              暂无人员报名，快来抢占第一个名额！
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "240px", overflowY: "auto" }}>
              {signups.map((s) => (
                <div key={s.id} style={{ padding: "8px 12px", background: "#f8fafc", borderRadius: "6px", fontSize: "13px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ color: "#334155" }}>{s.name}</strong> ({s.numPeople}人)
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {new Date(s.createdAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
