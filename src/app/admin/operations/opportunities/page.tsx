"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function AdminOpportunitiesPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<{
    opportunities: any[];
    summary: { totalOpportunities: number; searchGapsCount: number; supplyDemandGapsCount: number };
    searchGaps: any[];
    supplyDemandGaps: any[];
  } | null>(null);

  const [activeTab, setActiveTab] = useState<"ALL" | "SEARCH_GAP" | "SUPPLY_DEMAND_GAP">("ALL");
  const [statusFilter, setStatusFilter] = useState("PENDING");

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const url = `/api/admin/operations/opportunities?status=${statusFilter}&type=${activeTab}&refresh=${isRefresh ? "true" : "false"}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, statusFilter]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/operations/opportunities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const resJson = await res.json();
      if (resJson.success) {
        fetchData();
      }
    } catch (e) {
      alert("操作更新失败");
    }
  };

  return (
    <AdminLayout title="🎯 运营商机与供给缺口雷达">
      <div className="space-y-6 pb-12">
        {/* Header Action */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">杨林生活网本地供需诊断雷达</h2>
            <p className="text-xs text-slate-500 mt-1">
              基于全站用户真实搜索“0结果”高频热词与各频道供需缺口自动挖掘，辅助招商与类目开拓。
            </p>
          </div>
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all shrink-0"
          >
            {refreshing ? "正在重新扫描数据库..." : "🔄 立即重新扫描全站供需"}
          </button>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500">待处理商机建议</div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {data?.summary.totalOpportunities ?? 0} <span className="text-sm font-normal text-slate-400">项</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500">零结果搜索缺口 (近7天)</div>
            <div className="text-2xl font-bold text-amber-600 mt-2">
              {data?.summary.searchGapsCount ?? 0} <span className="text-sm font-normal text-slate-400">个热词</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500">重点品类供需缺口</div>
            <div className="text-2xl font-bold text-teal-600 mt-2">
              {data?.summary.supplyDemandGapsCount ?? 0} <span className="text-sm font-normal text-slate-400">个品类</span>
            </div>
          </div>
        </div>

        {/* Search Gaps Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">🔍 近 7 天零结果高频搜索 TOP 15 (用户想找但站内暂无)</h3>
              <p className="text-xs text-slate-400 mt-0.5">代表本地强需求但尚未入驻的职位、房源或商家</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">搜索关键词</th>
                  <th className="py-3 px-4">搜索频次</th>
                  <th className="py-3 px-4">最近搜索时间</th>
                  <th className="py-3 px-4">运营拓展建议</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!data?.searchGaps || data.searchGaps.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      暂无未满足的搜索词（搜索匹配良好）
                    </td>
                  </tr>
                ) : (
                  data.searchGaps.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 px-2 py-1 bg-slate-100 rounded-md">
                          {item.query || item.keyword}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-amber-600">{item.count} 次</td>
                      <td className="py-3 px-4 text-slate-400">
                        {item.lastSearched || item.lastSearchedAt
                          ? new Date(item.lastSearched || item.lastSearchedAt).toLocaleString()
                          : "近期"}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{item.suggestion || item.suggestedAction}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Supply & Demand Gaps Radar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-sm font-bold text-slate-800">⚖️ 本地生活重点分类供需均衡度</h3>
            <p className="text-xs text-slate-400 mt-0.5">对比近 30 天服务需求发布数与供给方数量</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.supplyDemandGaps?.map((gap, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border ${
                  gap.severity === "HIGH"
                    ? "bg-rose-50/40 border-rose-200"
                    : gap.severity === "MEDIUM"
                    ? "bg-amber-50/40 border-amber-200"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800">{gap.category}</h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      gap.severity === "HIGH"
                        ? "bg-rose-100 text-rose-800"
                        : gap.severity === "MEDIUM"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {gap.severity === "HIGH" ? "🚨 严重短缺" : gap.severity === "MEDIUM" ? "⚠️ 供给偏紧" : "✅ 供需均衡"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 my-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px]">30天需求:</span>
                    <span className="font-bold text-slate-800 ml-1">{gap.demandCount} 条</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">供给商户:</span>
                    <span className="font-bold text-slate-800 ml-1">{gap.supplyCount ?? gap.providerCount ?? 0} 家</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">供求比:</span>
                    <span className="font-bold text-slate-800 ml-1">{gap.ratio}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/80">
                  {gap.recommendation || gap.suggestion}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
