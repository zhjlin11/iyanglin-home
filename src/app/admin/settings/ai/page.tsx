"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface AiStats {
  todayCalls: number;
  todayTokens: number;
  todayCostCents: number;
  avgLatencyMs: number;
  sceneStats: Array<{
    scene: string;
    _count: { id: number };
    _sum: { inputTokens: number | null; outputTokens: number | null };
  }>;
}

export default function AdminAiSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [testResult, setTestResult] = useState<any>(null);

  const [form, setForm] = useState({
    provider: "qwen",
    model: "qwen-turbo",
    endpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    apiKey: "",
    temperature: 0.7,
    maxTokens: 1000,
    timeoutMs: 15000,
    enabled: true,
    searchAiEnabled: true,
    publishAiEnabled: true,
    customerAiEnabled: true,
    operationsAiEnabled: true,
    businessAiEnabled: true,
    dailyTokenLimit: 1000000,
    userDailyCallLimit: 30,
    vipDailyCallLimit: 150,
  });

  const [stats, setStats] = useState<AiStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ai/config");
      const data = await res.json();
      if (data.success) {
        setForm((prev) => ({
          ...prev,
          ...data.config,
        }));
        setStats(data.stats);
        setRecentLogs(data.recentLogs || []);
      } else {
        setError(data.error || "获取AI配置失败");
      }
    } catch (e: any) {
      setError("网络错误，无法加载AI配置");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/admin/ai/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("✅ AI 模型与场景配置保存成功！");
        fetchConfig();
      } else {
        setError(data.error || "保存失败");
      }
    } catch (e: any) {
      setError("网络异常，保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnect = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/ai/config?action=test");
      const data = await res.json();
      setTestResult(data);
    } catch (e: any) {
      setTestResult({ ok: false, message: e.message || "测试请求失败" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <AdminLayout title="🤖 AI 模型与成本中心">
      <div className="space-y-6 pb-12">
        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500">今日调用量</div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {stats?.todayCalls ?? 0} <span className="text-sm font-normal text-slate-400">次</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500">今日 Token 消耗</div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {((stats?.todayTokens ?? 0) / 1000).toFixed(1)}{" "}
              <span className="text-sm font-normal text-slate-400">k Tokens</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500">今日预估成本</div>
            <div className="text-2xl font-bold text-emerald-600 mt-2">
              ¥{((stats?.todayCostCents ?? 0) / 100).toFixed(2)}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500">平均响应延迟</div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {stats?.avgLatencyMs ?? 0} <span className="text-sm font-normal text-slate-400">ms</span>
            </div>
          </div>
        </div>

        {/* Test Connectivity Banner */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">⚡ 模型连通性即时检测</h3>
            <p className="text-xs text-slate-500 mt-1">
              向已配置的 LLM 服务发送 Ping 请求，测试 API Key 响应速度与配额状态。
            </p>
          </div>
          <button
            type="button"
            onClick={handleTestConnect}
            disabled={testing}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-all shrink-0"
          >
            {testing ? "测试连通中..." : "⚡ 测试连通性"}
          </button>
        </div>

        {testResult && (
          <div
            className={`p-4 rounded-xl text-xs font-medium border ${
              testResult.ok
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            <div className="font-bold">{testResult.ok ? "连通测试成功！" : "连通测试未通过（已启用本地规则兜底）："}</div>
            <div className="mt-1">{testResult.message || JSON.stringify(testResult)}</div>
          </div>
        )}

        {message && (
          <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold">
            {message}
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Configuration Form */}
        <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-800">模型底座与凭证</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">模型服务商 (Provider)</label>
                <select
                  value={form.provider}
                  onChange={(e) => setForm({ ...form, provider: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 outline-none"
                >
                  <option value="qwen">阿里云百炼 (DashScope / 通义千问)</option>
                  <option value="deepseek">DeepSeek (深度求索)</option>
                  <option value="doubao">火山引擎 (豆包大模型)</option>
                  <option value="openai">OpenAI 兼容接口</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">模型标识 (Model Name)</label>
                <input
                  type="text"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="如: qwen-turbo, deepseek-chat"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">API Base URL</label>
                <input
                  type="text"
                  value={form.endpoint}
                  onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">API Key (密钥脱敏保存)</label>
                <input
                  type="password"
                  value={form.apiKey}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                  placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 outline-none font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">留空将保持当前服务器环境变量中配置的 Key。</p>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Scene Toggles */}
          <div>
            <h2 className="text-base font-bold text-slate-800">业务场景启停开关</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-4">
              <label className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer border border-slate-200">
                <input
                  type="checkbox"
                  checked={form.searchAiEnabled}
                  onChange={(e) => setForm({ ...form, searchAiEnabled: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">🤖 问问生活助手</div>
                  <div className="text-[10px] text-slate-500">意图解析与多频道找房/找工</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer border border-slate-200">
                <input
                  type="checkbox"
                  checked={form.publishAiEnabled}
                  onChange={(e) => setForm({ ...form, publishAiEnabled: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">✍️ 发布辅助与质检</div>
                  <div className="text-[10px] text-slate-500">发帖智能润色与违规初筛</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer border border-slate-200">
                <input
                  type="checkbox"
                  checked={form.customerAiEnabled}
                  onChange={(e) => setForm({ ...form, customerAiEnabled: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">💬 智能客服中心</div>
                  <div className="text-[10px] text-slate-500">24小时规则与收费智能问答</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer border border-slate-200">
                <input
                  type="checkbox"
                  checked={form.businessAiEnabled}
                  onChange={(e) => setForm({ ...form, businessAiEnabled: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">🚀 商家经营 Copilot</div>
                  <div className="text-[10px] text-slate-500">师傅与商户经营诊断建议</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer border border-slate-200">
                <input
                  type="checkbox"
                  checked={form.operationsAiEnabled}
                  onChange={(e) => setForm({ ...form, operationsAiEnabled: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">🎯 运营机会雷达</div>
                  <div className="text-[10px] text-slate-500">搜索0结果词与供给缺口挖掘</div>
                </div>
              </label>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Quotas */}
          <div>
            <h2 className="text-base font-bold text-slate-800">配额熔断与流控</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">全站每日 Token 上限</label>
                <input
                  type="number"
                  value={form.dailyTokenLimit}
                  onChange={(e) => setForm({ ...form, dailyTokenLimit: Number(e.target.value) })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">普通用户每日调用上限 (次)</label>
                <input
                  type="number"
                  value={form.userDailyCallLimit}
                  onChange={(e) => setForm({ ...form, userDailyCallLimit: Number(e.target.value) })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">VIP 用户每日调用上限 (次)</label>
                <input
                  type="number"
                  value={form.vipDailyCallLimit}
                  onChange={(e) => setForm({ ...form, vipDailyCallLimit: Number(e.target.value) })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
            >
              {saving ? "正在保存配置..." : "保存 AI 配置与规则"}
            </button>
          </div>
        </form>

        {/* Recent Logs Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">最新 AI 调用日志流水</h3>
            <span className="text-xs text-slate-400">保留最近 50 条调用记录</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">调用场景</th>
                  <th className="py-3 px-4">模型</th>
                  <th className="py-3 px-4">Tokens (入/出)</th>
                  <th className="py-3 px-4">耗时</th>
                  <th className="py-3 px-4">状态</th>
                  <th className="py-3 px-4">调用时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      暂无调用记录
                    </td>
                  </tr>
                ) : (
                  recentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-semibold text-slate-800">{log.scene}</td>
                      <td className="py-3 px-4">{log.model}</td>
                      <td className="py-3 px-4 font-mono">
                        {log.inputTokens || 0} / {log.outputTokens || 0}
                      </td>
                      <td className="py-3 px-4">{log.latencyMs}ms</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.status === "SUCCESS"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {log.status === "SUCCESS" ? "成功" : log.status === "FALLBACK" ? "规则兜底" : "失败"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
