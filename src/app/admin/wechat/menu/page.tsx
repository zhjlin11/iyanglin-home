"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface MenuButton {
  type?: string;
  name: string;
  url?: string;
  key?: string;
  sub_button?: MenuButton[];
}

interface MenuConfig {
  button: MenuButton[];
}

const MENU_TYPES = [
  { value: "view", label: "跳转链接 (view)" },
  { value: "click", label: "点击推事件 (click)" },
  { value: "miniprogram", label: "小程序 (miniprogram)" },
];

export default function WeChatMenuPage() {
  const [menu, setMenu] = useState<MenuConfig>({ button: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editIndex, setEditIndex] = useState<number | null>(null);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      const res = await fetch("/api/admin/wechat/menu");
      const data = await res.json();
      const buttons = data.data?.button || data.data?.menu?.button;
      if (data.success && buttons && buttons.length > 0) {
        setMenu({ button: buttons });
      } else if (data.success) {
        // 没有菜单，使用规范默认3按钮结构
        setMenu({
          button: [
            {
              name: "生活服务",
              sub_button: [
                { type: "view", name: "本地资讯", url: "https://iyanglin.com/articles" },
                { type: "view", name: "求职招聘", url: "https://iyanglin.com/jobs" },
                { type: "view", name: "房产楼市", url: "https://iyanglin.com/house" },
                { type: "view", name: "便民电话", url: "https://iyanglin.com/bianmin" },
              ],
            },
            {
              name: "逛一逛",
              sub_button: [
                { type: "view", name: "自营商城", url: "https://iyanglin.com/services" },
                { type: "view", name: "口碑好店", url: "https://iyanglin.com/haodian" },
                { type: "view", name: "同城相亲", url: "https://iyanglin.com/love" },
                { type: "view", name: "同城活动", url: "https://iyanglin.com/active" },
                { type: "view", name: "社区论坛", url: "https://iyanglin.com/community" },
              ],
            },
            {
              type: "view",
              name: "个人中心",
              url: "https://iyanglin.com/api/auth/wechat?redirect=/profile",
            },
          ],
        });
      }
    } catch {
      setError("加载菜单失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/admin/wechat/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(menu),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("菜单已同步至微信，24小时内对所有用户生效！取消关注并重新关注可立即看到新菜单。");
      } else {
        setError(data.error || "同步失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除公众号菜单吗？删除后用户将看不到底部菜单。")) return;
    setDeleting(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/admin/wechat/menu", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setMessage("菜单已删除");
        setMenu({ button: [] });
      } else {
        setError(data.error || "删除失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setDeleting(false);
    }
  };

  const addTopButton = () => {
    if (menu.button.length >= 3) {
      setError("一级菜单最多3个");
      return;
    }
    setMenu((prev) => ({
      button: [...prev.button, { type: "view", name: "新菜单", url: "https://iyanglin.com" }],
    }));
  };

  const removeTopButton = (index: number) => {
    setMenu((prev) => ({
      button: prev.button.filter((_, i) => i !== index),
    }));
    if (editIndex === index) setEditIndex(null);
  };

  const updateTopButton = (index: number, field: string, value: string) => {
    setMenu((prev) => ({
      button: prev.button.map((b, i) =>
        i === index ? { ...b, [field]: value } : b
      ),
    }));
  };

  const addSubButton = (parentIndex: number) => {
    const parent = menu.button[parentIndex];
    const subs = parent.sub_button || [];
    if (subs.length >= 5) {
      setError("子菜单最多5个");
      return;
    }
    setMenu((prev) => ({
      button: prev.button.map((b, i) =>
        i === parentIndex
          ? { ...b, sub_button: [...(b.sub_button || []), { type: "view", name: "子菜单", url: "https://iyanglin.com" }] }
          : b
      ),
    }));
  };

  const removeSubButton = (parentIndex: number, subIndex: number) => {
    setMenu((prev) => ({
      button: prev.button.map((b, i) =>
        i === parentIndex
          ? { ...b, sub_button: (b.sub_button || []).filter((_, si) => si !== subIndex) }
          : b
      ),
    }));
  };

  const updateSubButton = (parentIndex: number, subIndex: number, field: string, value: string) => {
    setMenu((prev) => ({
      button: prev.button.map((b, i) =>
        i === parentIndex
          ? {
              ...b,
              sub_button: (b.sub_button || []).map((s, si) =>
                si === subIndex ? { ...s, [field]: value } : s
              ),
            }
          : b
      ),
    }));
  };

  const S = {
    card: { background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.25rem" } as React.CSSProperties,
    cardTitle: { margin: "0 0 1rem", fontSize: "16px", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" } as React.CSSProperties,
    label: { display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "4px", color: "#334155" } as React.CSSProperties,
    input: { width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" },
    select: { width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", background: "white" },
    menuBtn: { display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "#f1f5f9", borderRadius: "8px", border: "2px solid #e2e8f0", cursor: "pointer", fontWeight: "700", fontSize: "14px", transition: "all .15s", flex: 1, justifyContent: "center" as const } as React.CSSProperties,
    menuBtnActive: { borderColor: "#0F6FEA", background: "#EBF3FF", color: "#0F6FEA" } as React.CSSProperties,
    subItem: { display: "flex", gap: "8px", alignItems: "center", padding: "8px 10px", background: "#f8fafc", borderRadius: "6px", marginBottom: "6px" } as React.CSSProperties,
    deleteBtn: { background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "16px", padding: "2px 6px" } as React.CSSProperties,
    addBtn: { padding: "6px 14px", background: "#f0fdf4", color: "#16A67A", border: "1px solid #86efac", borderRadius: "6px", fontWeight: "600", fontSize: "12px", cursor: "pointer" } as React.CSSProperties,
    success: { padding: "12px 16px", background: "#f0fdf4", border: "1px solid #86efac", color: "#166534", borderRadius: "8px", marginBottom: "1.25rem", fontSize: "13.5px", fontWeight: "600" } as React.CSSProperties,
    error: { padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: "8px", marginBottom: "1.25rem", fontSize: "13.5px" } as React.CSSProperties,
    hint: { fontSize: "12px", color: "#94a3b8", marginTop: "4px", lineHeight: "1.5" },
  };

  if (loading) {
    return (
      <AdminLayout title="⏳ 加载中..." subtitle="正在获取菜单配置...">
        <div />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="📋 公众号菜单管理"
      subtitle="编辑微信公众号底部菜单，同步后24小时内对所有用户生效。"
      actionButton={
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{ fontSize: "12.5px", padding: "6px 14px", borderRadius: "8px", border: "1px solid #fca5a5", background: "#fef2f2", color: "#dc2626", fontWeight: "700", cursor: deleting ? "not-allowed" : "pointer" }}
          >
            {deleting ? "删除中..." : "🗑 删除菜单"}
          </button>
        </div>
      }
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {message && <div style={S.success}>✅ {message}</div>}
        {error && <div style={S.error}>⚠️ {error}</div>}

        {/* 菜单预览 */}
        <div style={S.card}>
          <h3 style={S.cardTitle}>
            📱 菜单结构
            <span style={{ fontSize: "12px", fontWeight: "500", color: "#64748b" }}>
              — 点击一级菜单编辑子菜单
            </span>
          </h3>

          {/* 一级菜单按钮 */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
            {menu.button.map((btn, i) => (
              <div
                key={i}
                style={{
                  ...S.menuBtn,
                  ...(editIndex === i ? S.menuBtnActive : {}),
                }}
                onClick={() => setEditIndex(editIndex === i ? null : i)}
              >
                {btn.name}
                <button
                  style={{ ...S.deleteBtn, fontSize: "13px" }}
                  onClick={(e) => { e.stopPropagation(); removeTopButton(i); }}
                  title="删除"
                >
                  ✕
                </button>
              </div>
            ))}
            {menu.button.length < 3 && (
              <button style={{ ...S.addBtn, flex: "none", padding: "10px 16px" }} onClick={addTopButton}>
                + 添加菜单
              </button>
            )}
          </div>

          <p style={S.hint}>
            微信公众号最多支持 3 个一级菜单，每个一级菜单最多 5 个子菜单。
          </p>
        </div>

        {/* 编辑选中的菜单 */}
        {editIndex !== null && menu.button[editIndex] && (
          <div style={S.card}>
            <h3 style={S.cardTitle}>
              ✏️ 编辑「{menu.button[editIndex].name}」
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <div>
                <label style={S.label}>菜单名称（4字以内）</label>
                <input
                  style={S.input}
                  value={menu.button[editIndex].name}
                  onChange={(e) => updateTopButton(editIndex, "name", e.target.value)}
                  maxLength={8}
                />
              </div>
              {!menu.button[editIndex].sub_button?.length && (
                <>
                  <div>
                    <label style={S.label}>菜单类型</label>
                    <select
                      style={S.select}
                      value={menu.button[editIndex].type}
                      onChange={(e) => updateTopButton(editIndex, "type", e.target.value)}
                    >
                      {MENU_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  {menu.button[editIndex].type === "view" && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={S.label}>跳转链接</label>
                      <input
                        style={S.input}
                        value={menu.button[editIndex].url || ""}
                        onChange={(e) => updateTopButton(editIndex, "url", e.target.value)}
                        placeholder="https://iyanglin.com/..."
                      />
                    </div>
                  )}
                  {menu.button[editIndex].type === "click" && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={S.label}>事件 Key</label>
                      <input
                        style={S.input}
                        value={menu.button[editIndex].key || ""}
                        onChange={(e) => updateTopButton(editIndex, "key", e.target.value)}
                        placeholder="如：btn_about"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 子菜单列表 */}
            <div style={{ marginTop: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <label style={{ ...S.label, marginBottom: 0 }}>子菜单</label>
                {(menu.button[editIndex].sub_button?.length || 0) < 5 && (
                  <button style={S.addBtn} onClick={() => addSubButton(editIndex)}>
                    + 添加子菜单
                  </button>
                )}
              </div>

              {(menu.button[editIndex].sub_button || []).map((sub, si) => (
                <div key={si} style={S.subItem}>
                  <div style={{ flex: "0 0 100px" }}>
                    <input
                      style={S.input}
                      value={sub.name}
                      onChange={(e) => updateSubButton(editIndex, si, "name", e.target.value)}
                      placeholder="名称"
                      maxLength={16}
                    />
                  </div>
                  <div style={{ flex: "0 0 90px" }}>
                    <select
                      style={S.select}
                      value={sub.type}
                      onChange={(e) => updateSubButton(editIndex, si, "type", e.target.value)}
                    >
                      {MENU_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      style={S.input}
                      value={sub.type === "view" ? sub.url || "" : sub.key || ""}
                      onChange={(e) =>
                        updateSubButton(editIndex, si, sub.type === "view" ? "url" : "key", e.target.value)
                      }
                      placeholder={sub.type === "view" ? "https://..." : "事件 key"}
                    />
                  </div>
                  <button style={S.deleteBtn} onClick={() => removeSubButton(editIndex, si)}>
                    ✕
                  </button>
                </div>
              ))}

              {!menu.button[editIndex].sub_button?.length && (
                <p style={{ ...S.hint, textAlign: "center", padding: "12px" }}>
                  没有子菜单时，点击一级菜单将直接执行操作（跳转链接或触发事件）。<br />
                  添加子菜单后，一级菜单变为展开容器。
                </p>
              )}
            </div>
          </div>
        )}

        {/* 保存按钮 */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "10px 28px",
              background: "#0B7A75",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "800",
              fontSize: "14px",
              cursor: saving ? "not-allowed" : "pointer",
              boxShadow: "0 2px 8px rgba(11,122,117,.25)",
            }}
          >
            {saving ? "同步中..." : "🚀 同步菜单到微信"}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
