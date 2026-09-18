import http from "http";
import https from "https";

export async function runAuthFlowTest() {
  console.log("🧪 正在执行 Phase 24 全链路用户注册、登录、Session 与联系方式权限测试...");

  const username = `user_${Date.now().toString().slice(-4)}`;
  const password = "password123";

  console.log(`\n【场景 1: 用户注册测试】(用户名: ${username})`);

  // 1. Register User
  const regRes = await fetch("https://iyanglin.com/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const regCookie = regRes.headers.get("set-cookie") || "";
  const regData = await regRes.json();

  console.log(`- 注册响应 Code: ${regRes.status}`);
  console.log(`- 注册数据:`, regData);
  console.log(`- 写入 Session Cookie: ${regCookie ? "✅ 存在 (yanglin_session)" : "❌ 未写入"}`);

  const sessionToken = regCookie.match(/yanglin_session=([^;]+)/)?.[1] || "";

  // 2. Authenticated Contact Reveal Test
  console.log(`\n【场景 2: 已登录普通用户查看联系方式】`);
  const contactRes = await fetch("https://iyanglin.com/api/jobs/cms2kzt7e0001xwrxqvmwjc6c/contact", {
    headers: {
      cookie: `yanglin_session=${sessionToken}`,
    },
  });
  const contactData = await contactRes.json();
  console.log(`- 接口响应 Code: ${contactRes.status}`);
  console.log(`- 接口返回数据:`, contactData);
  console.log(`- 是否按需返回完整 11 位电话: ${contactData.phone === "18006778483" ? "✅ 成功 (18006778483)" : "❌ 失败"}`);

  // 3. Logout Test
  console.log(`\n【场景 3: 用户退出登录测试】`);
  const logoutRes = await fetch("https://iyanglin.com/api/auth/logout", {
    method: "POST",
    headers: {
      cookie: `yanglin_session=${sessionToken}`,
    },
  });
  const logoutCookie = logoutRes.headers.get("set-cookie") || "";
  console.log(`- 退出登录响应 Code: ${logoutRes.status}`);
  console.log(`- Cookie 清除指令: ${logoutCookie.includes("Max-Age=0") || logoutCookie.includes("Expires=") ? "✅ 成功清除" : "❌ 未清除"}`);

  // 4. Post-logout Contact Reveal Test (Unauthenticated)
  console.log(`\n【场景 4: 退出后访问联系方式接口 (预期 HTTP 401 拦截)】`);
  const postLogoutRes = await fetch("https://iyanglin.com/api/jobs/cms2kzt7e0001xwrxqvmwjc6c/contact");
  const postLogoutData = await postLogoutRes.json();
  console.log(`- 接口响应 Code: ${postLogoutRes.status}`);
  console.log(`- 接口数据:`, postLogoutData);
  console.log(`- 是否安全拦截 (HTTP 401 & LOGIN_REQUIRED): ${postLogoutRes.status === 401 && postLogoutData.code === "LOGIN_REQUIRED" ? "✅ 成功安全拦截" : "❌ 未拦截"}`);

  console.log("\n--------------------------------------------------");
}

if (require.main === module) {
  runAuthFlowTest().catch(console.error);
}
