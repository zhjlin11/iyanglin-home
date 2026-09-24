"use client";

import { use, useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import Link from "next/link";

type Item = {
  id: string;
  kind: "article" | "job" | "listing";
  title: string;
  company?: string;
  category?: string;
  contact?: string;
  body: string;
  status: string;
  createdAt: string;
};

const labels: Record<string, string> = {
  draft: "草稿",
  pending: "待审核",
  approved: "已发布",
  offline: "已下线",
};

const kindLabels: Record<Item["kind"], string> = {
  article: "文章",
  job: "招聘",
  listing: "分类信息",
};

export default function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [item, setItem] = useState<Item | null>(null);

  useEffect(() => {
    fetch("/api/content")
      .then((response) => response.json())
      .then((data) => setItem((data.items || []).find((entry: Item) => entry.id === id) || null));
  }, [id]);

  if (!item) {
    return (
      <AdminLayout title="内容预览" subtitle="正在加载...">
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "40px", textAlign: "center", color: "#6b7280" }}>
          正在加载内容预览...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={`内容预览 · ${item.title}`}
      subtitle={`类型：${kindLabels[item.kind] || item.kind} · 状态：${labels[item.status] || item.status} · 发布时间：${new Date(item.createdAt).toLocaleDateString("zh-CN")}`}
      actionButton={
        <div style={{ display: "flex", gap: "8px" }}>
          <Link href="/admin/content" style={{ padding: "6px 14px", borderRadius: "6px", background: "#f3f4f6", border: "1px solid #d1d5db", color: "#374151", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>
            ← 返回列表
          </Link>
          <Link href={`/admin/content/${item.id}/edit`} style={{ padding: "6px 14px", borderRadius: "6px", background: "#1677FF", color: "#ffffff", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>
            编辑内容
          </Link>
        </div>
      }
    >
      <div className="shell detail-shell" style={{ maxWidth: "100%", margin: 0, padding: 0 }}>
        <div className="detail-meta" style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
          <span style={{ padding: "3px 10px", borderRadius: "4px", background: "#EFF6FF", color: "#1D4ED8", fontWeight: 600, fontSize: "13px" }}>{kindLabels[item.kind]}</span>
          <span style={{ padding: "3px 10px", borderRadius: "4px", background: "#F3F4F6", color: "#374151", fontSize: "13px" }}>{labels[item.status] || item.status}</span>
          {item.company && <span style={{ padding: "3px 10px", borderRadius: "4px", background: "#F0FDF4", color: "#15803D", fontSize: "13px" }}>{item.company}</span>}
          {item.category && <span style={{ padding: "3px 10px", borderRadius: "4px", background: "#FEF3C7", color: "#92400E", fontSize: "13px" }}>{item.category}</span>}
          {item.contact && <span style={{ padding: "3px 10px", borderRadius: "4px", background: "#F1F5F9", color: "#475569", fontSize: "13px" }}>📞 {item.contact}</span>}
        </div>
        <article className="detail-body" style={{ background: "#ffffff", padding: "20px", borderRadius: "8px", border: "1px solid #e5e7eb", lineHeight: 1.8 }}>
          {item.body.split("\n").map((line, index) => (
            <p key={index} style={{ margin: "0 0 10px 0" }}>{line || "\u00A0"}</p>
          ))}
        </article>
      </div>
    </AdminLayout>
  );
}
