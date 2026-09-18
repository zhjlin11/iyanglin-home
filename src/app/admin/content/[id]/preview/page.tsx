"use client";

import { use, useEffect, useState } from "react";
import AdminNavbar from "@/components/AdminNavbar";

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
      <main className="admin-page">
        <div className="shell admin-shell">
          <p>正在加载预览...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <AdminNavbar />
      <div className="shell detail-shell">
        <span className="eyebrow">内容预览</span>
        <h1>{item.title}</h1>
        <div className="detail-meta">
          <span>{kindLabels[item.kind]}</span>
          <span>{labels[item.status] || item.status}</span>
          {item.company && <span>{item.company}</span>}
          {item.category && <span>{item.category}</span>}
          {item.contact && <span>{item.contact}</span>}
          <time>{new Date(item.createdAt).toLocaleDateString("zh-CN")}</time>
        </div>
        <article className="detail-body">
          {item.body.split("\n").map((line, index) => (
            <p key={index}>{line || " "}</p>
          ))}
        </article>
        <a className="button button-primary" href={`/admin/content/${item.id}/edit`}>编辑内容</a>
      </div>
    </main>
  );
}
