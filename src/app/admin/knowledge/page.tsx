"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function AdminKnowledgePage() {
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<any[]>([]);
  const [createModal, setCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("RULE");
  const [content, setContent] = useState("");
  const [source, setSource] = useState("");

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/knowledge");
      const json = await res.json();
      if (json.success) {
        setArticles(json.articles || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) return;
    try {
      const res = await fetch("/api/v1/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category,
          content: content.trim(),
          source: source.trim() || "平台运营规范",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCreateModal(false);
        setTitle("");
        setContent("");
        setSource("");
        fetchArticles();
      } else {
        alert(json.error || "创建失败");
      }
    } catch {
      alert("网络错误");
    }
  };

  return (
    <AdminLayout title="平台统一知识库与规范治理">
      <div className="space-y-6 pb-12">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="font-extrabold text-base text-slate-800">📚 官方知识沉淀与引用出处管理</div>
            <div className="text-xs text-slate-500 mt-1">
              作为 AI Agent、智能客服与搜索引用的可信证据底座，严禁非可信来源入库。
            </div>
          </div>
          <button
            onClick={() => setCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow"
          >
            + 录入正式知识条目
          </button>
        </div>

        {/* 知识列表 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {articles.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">暂无知识库条目，可点击右上角添加</div>
            ) : (
              articles.map((art) => (
                <div key={art.id} className="p-4 space-y-2 hover:bg-slate-50 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-800">{art.title}</span>
                      <span className="text-[10px] font-mono bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-200">
                        {art.category}
                      </span>
                      {art.organizationId && (
                        <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-200">
                          🔒 企业私有知识
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      <span>👍 {art.helpfulCount} | 浏览: {art.viewCount}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {art.content}
                  </div>

                  <div className="text-[10px] text-slate-400 flex items-center space-x-4">
                    <span>来源出处: {art.source || "官方文档"}</span>
                    <span>维护人: {art.owner || "管理员"}</span>
                    <span>更新时间: {art.updatedAt.slice(0, 10)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 创建知识条目模态框 */}
      {createModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="font-bold text-base text-slate-800">录入正式平台知识库条目</div>
              <button onClick={() => setCreateModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">条目标题</label>
                <input
                  type="text"
                  placeholder="例如: 杨林经开区重点企业用工补贴申请流程"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">分类</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none bg-white"
                >
                  <option value="RULE">平台规则与退款政策</option>
                  <option value="POLICY">经开区政府与用工政策</option>
                  <option value="GUIDE">便民办事与租房指南</option>
                  <option value="FAQ">常见问答与服务收费标准</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">正文内容 (供 AI 提取与引用)</label>
                <textarea
                  rows={4}
                  placeholder="详细准确的内容..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">官方出处来源</label>
                <input
                  type="text"
                  placeholder="例如: 嵩明县人社局公告2026年第3号"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <button
                onClick={handleCreate}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow mt-2"
              >
                确认审核入库
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
