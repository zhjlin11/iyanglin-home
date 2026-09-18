"use client";

import { useState } from "react";
import ShopPlaceholderCover from "./ShopPlaceholderCover";

export default function ShopCardImage({
  src,
  alt,
  category = "food",
}: {
  src?: string;
  alt?: string;
  category?: string;
}) {
  const [error, setError] = useState(false);

  const isBrokenOrDummy = !src || error || src.includes("example.com") || !src.startsWith("http");

  if (isBrokenOrDummy) {
    return <ShopPlaceholderCover name={alt || "商家"} category={category} />;
  }

  return (
    <img
      src={src}
      alt={alt || ""}
      onError={() => setError(true)}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
}
