"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function AdminInsightsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/insights");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
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

  return (
    <AdminLayout title="本地商业数据中台与区域洞察">
      <div className="space-y-6 pb-12">
        {/* 全景核心指标卡 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-400 uppercase">注册总用户</div>
            <div className="text-3xl font-extrabold text-slate-800 mt-1">{data?.summary?.totalUsers || 0}</div>
            <div className="text-xs text-slate-500 mt-1">杨林本地居民与企业</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-blue-500 uppercase">在招岗位底座</div>
            <div className="text-3xl font-extrabold text-blue-600 mt-1">{data?.summary?.totalJobs || 0}</div>
            <div className="text-xs text-slate-500 mt-1">经开区制造与大学城服务</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-emerald-500 uppercase">房源供给存量</div>
            <div className="text-3xl font-extrabold text-emerald-600 mt-1">{data?.summary?.totalHouses || 0}</div>
            <div className="text-xs text-slate-500 mt-1">公寓租房与整租社区</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-amber-500 uppercase">累计便民订单</div>
            <div className="text-3xl font-extrabold text-amber-600 mt-1">{data?.summary?.totalOrders || 0}</div>
            <div className="text-xs text-slate-500 mt-1">线上担保与线下履约</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-purple-500 uppercase">商机撮合线索</div>
            <div className="text-3xl font-extrabold text-purple-600 mt-1">{data?.summary?.totalLeads || 0}</div>
            <div className="text-xs text-slate-500 mt-1">需求大厅主动提报</div>
          </div>
        </div>

        {/* 区域维度分布 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="font-bold text-sm text-slate-800 flex items-center justify-between">
            <span>📍 杨林本地四大片区商业供需热度雷达</span>
            <span className="text-xs text-slate-400">基于真实数据多维度聚合</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data?.regionalDistribution?.map((r: any) => (
              <div key={r.regionKey} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-800">{r.name}</span>
                  <span className="text-xs font-extrabold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                    热度: {r.heatIndex}
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  <span>岗位占比: </span>
                  <span className="font-bold text-slate-800">{r.jobsCount} 个</span>
                </div>
                <div className="text-xs text-slate-600">
                  <span>紧缺需求: </span>
                  <span className="text-amber-700 font-medium">{r.demandLevel}</span>
                </div>
                <div className="text-xs text-slate-500">
                  <span>租金区间: {r.houseRentAvg}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 模块3: 搜索缺口 (Search Gap) 与 统一指标注册表 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 搜索缺口 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="font-bold text-sm text-slate-800 flex items-center justify-between">
              <span>🔍 零结果高频搜索缺口雷达</span>
              <span className="text-xs text-rose-500 font-bold">● 潜在商业拓展商机</span>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {data?.searchGaps?.map((sg: any, idx: number) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-800">{sg.keyword}</span>
                    <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border">
                      {sg.estimatedDemand}
                    </span>
                  </div>
                  <div className="font-mono text-slate-500">{sg.searchCount} 次搜索</div>
                </div>
              ))}
            </div>
          </div>

          {/* Metric Registry */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="font-bold text-sm text-slate-800 flex items-center justify-between">
              <span>📐 平台统一指标注册表 (Metric Registry)</span>
              <span className="text-xs text-slate-400 font-mono">口径与血缘闭环</span>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {data?.metrics?.map((m: any) => (
                <div key={m.code} className="py-2.5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-blue-600">{m.code}</span>
                      <span className="font-bold text-slate-800">{m.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">公式: {m.formula}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                      来源: {m.sourceTable}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
