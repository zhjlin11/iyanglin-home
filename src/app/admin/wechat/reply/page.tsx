"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

/* ─── 类型 ─── */
interface KeywordGroup {
  name: string;
  keywords: string[];
  reply: string;
  enabled?: boolean;
}

interface ReplyConfig {
  welcomeMsg: string;
  keywordGroups: KeywordGroup[];
  defaultReply: string;
}

/* ─── 编辑弹窗组件 ─── */
function GroupModal({
  group,
  onSave,
  onClose,
}: {
  group: KeywordGroup | null;
  onSave: (g: KeywordGroup) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(group?.name || "");
  const [keywords, setKeywords] = useState(group?.keywords.join("、") || "");
  const [reply, setReply] = useState(group?.reply || "");
  const [enabled, setEnabled] = useState(group?.enabled !== false);
  const [tab, setTab] = useState<"edit" | "preview">("edit");

  const handleSave = () => {
    if (!name.trim()) return alert("请输入关键词组名称");
    if (!keywords.trim()) return alert("请输入至少一个关键词");
    if (!reply.trim()) return alert("请输入回复内容");
    const kwList = keywords
      .split(/[、,，\s]+/)
      .map((k) => k.trim())
      .filter(Boolean);
    if (kwList.length === 0) return alert("请输入至少一个关键词");
    onSave({ name: name.trim(), keywords: kwList, reply: reply.trim(), enabled });
  };

  return (
    <div style={MS.overlay} onClick={onClose}>
      <div style={MS.modal} onClick={(e) => e.stopPropagation()}>
        <div style={MS.header}>
          <h3 style={MS.title}>{group ? "✏️ 编辑关键词组" : "➕ 新增关键词组"}</h3>
          <button style={MS.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={MS.body}>
          {/* 组名 */}
          <div style={MS.field}>
            <label style={MS.label}>
              关键词组名称 <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              style={MS.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：招聘、房产、商家..."
            />
            <p style={MS.hint}>用于后台管理识别，不对外展示</p>
          </div>

          {/* 关键词 */}
          <div style={MS.field}>
            <label style={MS.label}>
              匹配关键词 <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              style={MS.input}
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="用顿号、逗号或空格分隔，如：招聘、工作、找工作、兼职"
            />
            <p style={MS.hint}>
              用户发送包含这些关键词的消息时触发回复。精确匹配优先，包含匹配按关键词长度排序。
            </p>
            {keywords.trim() && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                {keywords
                  .split(/[、,，\s]+/)
                  .filter(Boolean)
                  .map((kw, i) => (
                    <span
                      key={i}
                      style={{
                        display: "inline-block",
                        padding: "2px 10px",
                        background: "#eff6ff",
                        color: "#1d4ed8",
                        borderRadius: "100px",
                        fontSize: "12.5px",
                        fontWeight: "600",
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      {kw.trim()}
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* 回复内容 */}
          <div style={MS.field}>
            <label style={MS.label}>
              回复内容 <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <div style={{ display: "flex", gap: "0", marginBottom: "8px" }}>
              <button
                style={{
                  ...MS.tabBtn,
                  ...(tab === "edit" ? MS.tabActive : {}),
                  borderRadius: "6px 0 0 6px",
                }}
                onClick={() => setTab("edit")}
              >
                ✍️ 编辑
              </button>
              <button
                style={{
                  ...MS.tabBtn,
                  ...(tab === "preview" ? MS.tabActive : {}),
                  borderRadius: "0 6px 6px 0",
                }}
                onClick={() => setTab("preview")}
              >
                👁 预览
              </button>
            </div>
            {tab === "edit" ? (
              <textarea
                style={{ ...MS.input, minHeight: "180px", resize: "vertical" as const, lineHeight: "1.8" }}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder={"输入微信自动回复内容...\n\n支持 emoji 和换行，建议包含链接引导用户访问网站。"}
              />
            ) : (
              <div style={MS.preview}>
                {reply || <span style={{ color: "#94a3b8" }}>暂无内容</span>}
              </div>
            )}
            <p style={MS.hint}>微信文本消息格式，直接换行即可。建议包含 emoji 和网站链接。</p>
          </div>

          {/* 状态 */}
          <div style={{ ...MS.field, display: "flex", alignItems: "center", gap: "12px" }}>
            <label style={{ ...MS.label, marginBottom: 0 }}>启用状态</label>
            <button
              style={{
                width: "48px",
                height: "26px",
                borderRadius: "13px",
                border: "none",
                cursor: "pointer",
                position: "relative" as const,
                transition: "background .2s",
                background: enabled ? "#22c55e" : "#cbd5e1",
                flexShrink: 0,
              }}
              onClick={() => setEnabled(!enabled)}
            >
              <span
                style={{
                  position: "absolute" as const,
                  top: "3px",
                  left: enabled ? "24px" : "3px",
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: "white",
                  transition: "left .2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                }}
              />
            </button>
            <span style={{ fontSize: "13px", color: enabled ? "#16a34a" : "#94a3b8" }}>
              {enabled ? "已启用" : "已停用"}
            </span>
          </div>
        </div>

        <div style={MS.footer}>
          <button style={MS.cancelBtn} onClick={onClose}>
            取消
          </button>
          <button style={MS.saveBtn} onClick={handleSave}>
            💾 保存
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── 弹窗样式 ─── */
const MS = {
  overlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(0,0,0,.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "16px",
  },
  modal: {
    background: "white",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "640px",
    maxHeight: "90vh",
    overflow: "auto" as const,
    boxShadow: "0 20px 60px rgba(0,0,0,.25)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px 16px",
    borderBottom: "1px solid #f1f5f9",
  } as React.CSSProperties,
  title: { margin: 0, fontSize: "17px", fontWeight: "800", color: "#0f172a" } as React.CSSProperties,
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    color: "#94a3b8",
    padding: "4px 8px",
    borderRadius: "6px",
  } as React.CSSProperties,
  body: { padding: "20px 24px" } as React.CSSProperties,
  field: { marginBottom: "20px" } as React.CSSProperties,
  label: {
    display: "block",
    fontSize: "13.5px",
    fontWeight: "700",
    marginBottom: "6px",
    color: "#334155",
  } as React.CSSProperties,
  input: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "13.5px",
    fontFamily: "inherit",
    boxSizing: "border-box" as const,
    outline: "none",
  } as React.CSSProperties,
  hint: {
    fontSize: "12px",
    color: "#94a3b8",
    marginTop: "4px",
    lineHeight: "1.5",
    margin: "4px 0 0",
  } as React.CSSProperties,
  tabBtn: {
    padding: "6px 14px",
    fontSize: "12.5px",
    fontWeight: "600",
    cursor: "pointer",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    color: "#64748b",
    transition: "all .15s",
  } as React.CSSProperties,
  tabActive: {
    background: "#1d4ed8",
    color: "white",
    borderColor: "#1d4ed8",
  } as React.CSSProperties,
  preview: {
    background: "#f0fdf4",
    border: "1px solid #dcfce7",
    borderRadius: "8px",
    padding: "14px 16px",
    fontSize: "13.5px",
    lineHeight: "1.8",
    color: "#334155",
    whiteSpace: "pre-wrap" as const,
    minHeight: "180px",
  } as React.CSSProperties,
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    padding: "16px 24px 20px",
    borderTop: "1px solid #f1f5f9",
  } as React.CSSProperties,
  cancelBtn: {
    padding: "8px 20px",
    background: "#f1f5f9",
    color: "#475569",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
  } as React.CSSProperties,
  saveBtn: {
    padding: "8px 24px",
    background: "#1d4ed8",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "700",
    fontSize: "13px",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(29,78,216,.25)",
  } as React.CSSProperties,
};

/* ─── 主页面 ─── */
export default function WeChatReplyPage() {
  const [config, setConfig] = useState<ReplyConfig>({
    welcomeMsg: "",
    keywordGroups: [],
    defaultReply: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingGroup, setEditingGroup] = useState<{ index: number; group: KeywordGroup } | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/wechat/reply");
      const data = await res.json();
      if (data.success) {
        setConfig(data.data);
      } else {
        setError(data.error || "加载失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  /* 保存配置 */
  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/admin/wechat/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        let msg = "✅ 自动回复配置已保存，即时生效！";
        if (data.conflicts && data.conflicts.length > 0) {
          msg += `\n⚠️ 发现关键词冲突：${data.conflicts.join("；")}`;
        }
        setMessage(msg);
      } else {
        setError(data.error || "保存失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setSaving(false);
    }
  };

  /* 重置为默认 */
  const handleReset = async () => {
    if (!confirm("确认重置为默认配置？当前配置将被覆盖。")) return;
    setResetting(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/admin/wechat/reply", { method: "PUT" });
      const data = await res.json();
      if (data.success) {
        setConfig(data.data);
        setMessage("已重置为默认配置");
      } else {
        setError(data.error || "重置失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setResetting(false);
    }
  };

  /* 编辑/新增关键词组 */
  const handleSaveGroup = (group: KeywordGroup) => {
    setConfig((prev) => {
      const groups = [...prev.keywordGroups];
      if (editingGroup !== null) {
        groups[editingGroup.index] = group;
      } else {
        groups.push(group);
      }
      return { ...prev, keywordGroups: groups };
    });
    setEditingGroup(null);
    setShowNewModal(false);
  };

  /* 复制 */
  const duplicateGroup = (index: number) => {
    setConfig((prev) => {
      const src = prev.keywordGroups[index];
      const copy: KeywordGroup = {
        ...src,
        name: src.name + "（副本）",
        keywords: [...src.keywords],
        enabled: false,
      };
      const groups = [...prev.keywordGroups];
      groups.splice(index + 1, 0, copy);
      return { ...prev, keywordGroups: groups };
    });
  };

  /* 启用/停用 */
  const toggleGroup = (index: number) => {
    setConfig((prev) => {
      const groups = [...prev.keywordGroups];
      groups[index] = { ...groups[index], enabled: groups[index].enabled === false ? true : false };
      return { ...prev, keywordGroups: groups };
    });
  };

  /* 删除 */
  const deleteGroup = (index: number) => {
    const name = config.keywordGroups[index].name;
    if (!confirm(`确认删除关键词组「${name}」？`)) return;
    setConfig((prev) => ({
      ...prev,
      keywordGroups: prev.keywordGroups.filter((_, i) => i !== index),
    }));
  };

  /* 移动位置 */
  const moveGroup = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= config.keywordGroups.length) return;
    setConfig((prev) => {
      const groups = [...prev.keywordGroups];
      [groups[index], groups[target]] = [groups[target], groups[index]];
      return { ...prev, keywordGroups: groups };
    });
  };

  /* ─── 样式 ─── */
  const S = {
    card: {
      background: "white",
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      padding: "1.5rem",
      marginBottom: "1.25rem",
    } as React.CSSProperties,
    cardTitle: {
      margin: "0 0 1rem",
      fontSize: "16px",
      fontWeight: "800",
      color: "#0f172a",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    } as React.CSSProperties,
    label: {
      display: "block",
      fontSize: "13px",
      fontWeight: "bold",
      marginBottom: "6px",
      color: "#334155",
    } as React.CSSProperties,
    textarea: {
      width: "100%",
      padding: "10px 14px",
      borderRadius: "8px",
      border: "1px solid #cbd5e1",
      fontSize: "13.5px",
      lineHeight: "1.7",
      resize: "vertical" as const,
      fontFamily: "inherit",
      minHeight: "120px",
      boxSizing: "border-box" as const,
      outline: "none",
    },
    hint: {
      fontSize: "12px",
      color: "#94a3b8",
      marginTop: "4px",
      lineHeight: "1.5",
    },
    previewBox: {
      background: "#f0fdf4",
      border: "1px solid #dcfce7",
      borderRadius: "8px",
      padding: "12px 14px",
      fontSize: "13px",
      lineHeight: "1.8",
      color: "#334155",
      whiteSpace: "pre-wrap" as const,
      marginTop: "8px",
    },
    success: {
      padding: "12px 16px",
      background: "#f0fdf4",
      border: "1px solid #86efac",
      color: "#166534",
      borderRadius: "8px",
      marginBottom: "1.25rem",
      fontSize: "13.5px",
      fontWeight: "600",
      whiteSpace: "pre-wrap" as const,
    } as React.CSSProperties,
    error: {
      padding: "12px 16px",
      background: "#fef2f2",
      border: "1px solid #fecaca",
      color: "#991b1b",
      borderRadius: "8px",
      marginBottom: "1.25rem",
      fontSize: "13.5px",
    } as React.CSSProperties,
    actionBtn: {
      padding: "4px 10px",
      fontSize: "12px",
      fontWeight: "600",
      cursor: "pointer",
      border: "1px solid #e2e8f0",
      borderRadius: "6px",
      background: "white",
      color: "#475569",
      transition: "all .15s",
    } as React.CSSProperties,
    primaryBtn: {
      padding: "9px 22px",
      background: "#1d4ed8",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontWeight: "700",
      fontSize: "13.5px",
      cursor: "pointer",
      boxShadow: "0 2px 8px rgba(29,78,216,.2)",
    } as React.CSSProperties,
  };

  if (loading) {
    return (
      <AdminLayout title="⏳ 加载中..." subtitle="正在获取自动回复配置...">
        <div />
      </AdminLayout>
    );
  }

  const enabledCount = config.keywordGroups.filter((g) => g.enabled !== false).length;
  const totalKw = config.keywordGroups.reduce((sum, g) => sum + g.keywords.length, 0);

  return (
    <AdminLayout
      title="💬 自动回复管理"
      subtitle="管理关注欢迎语、关键词组回复和默认回复，修改保存后即时生效。"
    >
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        {message && <div style={S.success}>{message}</div>}
        {error && <div style={S.error}>⚠️ {error}</div>}

        {/* ─── 数据概览 ─── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "12px",
            marginBottom: "1.25rem",
          }}
        >
          {[
            { label: "关键词组", value: config.keywordGroups.length, color: "#1d4ed8" },
            { label: "已启用", value: enabledCount, color: "#16a34a" },
            { label: "已停用", value: config.keywordGroups.length - enabledCount, color: "#94a3b8" },
            { label: "总关键词数", value: totalKw, color: "#f59e0b" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "14px 16px",
                textAlign: "center" as const,
              }}
            >
              <div style={{ fontSize: "24px", fontWeight: "900", color: item.color }}>{item.value}</div>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginTop: "2px" }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* ─── 关注欢迎语 ─── */}
        <div style={S.card}>
          <h3 style={S.cardTitle}>
            👋 关注欢迎语
            <span style={{ fontSize: "12px", fontWeight: "500", color: "#64748b" }}>
              — 用户关注公众号后自动发送
            </span>
          </h3>
          <label style={S.label}>欢迎消息内容</label>
          <textarea
            style={S.textarea}
            value={config.welcomeMsg}
            onChange={(e) => setConfig({ ...config, welcomeMsg: e.target.value })}
            placeholder="输入用户关注后自动发送的欢迎消息..."
          />
          <p style={S.hint}>
            微信文本消息格式，直接换行即可。建议包含网站链接和使用指引。
          </p>
          {config.welcomeMsg && (
            <div>
              <label style={{ ...S.label, marginTop: "12px" }}>💬 预览效果</label>
              <div style={S.previewBox}>{config.welcomeMsg}</div>
            </div>
          )}
        </div>

        {/* ─── 关键词组管理 ─── */}
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ ...S.cardTitle, marginBottom: 0 }}>
              🔑 关键词组管理
              <span style={{ fontSize: "12px", fontWeight: "500", color: "#64748b" }}>
                — 匹配优先级：精确 &gt; 包含（长词优先）
              </span>
            </h3>
            <button style={S.primaryBtn} onClick={() => setShowNewModal(true)}>
              ➕ 新增
            </button>
          </div>

          {/* 表头 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "40px 90px 1fr 120px 60px 140px",
              gap: "8px",
              fontWeight: "700",
              fontSize: "12px",
              color: "#64748b",
              padding: "10px 12px",
              background: "#f8fafc",
              borderRadius: "8px 8px 0 0",
              borderBottom: "2px solid #e2e8f0",
            }}
          >
            <span>#</span>
            <span>组名</span>
            <span>匹配关键词</span>
            <span>回复预览</span>
            <span>状态</span>
            <span style={{ textAlign: "right" as const }}>操作</span>
          </div>

          {/* 列表 */}
          {config.keywordGroups.length === 0 ? (
            <div
              style={{
                padding: "32px",
                textAlign: "center" as const,
                color: "#94a3b8",
                fontSize: "14px",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              暂无关键词组，点击右上角「新增」添加
            </div>
          ) : (
            config.keywordGroups.map((group, i) => {
              const isExpanded = expandedRow === i;
              const isEnabled = group.enabled !== false;
              return (
                <div key={i}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "40px 90px 1fr 120px 60px 140px",
                      gap: "8px",
                      alignItems: "center",
                      padding: "10px 12px",
                      borderBottom: "1px solid #f1f5f9",
                      background: isEnabled ? "white" : "#fafafa",
                      opacity: isEnabled ? 1 : 0.65,
                      cursor: "pointer",
                      transition: "background .15s",
                    }}
                    onClick={() => setExpandedRow(isExpanded ? null : i)}
                  >
                    {/* 序号 */}
                    <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600" }}>{i + 1}</span>

                    {/* 组名 */}
                    <span
                      style={{
                        fontSize: "13.5px",
                        fontWeight: "700",
                        color: "#0f172a",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap" as const,
                      }}
                    >
                      {group.name}
                    </span>

                    {/* 关键词 */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", overflow: "hidden", maxHeight: "28px" }}>
                      {group.keywords.slice(0, 5).map((kw, ki) => (
                        <span
                          key={ki}
                          style={{
                            display: "inline-block",
                            padding: "1px 8px",
                            background: "#eff6ff",
                            color: "#1d4ed8",
                            borderRadius: "100px",
                            fontSize: "11.5px",
                            fontWeight: "600",
                            border: "1px solid #bfdbfe",
                            whiteSpace: "nowrap" as const,
                          }}
                        >
                          {kw}
                        </span>
                      ))}
                      {group.keywords.length > 5 && (
                        <span style={{ fontSize: "11px", color: "#94a3b8", padding: "2px 4px" }}>
                          +{group.keywords.length - 5}
                        </span>
                      )}
                    </div>

                    {/* 回复预览 */}
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap" as const,
                      }}
                    >
                      {group.reply.substring(0, 30)}...
                    </span>

                    {/* 状态 */}
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: "100px",
                        fontSize: "11px",
                        fontWeight: "700",
                        background: isEnabled ? "#dcfce7" : "#f1f5f9",
                        color: isEnabled ? "#16a34a" : "#94a3b8",
                        textAlign: "center" as const,
                      }}
                    >
                      {isEnabled ? "启用" : "停用"}
                    </span>

                    {/* 操作 */}
                    <div
                      style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        style={S.actionBtn}
                        title="编辑"
                        onClick={() => setEditingGroup({ index: i, group })}
                      >
                        ✏️
                      </button>
                      <button style={S.actionBtn} title="复制" onClick={() => duplicateGroup(i)}>
                        📋
                      </button>
                      <button
                        style={{
                          ...S.actionBtn,
                          color: isEnabled ? "#f59e0b" : "#16a34a",
                        }}
                        title={isEnabled ? "停用" : "启用"}
                        onClick={() => toggleGroup(i)}
                      >
                        {isEnabled ? "⏸" : "▶️"}
                      </button>
                      <button
                        style={{ ...S.actionBtn, color: "#ef4444", borderColor: "#fecaca" }}
                        title="删除"
                        onClick={() => deleteGroup(i)}
                      >
                        🗑
                      </button>
                    </div>
                  </div>

                  {/* 展开详情 */}
                  {isExpanded && (
                    <div
                      style={{
                        padding: "14px 16px 14px 52px",
                        background: "#f8fafc",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div>
                          <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", marginBottom: "6px" }}>
                            全部关键词（{group.keywords.length}个）
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                            {group.keywords.map((kw, ki) => (
                              <span
                                key={ki}
                                style={{
                                  padding: "2px 10px",
                                  background: "#eff6ff",
                                  color: "#1d4ed8",
                                  borderRadius: "100px",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  border: "1px solid #bfdbfe",
                                }}
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", marginBottom: "6px" }}>
                            回复内容
                          </div>
                          <div
                            style={{
                              background: "#f0fdf4",
                              border: "1px solid #dcfce7",
                              borderRadius: "8px",
                              padding: "10px 12px",
                              fontSize: "12.5px",
                              lineHeight: "1.7",
                              color: "#334155",
                              whiteSpace: "pre-wrap" as const,
                              maxHeight: "200px",
                              overflowY: "auto" as const,
                            }}
                          >
                            {group.reply}
                          </div>
                        </div>
                      </div>
                      {/* 排序按钮 */}
                      <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                        <button
                          style={{ ...S.actionBtn, opacity: i === 0 ? 0.3 : 1 }}
                          disabled={i === 0}
                          onClick={() => moveGroup(i, -1)}
                        >
                          ⬆️ 上移
                        </button>
                        <button
                          style={{
                            ...S.actionBtn,
                            opacity: i === config.keywordGroups.length - 1 ? 0.3 : 1,
                          }}
                          disabled={i === config.keywordGroups.length - 1}
                          onClick={() => moveGroup(i, 1)}
                        >
                          ⬇️ 下移
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ─── 默认回复 ─── */}
        <div style={S.card}>
          <h3 style={S.cardTitle}>
            📩 默认回复
            <span style={{ fontSize: "12px", fontWeight: "500", color: "#64748b" }}>
              — 未匹配任何关键词时的回复
            </span>
          </h3>
          <label style={S.label}>默认消息内容</label>
          <textarea
            style={{ ...S.textarea, minHeight: "100px" }}
            value={config.defaultReply}
            onChange={(e) => setConfig({ ...config, defaultReply: e.target.value })}
            placeholder="用户发送无法识别的消息时，自动回复此内容..."
          />
          <p style={S.hint}>建议列出可用的关键词提示，引导用户使用。</p>
          {config.defaultReply && (
            <div>
              <label style={{ ...S.label, marginTop: "12px" }}>💬 预览效果</label>
              <div style={S.previewBox}>{config.defaultReply}</div>
            </div>
          )}
        </div>

        {/* ─── 操作按钮 ─── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", gap: "12px", flexWrap: "wrap" as const }}>
          <button
            style={{
              padding: "8px 18px",
              background: "#fef2f2",
              color: "#dc2626",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "13px",
              cursor: resetting ? "not-allowed" : "pointer",
            }}
            onClick={handleReset}
            disabled={resetting}
          >
            {resetting ? "重置中..." : "🔄 重置为默认"}
          </button>
          <button
            style={{ ...S.primaryBtn, padding: "10px 28px", cursor: saving ? "not-allowed" : "pointer" }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "正在保存..." : "💾 保存自动回复配置"}
          </button>
        </div>

        {/* 底部说明 */}
        <div
          style={{
            marginTop: "24px",
            padding: "14px 18px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            fontSize: "12.5px",
            color: "#64748b",
            lineHeight: "1.8",
          }}
        >
          <strong style={{ color: "#334155" }}>💡 匹配规则说明</strong>
          <br />
          1. 用户发送消息后，系统按以下优先级匹配：<strong>精确匹配</strong> &gt; <strong>包含匹配（长词优先）</strong>
          <br />
          2. 精确匹配：用户消息完全等于某个关键词，直接命中该组
          <br />
          3. 包含匹配：用户消息中包含某个关键词，优先匹配最长的关键词
          <br />
          4. 未匹配时发送「默认回复」内容
          <br />
          5. 配置保存后即时生效，无需重启服务
        </div>
      </div>

      {/* 编辑弹窗 */}
      {editingGroup !== null && (
        <GroupModal
          group={editingGroup.group}
          onSave={handleSaveGroup}
          onClose={() => setEditingGroup(null)}
        />
      )}
      {showNewModal && (
        <GroupModal
          group={null}
          onSave={handleSaveGroup}
          onClose={() => setShowNewModal(false)}
        />
      )}
    </AdminLayout>
  );
}
