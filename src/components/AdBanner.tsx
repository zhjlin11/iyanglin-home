import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { existsSync } from "fs";
import { join } from "path";

interface AdBannerProps {
  /** 广告位 key: HOME_BANNER | LISTING_TOP | JOB_TOP | HOUSE_TOP | JOBS_BOTTOM | SIDEBAR | SHOP_RECOMMEND */
  placementKey?: string;
  /** 最多显示几条 */
  maxItems?: number;
  /** 不显示招商占位（用于内容中间穿插的小广告位） */
  hidePlaceholder?: boolean;
}

/**
 * 服务端组件：从数据库读取当前有效广告并展示
 * 支持单图 / 双图并排布局，使用 AdPlacement + Advertisement 模型
 * 图片加载失败时自动隐藏该广告卡片
 */
export default async function AdBanner({ placementKey, maxItems = 2, hidePlaceholder = false }: AdBannerProps) {
  const now = new Date();

  let ads: { id: string; title: string; image: string; link: string }[] = [];
  try {
    const where: Record<string, unknown> = {
      status: "ACTIVE",
      AND: [
        { OR: [{ startAt: null }, { startAt: { lte: now } }] },
        { OR: [{ endAt: null }, { endAt: { gte: now } }] },
      ],
    };
    if (placementKey) {
      where.placement = { key: placementKey, enabled: true };
    }

    ads = await prisma.advertisement.findMany({
      where,
      orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
      take: maxItems,
      select: { id: true, title: true, image: true, link: true },
    });
  } catch {
    // 表可能尚未有数据，静默降级
  }

  // 过滤掉没有有效图片路径的广告，以及本地图片文件不存在的广告
  ads = ads.filter((a) => {
    if (!a.image || a.image.trim() === "") return false;
    // 外部 URL 图片直接保留
    if (a.image.startsWith("http://") || a.image.startsWith("https://")) return true;
    // 本地图片：验证文件是否存在
    try {
      const publicDir = join(process.cwd(), "public");
      return existsSync(join(publicDir, a.image));
    } catch {
      return true; // 验证失败时保留，避免误删
    }
  });

  // 无广告时显示招商占位或不显示
  if (ads.length === 0) {
    if (hidePlaceholder) return null;
    return (
      <section style={{ maxWidth: "1240px", margin: "1.5rem auto 0 auto", padding: "0 1.25rem" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #0B7A75 0%, #075e5a 100%)",
            color: "#ffffff",
            borderRadius: "14px",
            padding: "1.25rem 1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            boxShadow: "0 4px 14px rgba(11,122,117,0.15)",
          }}
        >
          <div style={{ flex: "1 1 260px" }}>
            <div style={{ display: "inline-block", padding: "2px 8px", background: "rgba(255,255,255,0.2)", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", marginBottom: "6px" }}>
              赞助展位 / 商业合作
            </div>
            <h4 style={{ margin: "0 0 4px 0", fontSize: "1.1rem", fontWeight: "bold" }}>
              📢 杨林生活网 · 黄金广告位招商中
            </h4>
            <p style={{ margin: 0, fontSize: "13px", opacity: 0.9, lineHeight: "1.4" }}>
              面向全镇、大学城与经开区数万活跃用户，精准推广您的品牌与商家
            </p>
          </div>
          <Link
            prefetch={false}
            href="/bianmin"
            style={{
              background: "#ffffff",
              color: "#075e5a",
              fontWeight: "bold",
              fontSize: "13px",
              padding: "10px 22px",
              borderRadius: "20px",
              whiteSpace: "nowrap",
              flexShrink: 0,
              textDecoration: "none",
            }}
          >
            联系客服投放广告 →
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section
      className="ad-banner-section"
      style={{ maxWidth: "1240px", margin: "1.5rem auto 0 auto", padding: "0 1.25rem" }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: ads.length > 1 ? "1fr 1fr" : "1fr",
          gap: "16px",
        }}
      >
        {ads.map((ad) => {
          const card = (
            <div
              key={ad.id}
              className="ad-card-item"
              style={{
                position: "relative",
                borderRadius: "14px",
                overflow: "hidden",
                background: "linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ad.image}
                alt={ad.title}
                loading="lazy"
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  bottom: "8px",
                  right: "8px",
                  background: "rgba(0,0,0,0.45)",
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "10px",
                  padding: "2px 8px",
                  borderRadius: "4px",
                }}
              >
                广告
              </span>
            </div>
          );

          if (ad.link) {
            return (
              <Link
                key={ad.id}
                href={ad.link}
                target={ad.link.startsWith("http") ? "_blank" : undefined}
                rel={ad.link.startsWith("http") ? "noopener noreferrer" : undefined}
                style={{ textDecoration: "none", display: "block" }}
                prefetch={false}
              >
                {card}
              </Link>
            );
          }
          return <div key={ad.id}>{card}</div>;
        })}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .ad-banner-section > div { grid-template-columns: 1fr !important; }
        }
        .ad-card-item img[src=""],
        .ad-card-item img:not([src]) {
          display: none !important;
        }
      `}</style>
    </section>
  );
}
