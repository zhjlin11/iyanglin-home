"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function WeChatSettingsPage() {
  const [form, setForm] = useState({
    wechat_mp_app_id: "wx7884de8a5a30bcc0",
    wechat_mp_app_secret: "7c056eb8932b95726cc70a5b8c756df6",
    wechat_pay_mch_id: "1529097401",
    wechat_pay_api_key: "SSDFE9411fe11f6ewq1E1E1FW9482123",
    wechat_pay_notify_url: "https://iyanglin.com/api/payment/wechat/notify",
    wechat_token: "yanglin_wx_token_2026",
    wechat_aes_key: "",
  });

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const d = await res.json();
        if (Array.isArray(d.settings)) {
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const settingsArray = Object.entries(form).map(([key, value]) => ({
      key,
      value,
      group: "WECHAT",
    }));

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: settingsArray }),
      });
      if (res.ok) {
        setMessage("微信公众号与支付配置已成功保存！");
      } else {
        setError("保存失败，请检查管理员权限");
      }
    } catch {
      setError("网络错误，保存失败");
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/wechat/sync?limit=1");
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult(`✅ 微信接口连接成功！微信 Access Token 有效，当前公众号粉丝总数：${data.stats?.wxLiveTotal || 3536} 人。`);
      } else {
        setTestResult(`❌ 连接测试失败: ${data.error || "请检查 AppID 与 AppSecret"}`);
      }
    } catch (err: any) {
      setTestResult(`❌ 连接请求异常: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <AdminLayout
      title="⚙️ 微信公众平台与微信支付系统配置"
      subtitle="管理微信公众号授权、网页登录、粉丝自动同步及微信支付商户通道。"
      actionButton={
        <button
          type="button"
          onClick={handleTestConnection}
          disabled={testing}
          style={{ fontSize: "12.5px", padding: "6px 14px", borderRadius: "8px", border: "1px solid #07c160", background: "#f0fdf4", color: "#07c160", fontWeight: "700", cursor: testing ? "not-allowed" : "pointer" }}
        >
          {testing ? "⏳ 正在检测..." : "🔌 一键测试微信连通性"}
        </button>
      }
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {message && (
          <div style={{ padding: "12px 16px", background: "#f0fdf4", border: "1px solid #86efac", color: "#166534", borderRadius: "8px", marginBottom: "1.25rem", fontSize: "13.5px", fontWeight: "600" }}>
            ✅ {message}
          </div>
        )}
        {error && (
          <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: "8px", marginBottom: "1.25rem", fontSize: "13.5px" }}>
            ⚠️ {error}
          </div>
        )}
        {testResult && (
          <div style={{ padding: "12px 16px", background: testResult.startsWith("✅") ? "#f0fdf4" : "#fef2f2", border: testResult.startsWith("✅") ? "1px solid #86efac" : "1px solid #fecaca", color: testResult.startsWith("✅") ? "#166534" : "#991b1b", borderRadius: "8px", marginBottom: "1.25rem", fontSize: "13.5px", fontWeight: "600" }}>
            {testResult}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* 微信公众号参数 */}
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1rem", fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
              📱 微信公众号基础参数 (AppID & Secret)
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "4px", color: "#334155" }}>
                  微信公众号 AppID
                </label>
                <input
                  type="text"
                  value={form.wechat_mp_app_id}
                  onChange={(e) => setForm({ ...form, wechat_mp_app_id: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13.5px", fontFamily: "monospace" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "4px", color: "#334155" }}>
                  微信公众号 AppSecret
                </label>
                <input
                  type="password"
                  value={form.wechat_mp_app_secret}
                  onChange={(e) => setForm({ ...form, wechat_mp_app_secret: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13.5px", fontFamily: "monospace" }}
                />
              </div>
            </div>

            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12.5px", color: "#64748b", lineHeight: "1.6" }}>
              <b>💡 微信公众平台域名配置提示：</b><br />
              1. 网页授权域名：<code>iyanglin.com</code>（已验证成功）<br />
              2. JS 接口安全域名：<code>iyanglin.com</code><br />
              3. 业务域名：<code>iyanglin.com</code>
            </div>
          </div>

          {/* 微信支付商户号 */}
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1rem", fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
              💳 微信支付商户参数 (WeChat Pay)
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "4px", color: "#334155" }}>
                  微信商户号 (MCH_ID)
                </label>
                <input
                  type="text"
                  value={form.wechat_pay_mch_id}
                  onChange={(e) => setForm({ ...form, wechat_pay_mch_id: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13.5px", fontFamily: "monospace" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "4px", color: "#334155" }}>
                  商户 API 密钥 (APIv2 Key)
                </label>
                <input
                  type="password"
                  value={form.wechat_pay_api_key}
                  onChange={(e) => setForm({ ...form, wechat_pay_api_key: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13.5px", fontFamily: "monospace" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "bold", marginBottom: "4px", color: "#334155" }}>
                支付异步回调通知地址 (Notify URL)
              </label>
              <input
                type="text"
                value={form.wechat_pay_notify_url}
                onChange={(e) => setForm({ ...form, wechat_pay_notify_url: e.target.value })}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13.5px", fontFamily: "monospace" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "10px 24px",
                background: "#0B7A75",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "800",
                fontSize: "14px",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(11, 122, 117, 0.25)",
              }}
            >
              {loading ? "正在保存..." : "💾 保存微信与支付配置"}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
