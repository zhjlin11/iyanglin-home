import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const reqHeaders = await headers();
  const pathname = reqHeaders.get("x-pathname") || "";

  // Allow /admin/login without redirection loop
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login")) {
    return <>{children}</>;
  }

  const req = new Request("http://localhost" + (pathname || "/admin"), {
    headers: reqHeaders,
  });
  const session = await getSession(req);

  // If not logged in or role is not authorized, redirect to /admin/login immediately
  const allowedRoles = ["ADMIN", "SUPERADMIN", "EDITOR", "REVIEWER"];
  if (!session || !allowedRoles.includes((session.role || "").toUpperCase())) {
    redirect("/admin/login?error=forbidden");
  }

  return (
    <div className="admin-root-shell" style={{ minHeight: "100vh", background: "#F5F7FA", isolation: "isolate" }}>
      <style>{`
        /* 彻底阻断任何前台 Footer / 悬浮栏 / 营销条在后台管理系统渲染 */
        .desktop-footer, .mobile-footer, .public-footer, #mobile-floating-dock, .public-shell-container {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          overflow: hidden !important;
          pointer-events: none !important;
        }
      `}</style>
      {children}
    </div>
  );
}
