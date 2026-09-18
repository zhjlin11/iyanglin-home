"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

interface IndustrialGalleryProps {
  title: string;
  images: string[];
  badgeTag?: string;
  badgeType?: string;
}

export default function IndustrialGallery({
  title,
  images = [],
  badgeTag,
  badgeType,
}: IndustrialGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const cleanImages = images.filter((img) => img && img.trim().length > 0);
  const currentImg = cleanImages[activeIndex] || cleanImages[0] || "/images/legacy/notfindimg_house.png";

  const prevImage = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : cleanImages.length - 1));
    },
    [cleanImages.length]
  );

  const nextImage = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setActiveIndex((prev) => (prev < cleanImages.length - 1 ? prev + 1 : 0));
    },
    [cleanImages.length]
  );

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, prevImage, nextImage]);

  return (
    <div style={{ width: "100%" }}>
      {/* 主大图视窗 */}
      <div
        style={{
          width: "100%",
          height: "380px",
          background: "#0F172A",
          position: "relative",
          overflow: "hidden",
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => setLightboxOpen(true)}
      >
        <img
          loading="eager"
          decoding="async"
          src={currentImg}
          alt={`${title} - 图 ${activeIndex + 1}`}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "all 0.3s ease",
            display: "block",
          }}
        />

        {/* 标签 */}
        <div
          style={{
            position: "absolute",
            top: "14px",
            left: "14px",
            display: "flex",
            gap: "8px",
            zIndex: 2,
          }}
        >
          {badgeTag && (
            <span
              style={{
                background: badgeTag === "出租" ? "#2563EB" : "#F59E0B",
                color: "#FFFFFF",
                padding: "4px 10px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: "800",
              }}
            >
              {badgeTag}
            </span>
          )}
          {badgeType && (
            <span
              style={{
                background: "rgba(15,23,42,0.85)",
                color: "#FFFFFF",
                padding: "4px 10px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: "700",
              }}
            >
              {badgeType}
            </span>
          )}
        </div>

        {/* 放大镜与张数提示 */}
        <div
          style={{
            position: "absolute",
            bottom: "14px",
            right: "14px",
            background: "rgba(15,23,42,0.75)",
            backdropFilter: "blur(6px)",
            color: "#FFFFFF",
            padding: "6px 12px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            zIndex: 2,
            boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
          }}
        >
          <ZoomIn size={14} />
          <span>
            {cleanImages.length > 0 ? `${activeIndex + 1} / ${cleanImages.length}` : "查看原图"}
          </span>
        </div>

        {/* 左右切换箭头 */}
        {cleanImages.length > 1 && (
          <>
            <button
              onClick={prevImage}
              aria-label="上一张"
              style={{
                position: "absolute",
                top: "50%",
                left: "12px",
                transform: "translateY(-50%)",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "rgba(15,23,42,0.65)",
                color: "#FFF",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.2s",
                zIndex: 2,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(15,23,42,0.9)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(15,23,42,0.65)")}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextImage}
              aria-label="下一张"
              style={{
                position: "absolute",
                top: "50%",
                right: "12px",
                transform: "translateY(-50%)",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "rgba(15,23,42,0.65)",
                color: "#FFF",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.2s",
                zIndex: 2,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(15,23,42,0.9)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(15,23,42,0.65)")}
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* 下方缩略图导航栏 */}
      {cleanImages.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: "10px",
            padding: "12px 16px",
            background: "#F8FAFC",
            overflowX: "auto",
            borderBottom: "1px solid #E2E8F0",
          }}
        >
          {cleanImages.map((img, i) => {
            const isSelected = i === activeIndex;
            return (
              <div
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex(i);
                }}
                onDoubleClick={() => {
                  setActiveIndex(i);
                  setLightboxOpen(true);
                }}
                style={{
                  width: "88px",
                  height: "64px",
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: isSelected ? "2.5px solid #2563EB" : "1.5px solid #CBD5E1",
                  flexShrink: 0,
                  cursor: "pointer",
                  opacity: isSelected ? 1 : 0.7,
                  transform: isSelected ? "scale(1.03)" : "none",
                  transition: "all 0.2s ease",
                  boxShadow: isSelected ? "0 4px 10px rgba(37,99,235,0.25)" : "none",
                }}
              >
                <img
                  src={img}
                  alt={`${title} 缩略图 ${i + 1}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* 沉浸式大图全屏弹窗 (Lightbox) */}
      {lightboxOpen && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(10, 15, 29, 0.92)",
            backdropFilter: "blur(8px)",
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            userSelect: "none",
          }}
        >
          {/* 顶部标题与关闭按钮 */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: "20px",
              left: "24px",
              right: "24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: "#FFF",
              zIndex: 100000,
            }}
          >
            <div style={{ fontSize: "15px", fontWeight: "600", maxWidth: "80%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {title} ({activeIndex + 1} / {cleanImages.length})
            </div>
            <button
              onClick={() => setLightboxOpen(false)}
              aria-label="关闭大图"
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "none",
                color: "#FFF",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
            >
              <X size={22} />
            </button>
          </div>

          {/* 居中大图 */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "92vw",
              maxHeight: "80vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <img
              src={currentImg}
              alt={title}
              style={{
                maxWidth: "100%",
                maxHeight: "80vh",
                borderRadius: "10px",
                objectFit: "contain",
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              }}
            />
          </div>

          {/* 弹窗中的左右切换按钮 */}
          {cleanImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                aria-label="上一张"
                style={{
                  position: "absolute",
                  left: "24px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "rgba(255,255,255,0.15)",
                  border: "none",
                  color: "#FFF",
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  zIndex: 100000,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.35)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
              >
                <ChevronLeft size={28} />
              </button>
              <button
                onClick={nextImage}
                aria-label="下一张"
                style={{
                  position: "absolute",
                  right: "24px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "rgba(255,255,255,0.15)",
                  border: "none",
                  color: "#FFF",
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  zIndex: 100000,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.35)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}

          {/* 底部缩略图快捷流 */}
          {cleanImages.length > 1 && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                bottom: "20px",
                display: "flex",
                gap: "8px",
                padding: "8px 14px",
                background: "rgba(0,0,0,0.5)",
                borderRadius: "30px",
                backdropFilter: "blur(6px)",
                maxWidth: "90vw",
                overflowX: "auto",
              }}
            >
              {cleanImages.map((img, i) => (
                <div
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  style={{
                    width: "48px",
                    height: "36px",
                    borderRadius: "4px",
                    overflow: "hidden",
                    border: i === activeIndex ? "2px solid #3B82F6" : "1px solid rgba(255,255,255,0.3)",
                    cursor: "pointer",
                    opacity: i === activeIndex ? 1 : 0.5,
                    transition: "all 0.2s",
                    flexShrink: 0,
                  }}
                >
                  <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
