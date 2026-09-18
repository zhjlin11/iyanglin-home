export async function testLoginRateLimit() {
  console.log("⚡ 正在测试登录 API 限流 (Rate Limiting HTTP 429)...");

  let limitTriggered = false;

  for (let i = 1; i <= 12; i++) {
    const res = await fetch("https://iyanglin.com/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "wrong_password_123" }),
    });

    const data = await res.json().catch(() => ({}));
    console.log(`- 尝试 ${i}: Status=${res.status} | Code=${data.code || data.error}`);

    if (res.status === 429 && data.code === "LOGIN_RATE_LIMITED") {
      limitTriggered = true;
      console.log(`✅ 第 ${i} 次尝试成功触发 Rate Limit 限流防护 (HTTP 429 LOGIN_RATE_LIMITED)！`);
      break;
    }
  }

  console.log(`- 限流触发校验总结: ${limitTriggered ? "✅ 成功拦截暴破攻击" : "❌ 未拦截"}`);
}

if (require.main === module) {
  testLoginRateLimit().catch(console.error);
}
