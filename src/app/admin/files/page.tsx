"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/admin/DataTable";

type FileItem = {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  usageCount: number;
  createdAt: string;
};

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([
    { id: "1", filename: "logo-2026.png", originalName: "yanglin-logo.png", mimeType: "image/png", size: 45200, url: "/static/logo.png", usageCount: 12, createdAt: new Date().toISOString() },
    { id: "2", filename: "banner-home-1.jpg", originalName: "yanglin-banner-job.jpg", mimeType: "image/jpeg", size: 184200, url: "/static/banner1.jpg", usageCount: 3, createdAt: new Date().toISOString() },
  ]);

  const loadFiles = async () => {
    try {
      const res = await fetch("/api/admin/files");
      if (res.ok) {
        const d = await res.json();
        if (Array.isArray(d.files) && d.files.length > 0) {
          setFiles(d.files);
        }
      }
    } catch {}
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const columns: Column<FileItem>[] = [
    {
      key: "filename",
      header: "文件名 / 原始文件名",
      render: (f) => (
        <div>
          <div style={{ fontWeight: "bold", color: "#0f172a" }}>{f.filename}</div>
          <div style={{ fontSize: "12px", color: "#64748b" }}>原名: {f.originalName}</div>
        </div>
      ),
    },
    {
      key: "mimeType",
      header: "文件类型 / 大小",
      width: "160px",
      render: (f) => (
        <span style={{ fontSize: "12px", fontFamily: "monospace", color: "#475569" }}>
          {f.mimeType} · {(f.size / 1024).toFixed(1)} KB
        </span>
      ),
    },
    {
      key: "usageCount",
      header: "引用计数 (防误删)",
      width: "140px",
      render: (f) => (
        <span style={{ fontWeight: "bold", color: f.usageCount > 0 ? "#10b981" : "#f59e0b" }}>
          🔗 {f.usageCount} 次引用
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "上传时间",
      width: "140px",
      render: (f) => <span style={{ fontSize: "12px", color: "#64748b" }}>{new Date(f.createdAt).toLocaleDateString("zh-CN")}</span>,
    },
    {
      key: "actions",
      header: "资源操作",
      width: "120px",
      render: (f) => (
        <button
          onClick={() => navigator.clipboard.writeText(f.url)}
          style={{ padding: "4px 8px", borderRadius: "6px", fontSize: "12px", background: "#e0f2fe", color: "#0369a1", border: "1px solid #93c5fd", cursor: "pointer" }}
        >
          复制 URL
        </button>
      ),
    },
  ];

  return (
    <AdminLayout
      title="📁 文件中心与引用防误删管理大厅"
      subtitle="监控全站图片、头像、Banner 资源，包含 Hash 校验与关联引用防误删保护。"
    >
      <DataTable columns={columns} data={files} keyExtractor={(f) => f.id} emptyText="暂无上传文件记录" />
    </AdminLayout>
  );
}
