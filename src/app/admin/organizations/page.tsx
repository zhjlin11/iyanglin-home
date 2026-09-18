"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function AdminOrganizationsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    stats: { total: number; enterpriseCount: number; merchantCount: number; riskCount: number };
    organizations: any[];
  } | null>(null);

  const [typeFilter, setTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState({ error: "", success: "" });
  const [formData, setFormData] = useState({
    name: "",
    type: "ENTERPRISE",
    industry: "机械装备与工业制造",
    address: "嵩明县杨林经济技术开发区",
    contactName: "",
    contactPhone: "",
    intro: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (typeFilter !== "ALL") q.set("type", typeFilter);
      if (search) q.set("search", search);

      const res = await fetch("/api/admin/organizations?" + q.toString());
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [typeFilter]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg({ error: "", success: "" });
    if (!formData.name.trim()) {
      setFormMsg({ error: "请输入公司或组织名称", success: "" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        setFormMsg({ error: "", success: "✅ 企业信息已成功保存至真实数据库！" });
        setTimeout(() => {
          setShowAddModal(false);
          setFormData({
            name: "",
            type: "ENTERPRISE",
            industry: "机械装备与工业制造",
            address: "嵩明县杨林经济技术开发区",
            contactName: "",
            contactPhone: "",
            intro: "",
          });
          setFormMsg({ error: "", success: "" });
          fetchData();
        }, 1200);
      } else {
        setFormMsg({ error: json.error || "录入失败，请稍后重试", success: "" });
      }
    } catch {
      setFormMsg({ error: "网络请求异常，请检查网络", success: "" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (id: string, updateData: any) => {
    try {
      const res = await fetch("/api/admin/organizations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updateData }),
      });
      const json = await res.json();
      if (json.success) {
        fetchData();
      } else {
        alert(json.error || "操作失败");
      }
    } catch {
      alert("网络错误");
    }
  };

  return (
    <AdminLayout title="平台组织治理与风控中心">
      <div className="space-y-6 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">组织总数</div>
            <div className="text-3xl font-extrabold text-slate-800 mt-1">{data?.stats.total || 0}</div>
            <div className="text-xs text-slate-500 mt-1">本地入驻与认证组织</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-blue-500 uppercase tracking-wider">企业组织 (ATS)</div>
            <div className="text-3xl font-extrabold text-blue-600 mt-1">{data?.stats.enterpriseCount || 0}</div>
            <div className="text-xs text-slate-500 mt-1">园区与招聘雇主</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider">商户组织 (SaaS)</div>
            <div className="text-3xl font-extrabold text-emerald-600 mt-1">{data?.stats.merchantCount || 0}</div>
            <div className="text-xs text-slate-500 mt-1">精选店铺与服务商</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-amber-500 uppercase tracking-wider">风控监控中</div>
            <div className="text-3xl font-extrabold text-amber-600 mt-1">{data?.stats.riskCount || 0}</div>
            <div className="text-xs text-slate-500 mt-1">异常操作或敏感标记</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            {[
              { key: "ALL", label: "全部组织" },
              { key: "ENTERPRISE", label: "企业" },
              { key: "MERCHANT", label: "商户" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setTypeFilter(tab.key)}
                className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${
                  typeFilter === tab.key ? "bg-slate-900 text-white shadow" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            <button
              onClick={() => {
                setFormMsg({ error: "", success: "" });
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
            >
              <span>＋ 录入新企业/组织</span>
            </button>
            <input
              type="text"
              placeholder="搜索组织名称或电话..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchData()}
              className="px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
            />
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow"
            >
              查询
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-xs border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">组织名称</th>
                  <th className="px-6 py-4">类型</th>
                  <th className="px-6 py-4">所有者 / 负责人</th>
                  <th className="px-6 py-4">团队规模</th>
                  <th className="px-6 py-4">业务指标</th>
                  <th className="px-6 py-4">导出权限</th>
                  <th className="px-6 py-4">风控状态</th>
                  <th className="px-6 py-4 text-right">操作治理</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                      正在加载组织数据...
                    </td>
                  </tr>
                ) : data?.organizations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                      暂无符合条件的组织
                    </td>
                  </tr>
                ) : (
                  data?.organizations.map((org: any) => (
                    <tr key={org.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span>{org.type === "ENTERPRISE" ? "🏢" : "🏪"}</span>
                          <span>{org.name}</span>
                        </div>
                        {org.industry && (
                          <div className="text-xs text-slate-500 mt-0.5">行业：{org.industry}</div>
                        )}
                        {org.address && (
                          <div className="text-xs text-slate-400 mt-0.5">地址：{org.address}</div>
                        )}
                        <div className="text-xs text-slate-400 mt-0.5">ID: {org.id.slice(-8)} {org.contactPhone ? `· 📞 ${org.contactPhone}` : ""}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          org.type === "ENTERPRISE" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {org.type === "ENTERPRISE" ? "企业" : "商户"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-700">{org.contactName || org.owner?.nickname || org.owner?.username || "管理员"}</div>
                        <div className="text-xs text-slate-400">{org.contactPhone || org.owner?.phone || "未绑电话"}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700">
                        {org._count.members} 人
                      </td>
                      <td className="px-6 py-4 text-xs space-y-1">
                        <div>职位/商品: <span className="font-bold text-slate-700">{org._count.jobs}</span></div>
                        <div>协同待办: <span className="font-bold text-slate-700">{org._count.tasks}</span></div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleUpdate(org.id, { canExport: !org.canExport })}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                            org.canExport ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-slate-50 text-slate-400 border-slate-200"
                          }`}
                        >
                          {org.canExport ? "允许导出" : "禁止导出"}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleUpdate(org.id, { riskFlag: !org.riskFlag })}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                            org.riskFlag ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {org.riskFlag ? "预警标记" : "正常"}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {org.status === "ACTIVE" ? (
                          <button
                            onClick={() => handleUpdate(org.id, { status: "DISABLED" })}
                            className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold rounded-lg"
                          >
                            停用组织
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdate(org.id, { status: "ACTIVE" })}
                            className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-xs font-bold rounded-lg"
                          >
                            恢复启用
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 录入新企业/组织 模态弹窗 */}
        {showAddModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(6px)",
              padding: "1rem",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                background: "#ffffff",
                width: "100%",
                maxWidth: "600px",
                borderRadius: "20px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
                border: "1px solid #e2e8f0",
                overflow: "hidden",
                margin: "2rem auto",
              }}
            >
              <div
                style={{
                  background: "linear-gradient(135deg, #1e40af 0%, #3730a3 100%)",
                  padding: "20px 24px",
                  color: "#ffffff",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "900", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>🏢</span> 录入新企业 / 组织入驻
                  </h3>
                  <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#bfdbfe" }}>
                    录入企业全称与属性，即时持久化至真实数据库，并可关联招聘岗位
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "none",
                    color: "#ffffff",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    fontSize: "20px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateOrg} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                {formMsg.error && (
                  <div style={{ padding: "10px 14px", background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: "10px", fontSize: "12.5px", fontWeight: 700 }}>
                    {formMsg.error}
                  </div>
                )}
                {formMsg.success && (
                  <div style={{ padding: "10px 14px", background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0", borderRadius: "10px", fontSize: "12.5px", fontWeight: 700 }}>
                    {formMsg.success}
                  </div>
                )}

                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
                    企业 / 组织名称 <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="例如：嵩明县丰浪水箱制造厂、昆明市雅嘉乐食品加工有限公司"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", fontSize: "14px", border: "1px solid #cbd5e1", borderRadius: "10px", outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
                      组织性质
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      style={{ width: "100%", padding: "10px 12px", fontSize: "13.5px", border: "1px solid #cbd5e1", borderRadius: "10px", background: "#ffffff", outline: "none", boxSizing: "border-box" }}
                    >
                      <option value="ENTERPRISE">实体企业 / 招聘雇主 (ENTERPRISE)</option>
                      <option value="MERCHANT">本地商户 / 连锁门店 (MERCHANT)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
                      所属行业
                    </label>
                    <input
                      type="text"
                      placeholder="如：工业装备制造、食品烘焙"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      style={{ width: "100%", padding: "10px 12px", fontSize: "13.5px", border: "1px solid #cbd5e1", borderRadius: "10px", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
                      联系人 / HR
                    </label>
                    <input
                      type="text"
                      placeholder="如：刘厂长、张女士"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      style={{ width: "100%", padding: "10px 12px", fontSize: "13.5px", border: "1px solid #cbd5e1", borderRadius: "10px", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
                      联系电话 (手机/座机)
                    </label>
                    <input
                      type="text"
                      placeholder="如：13987150248"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      style={{ width: "100%", padding: "10px 12px", fontSize: "13.5px", border: "1px solid #cbd5e1", borderRadius: "10px", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
                    厂区 / 经营地址
                  </label>
                  <input
                    type="text"
                    placeholder="如：嵩明县杨林工业园区新源路中段"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", fontSize: "13.5px", border: "1px solid #cbd5e1", borderRadius: "10px", outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
                    企业简介 / 业务范围
                  </label>
                  <textarea
                    rows={3}
                    placeholder="简要介绍企业成立背景、生产经营产品、厂区规模或主营业务..."
                    value={formData.intro}
                    onChange={(e) => setFormData({ ...formData, intro: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", fontSize: "13.5px", border: "1px solid #cbd5e1", borderRadius: "10px", outline: "none", boxSizing: "border-box", resize: "vertical" }}
                  />
                </div>

                <div style={{ paddingTop: "12px", display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid #f1f5f9" }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    style={{ padding: "9px 20px", fontSize: "13.5px", fontWeight: "700", color: "#475569", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "10px", cursor: "pointer" }}
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      padding: "9px 24px",
                      fontSize: "13.5px",
                      fontWeight: "700",
                      color: "#ffffff",
                      background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
                      border: "none",
                      borderRadius: "10px",
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
                      opacity: submitting ? 0.7 : 1,
                    }}
                  >
                    {submitting ? "正在保存..." : "确认录入并存入数据库"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
