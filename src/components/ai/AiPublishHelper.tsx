"use client";

import React, { useState } from "react";

interface AiPublishHelperProps {
  channel: "JOB" | "HOUSE" | "INFO" | "HAODIAN";
  onApplyDraft?: (draft: { title: string; body: string; tags?: string[] }) => void;
  currentTitle?: string;
  currentBody?: string;
}

export default function AiPublishHelper({
  channel,
  onApplyDraft,
  currentTitle = "",
  currentBody = "",
}: AiPublishHelperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<"WRITE" | "CHECK">("WRITE");
  const [promptInput, setPromptInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Generated draft
  const [draftResult, setDraftResult] = useState<{
    title: string;
    body: string;
    tags?: string[];
  } | null>(null);

  // Quality check result
  const [checkResult, setCheckResult] = useState<{
    score: number;
    passed: boolean;
    suggestions: string[];
    riskLevel: string;
  } | null>(null);

  const handleGenerateDraft = async () => {
    if (!promptInput.trim()) return;
    setLoading(true);
    setDraftResult(null);

    try {
      const res = await fetch("/api/ai/publish-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          rawPoints: promptInput,
        }),
      });

      const data = await res.json();
      if (data.success && data.draft) {
        setDraftResult(data.draft);
      } else {
        alert(data.error || "生成失败，请重试");
      }
    } catch (e) {
      alert("网络异常，无法连接 AI 写作助手");
    } finally {
      setLoading(false);
    }
  };

  const handleRunCheck = async () => {
    if (!currentTitle && !currentBody) {
      alert("请先填写标题或正文再进行质量与风控自检");
      return;
    }
    setLoading(true);
    setCheckResult(null);

    try {
      const res = await fetch("/api/ai/quality-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: channel,
          title: currentTitle,
          content: currentBody,
          body: currentBody,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCheckResult({
          score: data.score,
          passed: data.passed,
          suggestions: data.suggestions || [],
          riskLevel: data.riskLevel || "LOW",
        });
      } else {
        alert(data.error || "自检失败，请稍后再试");
      }
    } catch (e) {
      alert("网络异常，自检失败");
    } finally {
      setLoading(false);
    }
  };

  const applyDraft = () => {
    if (!draftResult || !onApplyDraft) return;
    onApplyDraft(draftResult);
    setIsOpen(false);
  };

  return (
    <div className="inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-xs font-semibold transition-colors"
      >
        <span>🤖</span>
        <span>AI 智能润色 & 自检</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <div>
                  <h3 className="text-base font-bold text-slate-800">AI 发帖助手 · 智能合规</h3>
                  <p className="text-xs text-slate-500">自动扩充润色 · 排版规范 · 敏感词与虚假收费筛查</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => setTab("WRITE")}
                className={`flex-1 py-2 text-xs font-bold border-b-2 text-center transition-colors ${
                  tab === "WRITE"
                    ? "border-teal-600 text-teal-700 bg-teal-50/50"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                ✍️ 智能帮写 / 润色
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("CHECK");
                  handleRunCheck();
                }}
                className={`flex-1 py-2 text-xs font-bold border-b-2 text-center transition-colors ${
                  tab === "CHECK"
                    ? "border-teal-600 text-teal-700 bg-teal-50/50"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                🛡️ 发帖质量与风控自检
              </button>
            </div>

            {/* Tab 1: AI Write */}
            {tab === "WRITE" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    输入核心要点（随便写几个词，AI 帮你扩充为专业文案）：
                  </label>
                  <textarea
                    rows={3}
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    placeholder="如：经开区食品厂招包装工，5500包吃住，月休4天，男女不限..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-teal-500 outline-none resize-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleGenerateDraft}
                    disabled={loading || !promptInput.trim()}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                  >
                    {loading ? "AI 正在构思生成中..." : "一键生成专业文案 ✨"}
                  </button>
                </div>

                {draftResult && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 mt-2">
                    <div className="text-xs font-bold text-slate-700">建议标题：</div>
                    <div className="text-xs text-slate-900 font-semibold p-2 bg-white rounded-lg border border-slate-200">
                      {draftResult.title}
                    </div>

                    <div className="text-xs font-bold text-slate-700 mt-2">建议正文：</div>
                    <div className="text-xs text-slate-700 p-2 bg-white rounded-lg border border-slate-200 whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {draftResult.body}
                    </div>

                    {draftResult.tags && draftResult.tags.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap pt-1">
                        {draftResult.tags.map((t, i) => (
                          <span key={i} className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-100">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={applyDraft}
                        className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs"
                      >
                        应用到发布表单 ✅
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Quality Check */}
            {tab === "CHECK" && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  自动核验当前已填写的标题与正文，排查涉嫌违规收费、刷单兼职、表述不清或缺失关键信息的问题。
                </p>

                {loading ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    <div className="inline-block animate-spin text-lg mb-2">⏳</div>
                    <div>正在智能评估内容合规度与完整性...</div>
                  </div>
                ) : checkResult ? (
                  <div className="p-4 rounded-xl border border-slate-200 space-y-3 bg-slate-50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">质量与合规综合得分：</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-extrabold ${
                          checkResult.score >= 80
                            ? "text-emerald-600"
                            : checkResult.score >= 60
                            ? "text-amber-500"
                            : "text-rose-600"
                        }`}>
                          {checkResult.score} 分
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          checkResult.riskLevel === "LOW"
                            ? "bg-emerald-100 text-emerald-800"
                            : checkResult.riskLevel === "MEDIUM"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}>
                          {checkResult.riskLevel === "LOW" ? "低风险" : checkResult.riskLevel === "MEDIUM" ? "中风险" : "高风险"}
                        </span>
                      </div>
                    </div>

                    {checkResult.suggestions.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-xs font-bold text-slate-700">优化建议：</div>
                        <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                          {checkResult.suggestions.map((s, idx) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-200">
                      💡 铁律提示：自检结果仅供发布者自我完善，不会自动封禁或修改您的信息。
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <button
                      type="button"
                      onClick={handleRunCheck}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs"
                    >
                      重新检测当前内容 🔍
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
