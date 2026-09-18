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

  return <>{children}</>;
}
