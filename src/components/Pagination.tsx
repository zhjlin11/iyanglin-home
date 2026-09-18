import Link from "next/link";

type PaginationProps = {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  buildUrl: (page: number) => string;
};

export default function Pagination({
  currentPage,
  totalItems,
  pageSize,
  buildUrl,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalPages <= 1) return null;

  // 生成页码列表 (例如: 1, 2, 3 ... 9)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
        padding: "1.25rem 1.5rem",
        background: "#ffffff",
        borderRadius: "16px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
        marginTop: "1.5rem",
      }}
    >
      {/* 左侧统计数据 */}
      <div style={{ fontSize: "13px", color: "#64748b" }}>
        共 <b style={{ color: "#0f172a" }}>{totalItems}</b> 条 · 第 <b style={{ color: "#0f766e" }}>{currentPage}</b> / {totalPages} 页
      </div>

      {/* 右侧分页按钮组 */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {/* 上一页 */}
        {currentPage > 1 ? (
          <Link
            href={buildUrl(currentPage - 1)}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#334155",
              fontSize: "13px",
              fontWeight: "700",
              textDecoration: "none",
              transition: "all 0.15s",
            }}
          >
            ← 上一页
          </Link>
        ) : (
          <span
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              border: "1px solid #f1f5f9",
              background: "#f8fafc",
              color: "#cbd5e1",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "not-allowed",
            }}
          >
            ← 上一页
          </span>
        )}

        {/* 页码数字 */}
        {pages.map((p, idx) => {
          if (p === "...") {
            return (
              <span key={`dots-${idx}`} style={{ padding: "0 4px", color: "#94a3b8", fontSize: "13px" }}>
                ...
              </span>
            );
          }

          const pageNum = Number(p);
          const isActive = pageNum === currentPage;

          return (
            <Link
              key={pageNum}
              href={buildUrl(pageNum)}
              style={{
                minWidth: "32px",
                height: "32px",
                padding: "0 6px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: isActive ? "800" : "600",
                textDecoration: "none",
                background: isActive ? "#0f766e" : "#f1f5f9",
                color: isActive ? "#ffffff" : "#334155",
                border: isActive ? "1px solid #0f766e" : "1px solid transparent",
                transition: "all 0.15s",
              }}
            >
              {pageNum}
            </Link>
          );
        })}

        {/* 下一页 */}
        {currentPage < totalPages ? (
          <Link
            href={buildUrl(currentPage + 1)}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#334155",
              fontSize: "13px",
              fontWeight: "700",
              textDecoration: "none",
              transition: "all 0.15s",
            }}
          >
            下一页 →
          </Link>
        ) : (
          <span
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              border: "1px solid #f1f5f9",
              background: "#f8fafc",
              color: "#cbd5e1",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "not-allowed",
            }}
          >
            下一页 →
          </span>
        )}
      </div>
    </div>
  );
}
