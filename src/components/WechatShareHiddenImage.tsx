import React from "react";

export interface WechatShareHiddenImageProps {
  imageUrl?: string;
  alt?: string;
}

/**
 * 微信与社交分享爬虫静态首图占位组件
 * 放置在详情页 HTML 最前部（尺寸强制 >= 300x300），
 * 处于文档流且定位在屏幕不可见区域，确保微信爬虫、朋友圈转发与各大社交平台抓取机器人
 * 在不执行 JavaScript 的静态解析模式下，100% 捕获并渲染高清缩略图封面。
 */
export default function WechatShareHiddenImage({
  imageUrl = "https://iyanglin.com/share/v2/default.png?v=20260912",
  alt = "分享缩略图",
}: WechatShareHiddenImageProps) {
  if (!imageUrl) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        top: "-9999px",
        left: "-9999px",
        width: "1px",
        height: "1px",
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: -1,
      }}
    >
      <img
        src={imageUrl}
        alt={alt}
        width={300}
        height={300}
        style={{
          width: "300px",
          height: "300px",
          maxWidth: "none",
          maxHeight: "none",
          objectFit: "cover",
          display: "block",
        }}
      />
    </div>
  );
}
