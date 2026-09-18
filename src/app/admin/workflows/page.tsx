"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function AdminWorkflowsPage() {
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<any[]>([]);
  const [executions, setExecutions] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/workflows");
      const json = await res.json();
      if (json.success) {
        setRules(json.rules || []);
        setExecutions(json.executions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggle = async (ruleId: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/v1/workflows", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruleId, enabled: !currentStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setRules((prev) =>
          prev.map((r) => (r.id === ruleId ? { ...r, enabled: !currentStatus } : r))
        );
      }
    } catch {
      alert("更新失败");
    }
  };

  return (
    <AdminLayout title="业务自动化与工作流中心">
      <div className="space-y-6 pb-12">
        {/* 指标总览 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-400 uppercase">自动化规则总数</div>
            <div className="text-3xl font-extrabold text-slate-800 mt-1">{rules.length}</div>
            <div className="text-xs text-slate-500 mt-1">事件驱动与定时任务</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-emerald-500 uppercase">活跃运行中</div>
            <div className="text-3xl font-extrabold text-emerald-600 mt-1">
              {rules.filter((r) => r.enabled).length}
            </div>
            <div className="text-xs text-slate-500 mt-1">深度限制: depthLimit &le; 3</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-blue-500 uppercase">累计成功触发</div>
            <div className="text-3xl font-extrabold text-blue-600 mt-1">
              {rules.reduce((acc, r) => acc + (r.successCount || 0), 0)}
            </div>
            <div className="text-xs text-slate-500 mt-1">防环路死循环保护</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-rose-500 uppercase">异常失败次数</div>
            <div className="text-3xl font-extrabold text-rose-600 mt-1">
              {rules.reduce((acc, r) => acc + (r.failureCount || 0), 0)}
            </div>
            <div className="text-xs text-slate-500 mt-1">自动降级进入死信队列</div>
          </div>
        </div>

        {/* 规则列表 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="font-bold text-sm text-slate-800">📋 系统内置与租户定制工作流规则</div>
            <span className="text-xs text-slate-500">基于统一业务事件总线 (Event Bus) 响应</span>
          </div>

          <div className="divide-y divide-slate-100">
            {rules.map((rule) => (
              <div key={rule.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-all">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-800">{rule.name}</span>
                    <span className="text-[10px] font-mono bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-200">
                      触发事件: {rule.triggerEvent || "定时任务"}
                    </span>
                    <span className="text-[10px] font-mono bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-200">
                      动作: {rule.actionType}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">{rule.description || "无详细描述"}</div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right text-xs">
                    <div className="text-slate-700 font-mono">成功: {rule.successCount} | 失败: {rule.failureCount}</div>
                    <div className="text-slate-400 text-[10px]">
                      {rule.lastExecutedAt ? `上次执行: ${rule.lastExecutedAt.slice(11, 19)}` : "尚未触发"}
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggle(rule.id, rule.enabled)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      rule.enabled
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {rule.enabled ? "✅ 已启用" : "⏸️ 已暂停"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 最近执行日志 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 font-bold text-sm text-slate-800">
            ⏱️ 最近工作流自动化执行动态
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">规则名称</th>
                  <th className="p-3">递归深度</th>
                  <th className="p-3">执行耗时</th>
                  <th className="p-3">状态</th>
                  <th className="p-3">触发时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {executions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">暂无执行流水</td>
                  </tr>
                ) : (
                  executions.map((ex) => (
                    <tr key={ex.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold">{ex.rule?.name || "未知规则"}</td>
                      <td className="p-3 font-mono">depth: {ex.depth}</td>
                      <td className="p-3 font-mono">{ex.durationMs}ms</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ex.status === "SUCCESS"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              : "bg-rose-50 text-rose-600 border border-rose-200"
                          }`}
                        >
                          {ex.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 font-mono">{ex.createdAt.slice(0, 19).replace("T", " ")}</td>
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
