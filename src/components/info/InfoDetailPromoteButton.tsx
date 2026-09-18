"use client";

import React, { useState } from "react";
import { Flame, Sparkles } from "lucide-react";
import { PromotionSheet } from "@/components/info/PromotionSheet";

interface InfoDetailPromoteButtonProps {
  listingId: string;
  listingTitle: string;
  isTop?: boolean;
  isFeatured?: boolean;
}

export default function InfoDetailPromoteButton({
  listingId,
  listingTitle,
  isTop,
  isFeatured,
}: InfoDetailPromoteButtonProps) {
  const [showSheet, setShowSheet] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowSheet(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-amber-900 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 shadow-md shadow-amber-500/20 transition-transform active:scale-95 cursor-pointer border border-amber-300"
        title="购买置顶推广或精选推荐，提升3倍成交曝光"
      >
        <Flame className="w-3.5 h-3.5 text-orange-600 fill-orange-600 animate-pulse" />
        <span>{isTop || isFeatured ? "续费/升级推广" : "🚀 推广我的信息"}</span>
      </button>

      <PromotionSheet
        listingId={listingId}
        listingTitle={listingTitle}
        isOpen={showSheet}
        onClose={() => setShowSheet(false)}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </>
  );
}
