"use client";

import React from "react";
import { PhoneCall, MessageCircle } from "lucide-react";

interface InfoStickyContactBarProps {
  rawPhone?: string | null;
  wechat?: string | null;
  isExpired?: boolean;
}

export default function InfoStickyContactBar({
  rawPhone,
  wechat,
  isExpired,
}: InfoStickyContactBarProps) {
  const handleCopyWechat = () => {
    if (wechat && typeof navigator !== "undefined") {
      navigator.clipboard?.writeText(wechat);
      alert(`微信号【${wechat}】已复制到剪贴板，请打开微信添加！`);
    }
  };

  return (
    <div className="mobile-detail-sticky-bar">
      {/* 拨打电话 */}
      {rawPhone && !isExpired ? (
        <a href={`tel:${rawPhone}`} className="sticky-btn phone">
          <PhoneCall size={16} />
          <span>拨打电话</span>
        </a>
      ) : (
        <button disabled className="sticky-btn disabled">
          <span>电话已失效</span>
        </button>
      )}

      {/* 复制微信 */}
      {wechat && !isExpired && (
        <button
          type="button"
          onClick={handleCopyWechat}
          className="sticky-btn wechat"
        >
          <MessageCircle size={16} />
          <span>复制微信</span>
        </button>
      )}
    </div>
  );
}
