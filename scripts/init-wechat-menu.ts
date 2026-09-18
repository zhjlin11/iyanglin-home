/**
 * 初始化公众号自定义菜单 → 指向 iyanglin.com 新站
 *
 * 使用方式：在服务器上执行
 *   cd /var/www/iyanglin.com
 *   npx tsx scripts/init-wechat-menu.ts
 */

const SITE = "https://iyanglin.com";

async function main() {
  // 通过管理员 API 设置菜单
  const menu = {
    button: [
      {
        name: "生活服务",
        sub_button: [
          { type: "view", name: "本地资讯", url: `${SITE}/news` },
          { type: "view", name: "求职招聘", url: `${SITE}/jobs` },
          { type: "view", name: "房产楼市", url: `${SITE}/house` },
          { type: "view", name: "便民电话", url: `${SITE}/bianmin` },
        ],
      },
      {
        name: "逛一逛",
        sub_button: [
          { type: "view", name: "自营商城", url: `${SITE}/haodian` },
          { type: "view", name: "同城相亲", url: `${SITE}/love` },
          { type: "view", name: "同城活动", url: `${SITE}/events` },
          { type: "view", name: "社区论坛", url: `${SITE}/community` },
        ],
      },
      {
        type: "view",
        name: "个人中心",
        url: `${SITE}/api/auth/wechat?redirect=/profile`,
      },
    ],
  };

  console.log("📋 即将设置的菜单：");
  console.log(JSON.stringify(menu, null, 2));
  console.log("\n正在获取 Access Token...");

  const appId = process.env.WECHAT_MP_APP_ID;
  const appSecret = process.env.WECHAT_MP_APP_SECRET;

  if (!appId || !appSecret) {
    console.error("❌ 缺少 WECHAT_MP_APP_ID 或 WECHAT_MP_APP_SECRET 环境变量");
    process.exit(1);
  }

  // 获取 access_token
  const tokenRes = await fetch(
    `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`
  );
  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    console.error("❌ 获取 Access Token 失败:", tokenData);
    process.exit(1);
  }

  console.log("✅ Access Token 获取成功");

  // 创建菜单
  const createRes = await fetch(
    `https://api.weixin.qq.com/cgi-bin/menu/create?access_token=${tokenData.access_token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(menu),
    }
  );
  const createData = await createRes.json();

  if (createData.errcode === 0) {
    console.log("🎉 公众号菜单已成功更新为指向 iyanglin.com！");
    console.log("菜单将在24小时内对所有用户生效，用户也可取消关注后重新关注立即看到新菜单。");
  } else {
    console.error("❌ 创建菜单失败:", createData);
    process.exit(1);
  }
}

main().catch(console.error);
