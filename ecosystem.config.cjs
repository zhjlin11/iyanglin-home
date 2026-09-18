// ==============================================================================
// 杨林生活网 (iyanglin.com) - PM2 守护进程配置
// 启动指令: pm2 start ecosystem.config.cjs
// 重启指令: pm2 reload ecosystem.config.cjs
// 停止指令: pm2 stop ecosystem.config.cjs
// ==============================================================================

module.exports = {
  apps: [
    {
      name: "yanglinol-newsite",
      // Next.js Standalone 生产模式入口
      script: ".next/standalone/server.js",
      cwd: "./",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1024M",
      restart_delay: 3000,
      env: {
        NODE_ENV: "production",
        PORT: 3006,
        HOSTNAME: "0.0.0.0",
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "/home/ubuntu/.pm2/logs/yanglinol-newsite-error.log",
      out_file: "/home/ubuntu/.pm2/logs/yanglinol-newsite-out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
