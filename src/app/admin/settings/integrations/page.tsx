"use client";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";

export default function IntegrationsPage() {
  const providers = [
    { name: "微信支付 (WeChat Pay)", status: "ACTIVE", label: "已配置 (脱敏)", maskKey: "mch_16****88", desc: "商业置顶与推广收款入口，敏感商户密钥已加密脱敏保存" },
    { name: "微信公众号 (WeChat Official)", status: "ACTIVE", label: "已授权", maskKey: "wx9a****1234", desc: "网页授权登录与消息推送服务" },
    { name: "手机短信服务 (SMS Service)", status: "PENDING", label: "体验调试中", maskKey: "aliyun_sms_***", desc: "验证码与紧急告警通知通道" },
    { name: "邮件通知服务 (SMTP Mail)", status: "ACTIVE", label: "正常", maskKey: "smtp.iyanglin.com", desc: "管理员系统审计与告警邮件通道" },
    { name: "地图与地理编码 (Map API)", status: "ACTIVE", label: "正常", maskKey: "amap_key_***", desc: "杨林本地商家与房产地理坐标解析" },
  ];

  return (
    <AdminLayout
      title="🔒 第三方服务集成与密钥安全看板"
      subtitle="统一管理微信支付、公众号、短信、邮件与地图集成状态。敏感私钥接口安全屏蔽。"
    >
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af", padding: "12px 16px", borderRadius: "8px", marginBottom: "1.5rem", fontSize: "13px" }}>
        ℹ️ <b>安全脱敏说明：</b> 根据安全合规规范，所有微信支付私钥、数据库密匙与 API Key 均在服务端加密保存，前端仅显示“已配置/已授权”状态，禁止明文返回。
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
        {providers.map((p, idx) => (
          <div key={idx} style={{ background: "white", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "bold", color: "#0f172a" }}>{p.name}</h4>
              <StatusBadge status={p.status} customLabel={p.label} />
            </div>
            <div style={{ fontSize: "12px", fontFamily: "monospace", color: "#0369a1", marginBottom: "8px" }}>脱敏凭证: {p.maskKey}</div>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>{p.desc}</p>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
