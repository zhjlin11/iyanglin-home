"use client";

import { useState } from "react";
import { Phone, MessageCircle, X, ArrowRight } from "lucide-react";

const PHONE = "13619694207";
const WECHAT = "z13619694207";

export function ContactButton({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      className={className}
      style={{ ...style, cursor: "pointer" }}
      onClick={() => {
        document.getElementById("contact-modal")?.classList.add("open");
      }}
    >
      {children}
    </button>
  );
}

export function ContactModal() {
  const [copied, setCopied] = useState(false);

  const close = () => {
    document.getElementById("contact-modal")?.classList.remove("open");
  };

  const copyWechat = () => {
    navigator.clipboard?.writeText(WECHAT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="contact-modal"
      className="adp-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="adp-modal">
        <button className="adp-modal-close" onClick={close}>
          <X size={20} />
        </button>
        <h3>广告投放咨询</h3>
        <div className="adp-modal-row">
          <Phone size={18} />
          <strong>{PHONE}</strong>
        </div>
        <div className="adp-modal-row">
          <MessageCircle size={18} />
          <strong>{WECHAT}</strong>
          <span style={{ fontSize: ".75rem", color: "var(--c-text2)" }}>
            （微信同号）
          </span>
        </div>
        <div className="adp-modal-actions">
          <a
            href={`tel:${PHONE}`}
            style={{ background: "var(--c-accent)", color: "#fff" }}
          >
            拨打电话
          </a>
          <button
            onClick={copyWechat}
            style={{ background: "var(--c-primary)", color: "#fff" }}
          >
            {copied ? "已复制!" : "复制微信号"}
          </button>
        </div>
      </div>
    </div>
  );
}
