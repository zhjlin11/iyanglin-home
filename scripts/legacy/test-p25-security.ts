import { PrismaClient } from "@prisma/client";
import { signSession, verifySession } from "../../src/lib/auth";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://vasto_admin:vasto_password_2026@127.0.0.1:5432/yanglin_db?schema=public",
    },
  },
});

export async function runSecurityTests() {
  console.log("🔒 正在执行 Phase 25 认证安全加固全套实测...");

  // 1. Malicious Registration Test
  console.log("\n【场景 1: 恶意提交 role: ADMIN 注册测试】");
  const hackerUsername = `hacker_${Date.now().toString().slice(-4)}`;
  const regRes = await fetch("https://iyanglin.com/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: hackerUsername, password: "password123", role: "ADMIN" }),
  });

  const regData = await regRes.json();
  console.log(`- 注册响应:`, regData);

  const dbUser = await prisma.user.findUnique({ where: { username: hackerUsername } });
  console.log(`- 数据库中真实创建的用户角色: ${dbUser?.role}`);
  console.log(`- 权限越权防范结果: ${dbUser?.role === "USER" ? "✅ 成功防范 (服务端强制归为 USER)" : "❌ 越权成功 (危险)"}`);

  // 2. Token Tampering Test
  console.log("\n【场景 2: Token 载荷篡改测试】");
  const legitToken = signSession({ id: dbUser?.id || "test", username: hackerUsername, role: "USER" });
  const [data, signature] = legitToken.split(".");

  // Attempt to tamper payload from USER to ADMIN
  const decodedPayload = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
  decodedPayload.role = "ADMIN";
  const tamperedData = Buffer.from(JSON.stringify(decodedPayload)).toString("base64url");
  const tamperedToken = `${tamperedData}.${signature}`;

  const verified = verifySession(tamperedToken);
  console.log(`- 签名验签结果: ${verified === null ? "✅ 验签失败被拒绝 (HMAC 防篡改有效)" : "❌ 验签绕过"}`);

  const authTestRes = await fetch("https://iyanglin.com/api/jobs/cms2kzt7e0001xwrxqvmwjc6c/contact", {
    headers: { cookie: `yanglin_session=${tamperedToken}` },
  });
  console.log(`- 篡改 Token 访问敏感 API 响应 Status: ${authTestRes.status}`);
  console.log(`- API 拦截结果: ${authTestRes.status === 401 ? "✅ 成功安全拦截 (HTTP 401)" : "❌ 未拦截"}`);

  // Clean test hacker user
  if (dbUser) {
    await prisma.user.delete({ where: { id: dbUser.id } });
  }

  console.log("--------------------------------------------------");
  await prisma.$disconnect();
}

if (require.main === module) {
  runSecurityTests().catch(console.error);
}
