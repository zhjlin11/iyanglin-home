"use client";

import { useState } from "react";

type HouseImageProps = {
  src?: string | null;
  alt: string;
  loading?: "eager" | "lazy";
};

export default function HouseImage({ src, alt, loading = "lazy" }: HouseImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="homepick-image-fallback" role="img" aria-label={`${alt}暂无实景图片`}>
        <span aria-hidden="true">🏡</span>
        <strong>杨林真实好房</strong>
        <small>图片整理中 · 房源信息可正常查看</small>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
}
