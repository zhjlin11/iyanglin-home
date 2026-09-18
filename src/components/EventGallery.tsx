"use client";

import React, { useState } from "react";
import EventPlaceholderCover from "./EventPlaceholderCover";

interface EventGalleryProps {
  title: string;
  category?: string;
  images?: string[];
}

export default function EventGallery({ title, category = "outdoor", images = [] }: EventGalleryProps) {
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  const cleanImages = (images || []).filter((img) => img && img.trim());

  if (cleanImages.length === 0) {
    return (
      <div style={{ width: "100%", height: "220px", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", marginBottom: "1.25rem" }}>
        <EventPlaceholderCover title={title} category={category} height={220} />
      </div>
    );
  }

  if (cleanImages.length === 1) {
    return (
      <div style={{ width: "100%", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", marginBottom: "1.25rem", background: "#f8fafc" }}>
        <img
          src={cleanImages[0]}
          alt={title}
          onClick={() => setSelectedImg(cleanImages[0])}
          style={{ width: "100%", maxHeight: "380px", aspectRatio: "16/9", objectFit: "cover", display: "block", cursor: "pointer" }}
        />
        {selectedImg && (
          <div
            onClick={() => setSelectedImg(null)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.85)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
            }}
          >
            <img src={selectedImg} alt={title} style={{ maxWidth: "95vw", maxHeight: "90vh", borderRadius: "8px", objectFit: "contain" }} />
          </div>
        )}
      </div>
    );
  }

  // Multi-image layout: Responsive (Desktop 2/3 + 1/3 grid, Mobile horizontal scroll)
  const mainImage = cleanImages[0];
  const sideImages = cleanImages.slice(1, 5);

  return (
    <div style={{ marginBottom: "1.25rem" }}>
      {/* Mobile Horizontal Swipe Slider (< 768px) */}
      <div
        className="mobile-gallery-slider no-scrollbar"
        style={{
          display: "flex",
          gap: "10px",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          paddingBottom: "4px",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {cleanImages.map((img, idx) => (
          <div
            key={idx}
            style={{
              flex: "0 0 84vw",
              scrollSnapAlign: "start",
              height: "220px",
              borderRadius: "12px",
              overflow: "hidden",
              background: "#f1f5f9",
            }}
          >
            <img
              src={img}
              alt={`${title} - 图 ${idx + 1}`}
              onClick={() => setSelectedImg(img)}
              style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }}
            />
          </div>
        ))}
      </div>

      {/* Desktop Grid Layout (>= 768px) */}
      <div
        className="desktop-gallery-grid"
        style={{
          display: "grid",
          gridTemplateColumns: sideImages.length > 0 ? "2fr 1fr" : "1fr",
          gap: "8px",
          height: "340px",
          borderRadius: "14px",
          overflow: "hidden",
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
          background: "#f1f5f9",
        }}
      >
        <div style={{ height: "100%", overflow: "hidden" }}>
          <img
            src={mainImage}
            alt={`${title} - 主图`}
            onClick={() => setSelectedImg(mainImage)}
            style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }}
          />
        </div>

        {sideImages.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateRows: sideImages.length === 1 ? "1fr" : sideImages.length === 2 ? "1fr 1fr" : "1fr 1fr",
              gridTemplateColumns: sideImages.length >= 3 ? "1fr 1fr" : "1fr",
              gap: "8px",
              height: "100%",
            }}
          >
            {sideImages.map((img, idx) => (
              <div key={idx} style={{ height: "100%", overflow: "hidden" }}>
                <img
                  src={img}
                  alt={`${title} - 副图 ${idx + 2}`}
                  onClick={() => setSelectedImg(img)}
                  style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedImg && (
        <div
          onClick={() => setSelectedImg(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.85)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <img src={selectedImg} alt={title} style={{ maxWidth: "95vw", maxHeight: "90vh", borderRadius: "8px", objectFit: "contain" }} />
        </div>
      )}
    </div>
  );
}
