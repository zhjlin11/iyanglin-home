"use client";

import { useState, useRef, useEffect } from "react";

type ImageUploadProps = {
  value: string[];
  onChange: (urls: string[]) => void;
  maxCount?: number;
};

export default function ImageUpload({ value = [], onChange, maxCount = 5 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (!files || files.length === 0) return;

    // 单图模式（如 Logo 或单张封面）：直接智能覆盖替换，避免报错限制
    if (maxCount === 1) {
      setUploading(true);
      try {
        const file = files[files.length - 1]; // 取最新的一张
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const res = await response.json().catch(() => ({}));
          if (response.status === 401) {
            alert(res.error || "请先登录后再上传图片");
            window.location.href = `/login?from=${encodeURIComponent(window.location.pathname)}`;
            return;
          }
          alert(res.error || "图片上传失败，请检查文件大小与格式");
          return;
        }

        const data = await response.json();
        if (data.url) {
          onChange([data.url]);
        }
      } catch (err) {
        alert("上传出错，请检查网络连接");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
      return;
    }

    if (value.length + files.length > maxCount) {
      alert(`最多只能上传 ${maxCount} 张图片，当前已选 ${value.length} 张`);
      return;
    }

    setUploading(true);
    const newUrls = [...value];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const res = await response.json().catch(() => ({}));
          if (response.status === 401) {
            alert(res.error || "请先登录后再上传图片");
            window.location.href = `/login?from=${encodeURIComponent(window.location.pathname)}`;
            return;
          }
          alert(res.error || "图片上传失败，请检查文件大小与格式");
          break;
        }

        const data = await response.json();
        if (data.url) {
          newUrls.push(data.url);
        }
      }
      onChange(newUrls);
    } catch (err) {
      alert("上传出错，请检查网络连接");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 支持读取系统剪贴板（微信截图、网络图片链接、Base64或网页图片）
  const pasteFromClipboard = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    try {
      // 1. 尝试直接从剪贴板读取二进制图片
      if (navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        const imageFiles: File[] = [];

        for (const item of items) {
          for (const type of item.types) {
            if (type.startsWith("image/")) {
              const blob = await item.getType(type);
              const ext = type.split("/")[1] || "png";
              const file = new File([blob], `clipboard-${Date.now()}.${ext}`, { type });
              imageFiles.push(file);
            }
          }
        }

        if (imageFiles.length > 0) {
          await processFiles(imageFiles);
          return;
        }
      }

      // 2. 尝试读取剪贴板文本（如果复制的是图片URL或Base64）
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && (text.startsWith("http://") || text.startsWith("https://") || text.startsWith("data:image/"))) {
          if (text.match(/\.(jpg|jpeg|png|webp|gif)/i) || text.startsWith("data:image/")) {
            setUploading(true);
            try {
              const blob = await fetch(text).then((r) => r.blob());
              const file = new File([blob], `clipboard-${Date.now()}.png`, { type: blob.type || "image/png" });
              await processFiles([file]);
              return;
            } catch {
              // Ignore fetch error
            } finally {
              setUploading(false);
            }
          }
        }
      }

      alert("💡 剪贴板中目前未识别到图片。请使用微信截图（Alt+A）或系统截图（Win+Shift+S）复制图片后，在此直接按 Ctrl+V 即可秒速粘贴上传！");
    } catch (err) {
      alert("💡 请直接在页面或此卡片上按下键盘快捷键 Ctrl+V 进行粘贴上传！");
    }
  };

  // 全局与局部智能监听 Ctrl+V 粘贴事件（微信截图、QQ截图、截图工具与复制的文件）
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      // 检查是否包含图片类型
      let hasImage = false;
      if (clipboardData.types) {
        for (let i = 0; i < clipboardData.types.length; i++) {
          if (clipboardData.types[i].startsWith("image/") || clipboardData.types[i] === "Files") {
            hasImage = true;
            break;
          }
        }
      }

      const imageFiles: File[] = [];

      // 1. 处理 items (截图/位图)
      if (clipboardData.items) {
        for (let i = 0; i < clipboardData.items.length; i++) {
          const item = clipboardData.items[i];
          if (item.type.indexOf("image") !== -1) {
            const file = item.getAsFile();
            if (file) imageFiles.push(file);
          }
        }
      }

      // 2. 处理 files (从文件管理器复制的图片)
      if (imageFiles.length === 0 && clipboardData.files && clipboardData.files.length > 0) {
        for (let i = 0; i < clipboardData.files.length; i++) {
          const file = clipboardData.files[i];
          if (file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(file.name)) {
            imageFiles.push(file);
          }
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        processFiles(imageFiles);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [value, maxCount]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const removeImage = (indexToRemove: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div ref={containerRef} tabIndex={0} style={{ width: "100%", marginTop: "4px", outline: "none" }}>
      {/* 隐藏的真实 File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/svg+xml"
        multiple={maxCount > 1}
        style={{ display: "none" }}
      />

      {/* ========== 单图模式 (maxCount === 1) 专属优雅交互卡片 ========== */}
      {maxCount === 1 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {value.length === 0 ? (
            /* 单图空状态 Dropzone */
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              style={{
                border: isDragOver ? "2px dashed #047857" : "2px dashed #cbd5e1",
                borderRadius: "14px",
                background: isDragOver ? "#f0fdf4" : uploading ? "#f8fafc" : "#ffffff",
                padding: "1.75rem 1.25rem",
                textAlign: "center",
                cursor: uploading ? "not-allowed" : "pointer",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: isDragOver ? "0 8px 24px rgba(4, 120, 87, 0.12)" : "none",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: isDragOver ? "#dcfce7" : "#f1f5f9",
                  color: isDragOver ? "#047857" : "#0d9488",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  margin: "0 auto 10px auto",
                  transition: "transform 0.2s",
                  transform: isDragOver ? "scale(1.1)" : "none",
                }}
              >
                {uploading ? "⏳" : "📷"}
              </div>

              <div style={{ fontWeight: "700", fontSize: "14px", color: "#0f172a", marginBottom: "4px" }}>
                {uploading ? "正在上传图片中，请稍候..." : "点击选择本地图片、拖拽新图或直接按 Ctrl+V 粘贴"}
              </div>
              
              <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "12px" }}>
                支持 PNG(透明底)、JPG、WEBP、SVG · 微信截图后直接按 Ctrl+V
              </div>

              <button
                type="button"
                onClick={pasteFromClipboard}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "20px",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  color: "#047857",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(4, 120, 87, 0.08)",
                }}
              >
                <span>📋</span> 从剪贴板粘贴截图 (Ctrl+V)
              </button>
            </div>
          ) : (
            /* 单图已有图片状态：点击图片即可更换，右侧提供更换与粘贴操作条 */
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "12px",
                borderRadius: "14px",
                border: isDragOver ? "2px dashed #047857" : "1px solid #e2e8f0",
                background: isDragOver ? "#f0fdf4" : "#f8fafc",
                transition: "all 0.2s ease",
              }}
            >
              {/* 可点击更换的图片预览卡片 */}
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                style={{
                  position: "relative",
                  width: "100px",
                  height: "100px",
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: "2px solid #cbd5e1",
                  background: "#ffffff",
                  cursor: "pointer",
                  flexShrink: 0,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                }}
                title="点击即可选择本地新图进行更换"
              >
                <img
                  src={value[0]}
                  alt="当前已上传图"
                  style={{ width: "100%", height: "100%", objectFit: "contain", padding: "4px" }}
                />

                {/* 悬停遮罩提示 */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(15, 23, 42, 0.65)",
                    color: "white",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "2px",
                    opacity: uploading ? 1 : 0,
                    transition: "opacity 0.2s",
                    fontSize: "11px",
                    fontWeight: "bold",
                  }}
                  onMouseEnter={(e) => {
                    if (!uploading) (e.currentTarget as HTMLElement).style.opacity = "1";
                  }}
                  onMouseLeave={(e) => {
                    if (!uploading) (e.currentTarget as HTMLElement).style.opacity = "0";
                  }}
                >
                  <span style={{ fontSize: "16px" }}>{uploading ? "⏳" : "🔄"}</span>
                  <span>{uploading ? "上传中..." : "点击更换"}</span>
                </div>
              </div>

              {/* 快捷操作区 */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>
                  {uploading ? "⏳ 正在上传替换中..." : "✅ 图片已就绪 (可随时更换或覆盖)"}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  点击左侧图片、点击下方按钮，或直接在页面按 <kbd style={{ background: "#e2e8f0", padding: "1px 5px", borderRadius: "4px", fontSize: "11px" }}>Ctrl+V</kbd> 即可秒级覆盖更换
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "2px" }}>
                  {/* 弹出文件选择器按钮 */}
                  <button
                    type="button"
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      background: "#047857",
                      color: "white",
                      fontSize: "12px",
                      fontWeight: "700",
                      border: "none",
                      cursor: uploading ? "not-allowed" : "pointer",
                      transition: "opacity 0.15s",
                    }}
                  >
                    <span>📁</span> 选择本地新图
                  </button>

                  {/* 从剪贴板粘贴按钮 */}
                  <button
                    type="button"
                    onClick={pasteFromClipboard}
                    disabled={uploading}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      color: "#0f172a",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: uploading ? "not-allowed" : "pointer",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    }}
                  >
                    <span>📋</span> 粘贴剪贴板截图
                  </button>

                  {/* 清空删除按钮 */}
                  <button
                    type="button"
                    onClick={(e) => removeImage(0, e)}
                    disabled={uploading}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "6px 10px",
                      borderRadius: "8px",
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#dc2626",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: uploading ? "not-allowed" : "pointer",
                    }}
                  >
                    <span>🗑️</span> 清除
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ========== 多图模式 (maxCount > 1) 画廊与追加插槽 ========== */
        <div>
          {/* 顶栏辅助操作提示与一键粘贴 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <div style={{ fontSize: "12px", color: "#64748b" }}>
              已上传 <b style={{ color: "#047857" }}>{value.length}</b>/{maxCount} 张 · 支持拖拽/本地选择/直接按 Ctrl+V 粘贴
            </div>
            {value.length < maxCount && (
              <button
                type="button"
                onClick={pasteFromClipboard}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 10px",
                  borderRadius: "14px",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  color: "#047857",
                  fontSize: "11.5px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                <span>📋</span> 粘贴截图 (Ctrl+V)
              </button>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "12px" }}>
            {value.map((url, index) => (
              <div
                key={index}
                style={{
                  position: "relative",
                  aspectRatio: "1 / 1",
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  background: "#f1f5f9",
                }}
              >
                <img
                  src={url}
                  alt={`实拍图 ${index + 1}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />

                {/* 首张封面标牌 */}
                {index === 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "6px",
                      left: "6px",
                      background: "rgba(4, 120, 87, 0.9)",
                      backdropFilter: "blur(4px)",
                      color: "white",
                      fontSize: "10px",
                      fontWeight: "bold",
                      padding: "2px 6px",
                      borderRadius: "6px",
                    }}
                  >
                    主图封面
                  </div>
                )}

                {/* 删除按钮 */}
                <button
                  type="button"
                  onClick={(e) => removeImage(index, e)}
                  style={{
                    position: "absolute",
                    top: "6px",
                    right: "6px",
                    background: "rgba(15, 23, 42, 0.75)",
                    backdropFilter: "blur(4px)",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: "22px",
                    height: "22px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    fontWeight: "bold",
                    transition: "background 0.15s, transform 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "#ef4444";
                    (e.currentTarget as HTMLElement).style.transform = "scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(15, 23, 42, 0.75)";
                    (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                  }}
                  title="删除此图片"
                >
                  ✕
                </button>
              </div>
            ))}

            {/* 追加图片插槽 */}
            {value.length < maxCount && (
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                style={{
                  aspectRatio: "1 / 1",
                  borderRadius: "12px",
                  border: isDragOver ? "2px dashed #047857" : "2px dashed #cbd5e1",
                  background: isDragOver ? "#f0fdf4" : uploading ? "#f8fafc" : "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: uploading ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                  gap: "4px",
                }}
              >
                <span style={{ fontSize: "20px", color: isDragOver ? "#047857" : "#0d9488" }}>
                  {uploading ? "⏳" : "＋"}
                </span>
                <span style={{ fontSize: "11px", fontWeight: "700", color: isDragOver ? "#047857" : "#64748b" }}>
                  {uploading ? "上传中..." : "继续添加"}
                </span>
                <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                  {value.length}/{maxCount}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
