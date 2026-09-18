"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function WorkspaceDeveloperPage() {
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string>("");
  const [keys, setKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);

  // Modals
  const [newKeyModal, setNewKeyModal] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [newKeyResult, setNewKeyResult] = useState<any>(null);

  const [newWebhookModal, setNewWebhookModal] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [testResult, setTestResult] = useState<any>(null);
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);

  const fetchWorkspaces = async () => {
    try {
      const res = await fetch("/api/v1/workspace");
      const data = await res.json();
      if (data.success && data.workspaces?.length > 0) {
        setOrganizations(data.workspaces);
        setActiveOrgId(data.workspaces[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDevData = async (orgId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/developer/apps?organizationId=${orgId}`);
      const data = await res.json();
      if (data.success) {
        setKeys(data.keys || []);
        setWebhooks(data.webhooks || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (activeOrgId) fetchDevData(activeOrgId);
  }, [activeOrgId]);

  const handleCreateKey = async () => {
    if (!activeOrgId || !keyName.trim()) return;
    try {
      const res = await fetch("/api/v1/developer/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_key",
          organizationId: activeOrgId,
          name: keyName.trim(),
          scopes: ["jobs:read", "jobs:write", "orders:read", "leads:read"],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewKeyResult(data.app);
        fetchDevData(activeOrgId);
      } else {
        alert(data.error || "创建失败");
      }
    } catch {
      alert("网络错误");
    }
  };

  const handleCreateWebhook = async () => {
    if (!activeOrgId || !webhookUrl.trim()) return;
    try {
      const res = await fetch("/api/v1/developer/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_webhook",
          organizationId: activeOrgId,
          url: webhookUrl.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewWebhookModal(false);
        setWebhookUrl("");
        fetchDevData(activeOrgId);
      } else {
        alert(data.error || "创建失败");
      }
    } catch {
      alert("网络错误");
    }
  };

  const handleTestWebhook = async (endpointId: string) => {
    setTestingWebhookId(endpointId);
    setTestResult(null);
    try {
      const res = await fetch("/api/v1/developer/webhook-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpointId }),
      });
      const data = await res.json();
      setTestResult(data);
      fetchDevData(activeOrgId);
    } catch (e: any) {
      alert("测试异常: " + e.message);
    } finally {
      setTestingWebhookId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* 顶部导航 */}
      <header className="bg-slate-800/80 backdrop-blur border-b border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <Link href="/workspace" className="text-slate-400 hover:text-white text-sm font-bold flex items-center space-x-1">
            <span>&lt; 返回工作台</span>
          </Link>
          <span className="text-slate-600">|</span>
          <div className="font-extrabold text-base text-white flex items-center space-x-2">
            <span>🔌</span>
            <span>开发者中心 · 开放接口与系统集成</span>
            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">
              OpenAPI & Webhooks
            </span>
          </div>
        </div>

        {/* 组织切换 */}
        {organizations.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">当前归属:</span>
            <select
              value={activeOrgId}
              onChange={(e) => setActiveOrgId(e.target.value)}
              className="bg-slate-800 text-xs font-bold text-slate-200 border border-slate-600 rounded-xl px-3 py-1.5 focus:outline-none"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      {/* 主体内容 */}
      <main className="max-w-6xl w-full mx-auto p-6 space-y-6 flex-1">
        {/* 说明横幅 */}
        <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/30 rounded-3xl p-6 shadow-xl">
          <div className="font-extrabold text-lg text-white mb-2">🚀 将您的企业 ERP/HR 或自建系统与杨林生活网实时互通</div>
          <div className="text-sm text-slate-300 leading-relaxed max-w-3xl">
            提供标准且高安全等级的 OpenAPI 与 Webhooks 事件推送。支持职位自动同步发布、候选人投递推送、服务订单履约流转与商机线索自动流转。所有数据均受组织物理强隔离保护。
          </div>
        </div>

        {/* 模块1: 开发者凭证与 API Token */}
        <div className="bg-slate-800/60 rounded-3xl border border-slate-700/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-base text-white">🔑 开放平台 API Key 凭据</div>
              <div className="text-xs text-slate-400 mt-0.5">用于第三方服务端向平台发起标准请求鉴权</div>
            </div>
            <button
              onClick={() => {
                setKeyName("");
                setNewKeyResult(null);
                setNewKeyModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow transition-all"
            >
              + 创建新凭据
            </button>
          </div>

          {loading ? (
            <div className="text-xs text-slate-500 py-4 text-center">正在加载凭证...</div>
          ) : keys.length === 0 ? (
            <div className="text-xs text-slate-500 py-6 text-center">暂未创建 API Key，点击右上角添加</div>
          ) : (
            <div className="divide-y divide-slate-700/60">
              {keys.map((k) => (
                <div key={k.id} className="py-3 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-200">{k.name}</span>
                      <span className="text-[10px] font-mono bg-slate-700/80 px-2 py-0.5 rounded text-slate-300">
                        {k.keyPrefix}****
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center space-x-2">
                      <span>授权权限:</span>
                      <span className="text-blue-400 font-mono">{k.scopes.join(", ")}</span>
                    </div>
                  </div>
                  <div className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    ● 正常有效
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 模块2: Webhook 事件推送配置 */}
        <div className="bg-slate-800/60 rounded-3xl border border-slate-700/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-base text-white">⚡ Webhooks 事件主动推送</div>
              <div className="text-xs text-slate-400 mt-0.5">当发生订单支付、客户下单或简历投递时，实时向您的服务器发送 HTTP POST 报文</div>
            </div>
            <button
              onClick={() => setNewWebhookModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow transition-all"
            >
              + 订阅新终端
            </button>
          </div>

          {webhooks.length === 0 ? (
            <div className="text-xs text-slate-500 py-6 text-center">暂未配置 Webhook 回调地址</div>
          ) : (
            <div className="space-y-4">
              {webhooks.map((wh) => (
                <div key={wh.id} className="p-4 bg-slate-800 rounded-2xl border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-xs text-blue-300 truncate max-w-md">{wh.url}</div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleTestWebhook(wh.id)}
                        disabled={testingWebhookId === wh.id}
                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-xs font-bold rounded-lg text-slate-200 transition-all"
                      >
                        {testingWebhookId === wh.id ? "发送中..." : "🧪 发送测试 Ping"}
                      </button>
                      <span className="text-[10px] text-slate-400 font-mono">失败重试: {wh.failureCount}次</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                    <span>订阅事件:</span>
                    <span className="font-mono text-indigo-300">{wh.events.join(" | ")}</span>
                  </div>

                  {/* 最近投递记录 */}
                  {wh.deliveries?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-700/60">
                      <div className="text-[10px] font-bold text-slate-400 mb-1">最近投递状态:</div>
                      <div className="space-y-1">
                        {wh.deliveries.slice(0, 2).map((d: any) => (
                          <div key={d.id} className="text-[10px] font-mono flex items-center justify-between text-slate-400">
                            <span>[{d.event}] {d.createdAt.slice(11, 19)}</span>
                            <span className={d.status === "SUCCESS" ? "text-emerald-400" : "text-rose-400"}>
                              状态码 {d.statusCode || 500} ({d.durationMs}ms)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {testResult && (
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-700 text-xs space-y-1 font-mono">
              <div className="font-bold text-slate-300">测试结果反馈:</div>
              <div className={testResult.status === "SUCCESS" ? "text-emerald-400" : "text-rose-400"}>
                状态: {testResult.status} | 状态码: {testResult.statusCode} | 耗时: {testResult.durationMs}ms
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 弹窗: 创建 API Key */}
      {newKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-bold text-white text-base">创建新 API Key 凭证</div>
              <button onClick={() => setNewKeyModal(false)} className="text-slate-400 text-lg">✕</button>
            </div>

            {!newKeyResult ? (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="应用或系统名称 (如: 经开区人事对接系统)"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                />
                <button
                  onClick={handleCreateKey}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow"
                >
                  确认生成密钥
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300">
                  ⚠️ 密钥仅展示一次，请立即复制并妥善保存！
                </div>
                <div className="p-3 bg-slate-900 rounded-xl font-mono text-xs text-emerald-400 break-all select-all">
                  {newKeyResult.rawSecret}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(newKeyResult.rawSecret);
                    alert("已复制到剪贴板！");
                    setNewKeyModal(false);
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow"
                >
                  一键复制并关闭
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 弹窗: 创建 Webhook */}
      {newWebhookModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-bold text-white text-base">配置 Webhook 推送地址</div>
              <button onClick={() => setNewWebhookModal(false)} className="text-slate-400 text-lg">✕</button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="接收端 URL (https://your-server.com/api/webhook)"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
              />
              <button
                onClick={handleCreateWebhook}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow"
              >
                保存并生成 HMAC 签名密钥
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
