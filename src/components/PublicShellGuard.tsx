"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface PublicShellGuardProps {
  children: React.ReactNode;
}

/**
 * PublicShellGuard
 * 保证前台专属组件（如前台巨大页脚 Footer、移动端前台悬浮导航 MobileFloatingDock、营销横幅等）
 * 绝对不会在后台管理系统 /admin/**、登录注册页、或独立 App 沉浸路由中挂载或渲染。
 * 
 * 同时在 SPA 路由切换时，响应式卸载/装载前台组件，彻底实现前后台布局物理级隔离。
 */
export default function PublicShellGuard({ children }: PublicShellGuardProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isIsolatedRoute = (path: string | null) => {
    if (!path) return false;
    return (
      path.startsWith("/admin") ||
      path === "/login" ||
      path === "/register" ||
      path.startsWith("/workspace") ||
      path.startsWith("/mp") ||
      path.startsWith("/assistant") ||
      path.startsWith("/courier") ||
      path.startsWith("/api")
    );
  };

  // 如果处于后台或独立路由，彻底不渲染任何前台 Shell 组件
  if (isIsolatedRoute(pathname)) {
    return null;
  }

  return (
    <div className="public-shell-container pb-[calc(96px+env(safe-area-inset-bottom,0px))] md:pb-0">
      {children}
    </div>
  );
}
