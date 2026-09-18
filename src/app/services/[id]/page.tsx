"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  ShieldCheck,
  Clock,
  Coins,
  Scale,
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
  Phone,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  Share2,
  Calendar,
} from "lucide-react";

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImgIdx, setSelectedImgIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!productId) return;
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/services/products/${productId}`);
        const json = await res.json();
        if (json.success && json.data) {
          setProduct(json.data);
        }
      } catch (err) {
        console.error("fetch product detail error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [productId]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
        <Navbar />
        <div style={{ textAlign: "center", padding: "100px 0", color: "#94a3b8" }}>
          <div style={{ fontSize: "2rem", marginBottom: "12px" }}>⏳</div>
          <div>正在加载服务详情...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
        <Navbar />
        <div style={{ maxWidth: "600px", margin: "80px auto", textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔍</div>
          <h2>未找到该服务商品</h2>
          <p style={{ color: "#64748b", marginBottom: "24px" }}>该服务可能已下架或不存在</p>
          <Link
            href="/services"
            style={{
              backgroundColor: "#0f766e",
              color: "#ffffff",
              padding: "10px 24px",
              borderRadius: "24px",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            返回服务商城
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images && product.images.length > 0
    ? product.images
    : product.coverImage
    ? [product.coverImage]
    : ["https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80"];

  const rawPrice = product.priceCents ?? product.price ?? 0;
  const totalPrice = (rawPrice * quantity) / 100;
  const subText = product.subtitle || product.description || "";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* Breadcrumb Navigation */}
      <div style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "12px 16px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "#64748b" }}>
          <Link href="/" style={{ color: "#64748b", textDecoration: "none" }}>首页</Link>
          <ChevronRight size={14} />
          <Link href="/services" style={{ color: "#64748b", textDecoration: "none" }}>标准化服务商城</Link>
          <ChevronRight size={14} />
          <Link href={`/services?category=${encodeURIComponent(product.category)}`} style={{ color: "#64748b", textDecoration: "none" }}>
            {product.category}
          </Link>
          <ChevronRight size={14} />
          <span style={{ color: "#0f172a", fontWeight: 600, maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {product.title}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ maxWidth: "1200px", width: "100%", margin: "24px auto", padding: "0 16px 80px", flex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "32px" }}>
          {/* Left: Images Showcase */}
          <div>
            <div
              style={{
                borderRadius: "16px",
                overflow: "hidden",
                aspectRatio: "4/3",
                backgroundColor: "#e2e8f0",
                boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
              }}
            >
              <img
                src={images[selectedImgIdx]}
                alt={product.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>

            {images.length > 1 && (
              <div style={{ display: "flex", gap: "10px", marginTop: "12px", overflowX: "auto" }}>
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImgIdx(idx)}
                    style={{
                      width: "70px",
                      height: "54px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: idx === selectedImgIdx ? "2px solid #0f766e" : "1px solid #cbd5e1",
                      padding: 0,
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            )}

            {/* Provider Quick Card */}
            {product.provider && (
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "14px",
                  padding: "16px",
                  marginTop: "24px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "10px", fontWeight: 600 }}>
                  服务履约保障商家
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "10px",
                      backgroundColor: "#f1f5f9",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {product.provider.avatar ? (
                      <img src={product.provider.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>
                        👨‍🔧
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>
                        {product.provider.name}
                      </span>
                      {product.provider.verificationType && (
                        <span style={{ backgroundColor: "#dcfce7", color: "#15803d", padding: "1px 6px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700 }}>
                          ✓ 平台认证
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px" }}>
                      已完成服务: <strong style={{ color: "#0f766e" }}>{product.provider.completedOrders || 0}</strong> 单
                    </div>
                  </div>
                  <Link
                    href={`/provider/${product.provider.id}`}
                    style={{
                      fontSize: "0.8rem",
                      color: "#0f766e",
                      fontWeight: 600,
                      textDecoration: "none",
                      border: "1px solid #0f766e",
                      padding: "4px 10px",
                      borderRadius: "14px",
                    }}
                  >
                    查看主页
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right: Pricing, Specs & Booking Form */}
          <div>
            <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "inline-block", backgroundColor: "#f0fdf4", color: "#15803d", fontSize: "0.75rem", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", marginBottom: "10px" }}>
                {product.category} · 标准化履约
              </div>

              <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", margin: "0 0 8px 0", lineHeight: 1.4 }}>
                {product.title}
              </h1>

              {subText && (
                <p style={{ fontSize: "0.9rem", color: "#64748b", margin: "0 0 16px 0", lineHeight: 1.5 }}>
                  {subText}
                </p>
              )}

              {/* Price Banner */}
              <div
                style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: "12px",
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "baseline",
                  gap: "6px",
                  marginBottom: "20px",
                  border: "1px solid #f1f5f9",
                }}
              >
                <span style={{ fontSize: "1rem", color: "#dc2626", fontWeight: 700 }}>¥</span>
                <span style={{ fontSize: "2rem", color: "#dc2626", fontWeight: 900 }}>
                  {(rawPrice / 100).toFixed(2)}
                </span>
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>/ {product.unit || "次"}</span>

                <span style={{ marginLeft: "auto", fontSize: "0.8rem", color: "#94a3b8" }}>
                  已售 {product.salesCount || 0} 件
                </span>
              </div>

              {/* 4 Guarantees */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  padding: "12px",
                  backgroundColor: "#f0fdfa",
                  borderRadius: "10px",
                  marginBottom: "24px",
                  border: "1px solid #ccfbf1",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "#115e59" }}>
                  <ShieldCheck size={16} color="#0f766e" />
                  <span>平台担保：满意后放款</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "#115e59" }}>
                  <Coins size={16} color="#0f766e" />
                  <span>透明标价：无现场加价</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "#115e59" }}>
                  <Clock size={16} color="#0f766e" />
                  <span>准时上门：超时有赔付</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "#115e59" }}>
                  <Scale size={16} color="#0f766e" />
                  <span>售后无忧：72h验收期</span>
                </div>
              </div>

              {/* Quantity Stepper */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#334155" }}>预订数量：</span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#ffffff",
                      cursor: quantity <= 1 ? "not-allowed" : "pointer",
                      fontWeight: 700,
                      color: "#475569",
                    }}
                  >
                    -
                  </button>
                  <span style={{ width: "36px", textAlign: "center", fontWeight: 700, fontSize: "1rem" }}>
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#ffffff",
                      cursor: "pointer",
                      fontWeight: 700,
                      color: "#475569",
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Total & Checkout CTA Button */}
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "14px" }}>
                  <span style={{ fontSize: "0.9rem", color: "#64748b" }}>预估应付金额：</span>
                  <div>
                    <span style={{ fontSize: "0.9rem", color: "#dc2626", fontWeight: 700 }}>¥</span>
                    <span style={{ fontSize: "1.6rem", color: "#dc2626", fontWeight: 900 }}>
                      {totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/services/${product.id}/checkout?quantity=${quantity}`}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "center",
                    backgroundColor: "#0f766e",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "1rem",
                    padding: "12px 0",
                    borderRadius: "28px",
                    textDecoration: "none",
                    boxShadow: "0 4px 14px rgba(15,118,110,0.3)",
                  }}
                >
                  立即在线下单 · 微信担保支付
                </Link>
                <div style={{ textAlign: "center", fontSize: "0.75rem", color: "#94a3b8", marginTop: "8px" }}>
                  🔒 支付资金将存入平台担保专户，完工满意前师傅无法提现
                </div>
              </div>
            </div>

            {/* Scope of Service & Inclusions */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", marginTop: "20px", border: "1px solid #e2e8f0" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", margin: "0 0 16px 0" }}>
                📋 服务范围与说明
              </h2>

              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.9rem", fontWeight: 600, color: "#15803d", marginBottom: "8px" }}>
                  <CheckCircle2 size={16} />
                  <span>服务包含内容：</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: "24px", color: "#475569", fontSize: "0.85rem", lineHeight: 1.6 }}>
                  {product.included && product.included.length > 0 ? (
                    product.included.map((item: string, i: number) => <li key={i}>{item}</li>)
                  ) : (
                    <>
                      <li>上门检测与基础故障诊断</li>
                      <li>专业工具与耗材标准作业</li>
                      <li>作业完成后现场清理与试机运行</li>
                    </>
                  )}
                </ul>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.9rem", fontWeight: 600, color: "#dc2626", marginBottom: "8px" }}>
                  <XCircle size={16} />
                  <span>服务不包含内容：</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: "24px", color: "#475569", fontSize: "0.85rem", lineHeight: 1.6 }}>
                  {product.excluded && product.excluded.length > 0 ? (
                    product.excluded.map((item: string, i: number) => <li key={i}>{item}</li>)
                  ) : (
                    <>
                      <li>特殊高空攀爬作业费（需与师傅现场协商并签署免责）</li>
                      <li>主要核心配件更换（如压缩机、主板等按配件成本单据结算）</li>
                    </>
                  )}
                </ul>
              </div>

              {product.content && (
                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "14px", marginTop: "14px" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    服务详细描述：
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {product.content}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Booking Footer Bar (390x844 responsive) */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#ffffff",
          borderTop: "1px solid #e2e8f0",
          padding: "10px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 -4px 16px rgba(0,0,0,0.06)",
          zIndex: 50,
        }}
      >
        <div>
          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>合计: </span>
          <span style={{ fontSize: "0.85rem", color: "#dc2626", fontWeight: 700 }}>¥</span>
          <span style={{ fontSize: "1.3rem", color: "#dc2626", fontWeight: 900 }}>
            {totalPrice.toFixed(2)}
          </span>
          <span style={{ fontSize: "0.75rem", color: "#94a3b8", marginLeft: "4px" }}>({quantity}件)</span>
        </div>

        <Link
          href={`/services/${product.id}/checkout?quantity=${quantity}`}
          style={{
            backgroundColor: "#0f766e",
            color: "#ffffff",
            padding: "8px 24px",
            borderRadius: "24px",
            fontWeight: 700,
            fontSize: "0.9rem",
            textDecoration: "none",
            boxShadow: "0 2px 8px rgba(15,118,110,0.3)",
          }}
        >
          立即下单
        </Link>
      </div>
    </div>
  );
}
