"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import ImageUpload from "@/components/ImageUpload";

export default function SiteSettingsPage() {
  const [form, setForm] = useState({
    site_name: "杨林生活网",
    site_short_name: "杨林生活",
    site_logo: "/images/logo/yanglin_icon_v2_512px.png",
    site_icon: "/images/logo/yanglin_icon_v2_512px.png",
    site_desc: "杨林本地求职、租房、商家与便民信息汇总平台",
    icp_beian: "滇ICP备20268888号-1",
    gongan_beian: "滇公网安备 53012402000888号",
    customer_phone: "18006778483",
    contact_email: "support@iyanglin.com",
    company_name: "杨林生活网信息服务中心",
    footer_text: "© 2026 杨林生活网 版权所有 · 专注本地生活服务",
    site_notice: "欢迎来到杨林生活网！便民求职与二手房产全免费发布。",
    site_status: "ONLINE", // ONLINE | MAINTENANCE | CLOSED
    site_close_reason: "网站正在进行系统架构与服务器例行升级维护中，预计本日 24:00 恢复访问。如有急事请联系客服电话：18006778483。",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const d = await res.json();
        if (Array.isArray(d.settings) && d.settings.length > 0) {
          const map: Record<string, string> = {};
          d.settings.forEach((s: any) => {
            map[s.key] = s.value;
          });
          setForm((prev) => ({ ...prev, ...map }));
        }
      }
    } catch {}
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    setMessage("");
    setError("");
    setConfirmOpen(false);

    const settingsArray = Object.entries(form).map(([key, value]) => ({
      key,
      value,
      group: "SITE",
    }));

    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: settingsArray }),
    });

    if (res.ok) {
      setMessage("⚙️ 站点基础配置与关站状态开关修改成功，全站配置已实时生效！");
      loadSettings();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "保存失败，请检查账号权限");
    }
  };

  return (
    <AdminLayout
      title="⚙️ 站点基础配置与运行开关中心"
      subtitle="配置站点全称、Logo、关站维护模式、ICP备案、客服电话与页脚版权文案。"
    >
      {message && <div className="notice-success" style={{ marginBottom: "1.5rem", background: "#dcfce7", color: "#15803d", padding: "12px 16px", borderRadius: "8px" }}>{message}</div>}
      {error && <div className="notice-error" style={{ marginBottom: "1.5rem", background: "#fee2e2", color: "#b91c1c", padding: "12px 16px", borderRadius: "8px" }}>{error}</div>}

      <div style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0", maxWidth: "840px" }}>
        
        {/* 关站控制高亮 Banner */}
        <div style={{ background: form.site_status === "ONLINE" ? "#f0fdf4" : form.site_status === "MAINTENANCE" ? "#fffbeb" : "#fef2f2", border: `1px solid ${form.site_status === "ONLINE" ? "#bbf7d0" : form.site_status === "MAINTENANCE" ? "#fde68a" : "#fecaca"}`, padding: "1.25rem", borderRadius: "10px", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: form.site_status === "ONLINE" ? "#166534" : form.site_status === "MAINTENANCE" ? "#92400e" : "#991b1b" }}>
              🚨 网站运营与关站维护状态控制
            </h3>
            <span style={{ fontSize: "12px", fontWeight: "700", padding: "4px 10px", borderRadius: "9999px", background: form.site_status === "ONLINE" ? "#22c55e" : form.site_status === "MAINTENANCE" ? "#f59e0b" : "#ef4444", color: "white" }}>
              {form.site_status === "ONLINE" ? "🟢 正常开放运行" : form.site_status === "MAINTENANCE" ? "🟡 例行关站维护中" : "🔴 全站完全关闭"}
            </span>
          </div>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 12px 0" }}>
            当切换为“例行关站维护中”或“全站关闭”时，普通前端访客访问首页及各频道将展现优雅的维护告知大屏，管理员后台路径不受影响。
          </p>

          <div style={{ display: "flex", gap: "16px", marginBottom: "12px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}>
              <input
                type="radio"
                name="site_status"
                value="ONLINE"
                checked={form.site_status === "ONLINE"}
                onChange={(e) => setForm({ ...form, site_status: e.target.value })}
              />
              🟢 正常对外运行 (ONLINE)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "14px", color: "#d97706" }}>
              <input
                type="radio"
                name="site_status"
                value="MAINTENANCE"
                checked={form.site_status === "MAINTENANCE"}
                onChange={(e) => setForm({ ...form, site_status: e.target.value })}
              />
              🟡 例行关站维护中 (MAINTENANCE)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "14px", color: "#dc2626" }}>
              <input
                type="radio"
                name="site_status"
                value="CLOSED"
                checked={form.site_status === "CLOSED"}
                onChange={(e) => setForm({ ...form, site_status: e.target.value })}
              />
              🔴 全站彻底关闭 (CLOSED)
            </label>
          </div>

          {form.site_status !== "ONLINE" && (
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "4px", color: "#1e293b" }}>关站维护告知文案 (展示给前台访客)</label>
              <textarea
                rows={3}
                value={form.site_close_reason}
                onChange={(e) => setForm({ ...form, site_close_reason: e.target.value })}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
              />
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setConfirmOpen(true);
          }}
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {/* 🌟 品牌 Logo 与浏览器 Favicon 定制中心 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            
            {/* 1. 网站大 Logo 定制卡片 */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>
                    🎨 1. 网站品牌 Logo 定制 (全站导航栏 & 页脚)
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                    用于 PC 端与手机端顶部导航栏、页脚大图展示。支持点击更换、拖拽或按 <b>Ctrl+V</b> 直接粘贴。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, site_logo: "/images/logo/yanglin_icon_v2_512px.png" })}
                  style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "white", color: "#475569", cursor: "pointer", fontWeight: "600" }}
                >
                  🔄 还原默认 Logo
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", alignItems: "start" }}>
                {/* 上传操作区 */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "6px", color: "#334155" }}>
                    上传新 Logo (支持直接粘贴 Ctrl+V 或点击更换)
                  </label>
                  <ImageUpload
                    value={form.site_logo ? [form.site_logo] : []}
                    onChange={(urls) => {
                      setForm({ ...form, site_logo: urls.length > 0 ? urls[urls.length - 1] : "" });
                    }}
                    maxCount={1}
                  />
                </div>

                {/* 实时多端效果预览区 */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "6px", color: "#334155" }}>
                    🖥️ 全站顶部导航栏实时效果预览
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {/* 白底导航预览 */}
                    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 16px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                      <img
                        src={form.site_logo || "/images/logo/yanglin_icon_v2_512px.png"}
                        alt="Logo 预览"
                        style={{ height: "48px", width: "48px", objectFit: "contain", flexShrink: 0 }}
                      />
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "18px", fontWeight: "900", color: "#0d47a1", letterSpacing: "-0.03em", lineHeight: "1.1" }}>
                          {form.site_name || "杨林生活网"}
                        </span>
                        <span style={{ fontSize: "10px", fontWeight: "700", color: "#1976d2", letterSpacing: "1px", marginTop: "2px", opacity: 0.85 }}>
                          IYLANGLIN.COM
                        </span>
                      </div>
                    </div>

                    {/* 深色页脚预览 */}
                    <div style={{ background: "#0f172a", borderRadius: "8px", padding: "10px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
                      <img
                        src={form.site_logo || "/images/logo/yanglin_icon_v2_512px.png"}
                        alt="Logo 深色预览"
                        style={{ height: "36px", width: "36px", objectFit: "contain", flexShrink: 0 }}
                      />
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "14px", fontWeight: "800", color: "white" }}>
                          {form.site_name || "杨林生活网"}
                        </span>
                        <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                          深色夜间/页脚展示效果
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. 浏览器标签页 Favicon 小图标定制卡片 */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>
                    🌐 2. 浏览器标签页 Favicon 站点图标定制 (您询问的浏览器小图标)
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                    显示在<b>浏览器顶部的网页标签栏</b>、书签收藏夹及移动端快捷图标。建议使用 32x32 或 64x64 正方形 PNG/ICO 图标。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, site_icon: "/images/logo/yanglin_icon_v2_512px.png" })}
                  style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "white", color: "#475569", cursor: "pointer", fontWeight: "600" }}
                >
                  🔄 还原默认图标
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", alignItems: "start" }}>
                {/* 上传操作区 */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "6px", color: "#334155" }}>
                    上传标签页小图标 (支持直接粘贴 Ctrl+V 或点击更换)
                  </label>
                  <ImageUpload
                    value={form.site_icon ? [form.site_icon] : []}
                    onChange={(urls) => {
                      setForm({ ...form, site_icon: urls.length > 0 ? urls[urls.length - 1] : "" });
                    }}
                    maxCount={1}
                  />
                </div>

                {/* 模拟真实的 Chrome 浏览器标签页效果预览 */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "6px", color: "#334155" }}>
                    🌐 浏览器标签页真实效果预览
                  </label>
                  <div style={{ background: "#dee1e6", borderRadius: "10px 10px 8px 8px", padding: "10px 12px 14px 12px", border: "1px solid #cbd5e1" }}>
                    {/* 模拟浏览器标签页 */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#ffffff", padding: "8px 12px", borderRadius: "8px 8px 0 0", width: "fit-content", maxWidth: "100%", boxShadow: "0 2px 6px rgba(0,0,0,0.06)" }}>
                      <img
                        src={form.site_icon || form.site_logo || "/images/logo/yanglin_icon_v2_512px.png"}
                        alt="Favicon 预览"
                        style={{ width: "18px", height: "18px", objectFit: "contain", borderRadius: "3px", flexShrink: 0 }}
                      />
                      <span style={{ fontSize: "12px", fontWeight: "600", color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "200px" }}>
                        {form.site_name || "杨林生活网"} - 嵩明杨林本地...
                      </span>
                      <span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "6px", cursor: "default" }}>✕</span>
                    </div>
                    {/* 模拟地址栏 */}
                    <div style={{ background: "#ffffff", borderRadius: "0 0 6px 6px", padding: "6px 12px", display: "flex", alignItems: "center", gap: "6px", borderTop: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "11px", color: "#10b981" }}>🔒</span>
                      <span style={{ fontSize: "11px", color: "#475569", fontFamily: "monospace" }}>https://iyanglin.com</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "4px" }}>站点全称</label>
              <input
                type="text"
                value={form.site_name}
                onChange={(e) => setForm({ ...form, site_name: e.target.value })}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "4px" }}>站点简称</label>
              <input
                type="text"
                value={form.site_short_name}
                onChange={(e) => setForm({ ...form, site_short_name: e.target.value })}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "4px" }}>站点描述 (SEO Description)</label>
            <textarea
              rows={3}
              value={form.site_desc}
              onChange={(e) => setForm({ ...form, site_desc: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", resize: "vertical" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "4px" }}>ICP 备案号</label>
              <input
                type="text"
                value={form.icp_beian}
                onChange={(e) => setForm({ ...form, icp_beian: e.target.value })}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "4px" }}>公安网安备案号</label>
              <input
                type="text"
                value={form.gongan_beian}
                onChange={(e) => setForm({ ...form, gongan_beian: e.target.value })}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "4px" }}>客服联系电话</label>
              <input
                type="text"
                value={form.customer_phone}
                onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "4px" }}>官方联系邮箱</label>
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "4px" }}>首页顶部滚动公告</label>
            <input
              type="text"
              value={form.site_notice}
              onChange={(e) => setForm({ ...form, site_notice: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "4px" }}>全站页脚版权文案</label>
            <input
              type="text"
              value={form.footer_text}
              onChange={(e) => setForm({ ...form, footer_text: e.target.value })}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              background: "#0B7A75",
              color: "white",
              fontWeight: "bold",
              fontSize: "14px",
              cursor: "pointer",
              alignSelf: "flex-start",
              marginTop: "0.5rem",
            }}
          >
            保存站点配置与运行状态
          </button>
        </form>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        title="⚙️ 确认更新站点运行配置？"
        description={form.site_status !== "ONLINE" ? "⚠️ 注意：您已选择例行关站维护/全站关闭模式，保存后普通前端访客将无法浏览各频道内容！" : "保存后，全站名称、备案号与页脚版权信息将实时同步生效。"}
        onConfirm={handleSave}
        onCancel={() => setConfirmOpen(false)}
      />
    </AdminLayout>
  );
}
