"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { ShieldCheck, ArrowLeft, Store, AlertTriangle, Phone, MapPin, CheckCircle2 } from "lucide-react";

export default function MallLicensePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <div style={{ maxWidth: "800px", margin: "24px auto 40px", padding: "0 16px", width: "100%", boxSizing: "border-box" }}>
        {/* 返回商城面包屑 */}
        <div style={{ marginBottom: "16px" }}>
          <Link
            href="/mall"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "#0B7A75",
              fontSize: "13px",
              fontWeight: "700",
              textDecoration: "none",
              background: "#E6F4F2",
              padding: "6px 14px",
              borderRadius: "20px",
            }}
          >
            <ArrowLeft size={14} />
            <span>返回自营便利店</span>
          </Link>
        </div>

        {/* 资质卡片主容器 */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
            overflow: "hidden",
          }}
        >
          {/* 顶栏 */}
          <div
            style={{
              background: "linear-gradient(135deg, #0B7A75 0%, #075E5A 100%)",
              color: "#ffffff",
              padding: "24px 28px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={28} style={{ color: "#34D399" }} />
            </div>
            <div>
              <h1 style={{ fontSize: "20px", fontWeight: "900", margin: "0 0 4px", letterSpacing: "-0.3px" }}>
                自营便利店 · 营业执照与合规资质公示
              </h1>
              <p style={{ fontSize: "13px", color: "#D1FAE5", margin: 0 }}>
                杨林生活网本地现货仓 · 实体持证经营 · 真实保障
              </p>
            </div>
          </div>

          <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* 核心主体信息 */}
            <div>
              <h2 style={{ fontSize: "15px", fontWeight: "800", color: "#1E293B", margin: "0 0 12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Store size={18} style={{ color: "#0B7A75" }} />
                <span>主体备案登记信息</span>
              </h2>

              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "10px",
                  padding: "16px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "12px",
                  fontSize: "13px",
                  color: "#334155",
                }}
              >
                <div>
                  <span style={{ color: "#64748B" }}>运营主体名称：</span>
                  <strong style={{ color: "#0F172A" }}>杨林生活网自营便利店（本地直营）</strong>
                </div>
                <div>
                  <span style={{ color: "#64748B" }}>主体性质：</span>
                  <span style={{ color: "#0F172A", fontWeight: "600" }}>实体个体工商户 / 企业营业执照（已核验登记）</span>
                </div>
                <div>
                  <span style={{ color: "#64748B" }}>统一社会信用代码：</span>
                  <span style={{ color: "#0F172A", fontFamily: "monospace", fontWeight: "700" }}>92530124MA6N****7K</span>
                </div>
                <div>
                  <span style={{ color: "#64748B" }}>食品销售备案：</span>
                  <span style={{ color: "#059669", fontWeight: "700" }}>仅销售预包装食品备案已完成 ✅</span>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <span style={{ color: "#64748B" }}>法定许可经营范围：</span>
                  <span style={{ color: "#0F172A" }}>
                    预包装食品销售、散装食品零售、乳制品、饮料水饮、日用百货、文具用品、数码日用小配件零售及同城即时配送服务。
                  </span>
                </div>
              </div>
            </div>

            {/* 仓储履约地址与联系方式 */}
            <div>
              <h2 style={{ fontSize: "15px", fontWeight: "800", color: "#1E293B", margin: "0 0 12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <MapPin size={18} style={{ color: "#0B7A75" }} />
                <span>自营现货仓与客服专线</span>
              </h2>

              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "10px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  fontSize: "13px",
                  color: "#334155",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <MapPin size={15} style={{ color: "#64748B" }} />
                  <span><strong>现货直发仓：</strong>云南省昆明市嵩明县杨林职教园区 / 杨林镇中心商业区</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Phone size={15} style={{ color: "#64748B" }} />
                  <span><strong>官方自营服务热线：</strong>138-8800-1001 / 136-1969-4207（服务时间: 08:30 - 22:30）</span>
                </div>
              </div>
            </div>

            {/* 合规红线声明 */}
            <div
              style={{
                background: "#FEF2F2",
                border: "1.5px solid #FCA5A5",
                borderRadius: "10px",
                padding: "16px",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
              }}
            >
              <AlertTriangle size={22} style={{ color: "#DC2626", flexShrink: 0, marginTop: "2px" }} />
              <div>
                <h3 style={{ fontSize: "14px", fontWeight: "800", color: "#991B1B", margin: "0 0 4px" }}>
                  【国家烟草专卖合规红线严格执行声明】
                </h3>
                <p style={{ fontSize: "12.5px", color: "#B91C1C", lineHeight: 1.6, margin: 0 }}>
                  根据《中华人民共和国烟草专卖法》、《中华人民共和国未成年人保护法》及相关国家法规，杨林生活网自营便利店平台<strong>严禁网络销售卷烟、雪茄、电子烟及任何烟草制品</strong>。平台严禁上架烟草类商品，严禁在线支付及跑腿代购香烟。
                </p>
              </div>
            </div>

            {/* 售后与正品承诺 */}
            <div>
              <h2 style={{ fontSize: "15px", fontWeight: "800", color: "#1E293B", margin: "0 0 12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <CheckCircle2 size={18} style={{ color: "#0B7A75" }} />
                <span>正品自营与售后承诺</span>
              </h2>

              <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#475569", lineHeight: 1.8 }}>
                <li><strong>本地现货发货：</strong>所有在售商品均为本地实体仓库存现货，由杨林生活网专人接单、专人配送或支持到店自提。</li>
                <li><strong>保质期严控：</strong>食品类商品严格杜绝临期/过期品，出库前均经过双重人工核验。</li>
                <li><strong>破损坏单极速退款：</strong>到货后如发现包装破损或少件漏发，凭实物照片通过小程序或网站订单直接申请售后，官方客服核实后秒级原路退款。</li>
              </ul>
            </div>

            {/* 底部按钮 */}
            <div style={{ textAlign: "center", paddingTop: "10px" }}>
              <Link
                href="/mall"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#0B7A75",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: "800",
                  padding: "10px 28px",
                  borderRadius: "24px",
                  textDecoration: "none",
                  boxShadow: "0 4px 12px rgba(11, 122, 117, 0.3)",
                }}
              >
                返回便利店选购商品
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}