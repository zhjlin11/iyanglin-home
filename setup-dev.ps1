# ==============================================================================
# 杨林生活网 (iyanglin.com) - Windows 11 本地开发环境快速初始化脚本
# 使用方法: powershell -ExecutionPolicy Bypass -File .\setup-dev.ps1
# ==============================================================================

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "💻 杨林生活网 (iyanglin.com) Windows 11 本地开发初始化向导" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# 1. 检查 Node.js
try {
    $nodeVer = node -v
    Write-Host "✅ 检测到 Node.js: $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "❌ 错误: 未安装 Node.js！请访问 https://nodejs.org 安装 Node.js 22.x LTS" -ForegroundColor Red
    exit 1
}

# 2. 检查 .env.local
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️ 未检测到本地配置文件 .env.local" -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Write-Host "--> 正在从 .env.example 生成 .env.local 初始模板..." -ForegroundColor Gray
        Copy-Item ".env.example" ".env.local"
        Write-Host "✅ 已生成 .env.local，请配置本地 PostgreSQL 连接串！" -ForegroundColor Green
    }
} else {
    Write-Host "✅ 本地配置文件 .env.local 已存在" -ForegroundColor Green
}

# 3. 安装依赖
Write-Host "`n--> [1/3] 执行 npm ci 还原锁定依赖..." -ForegroundColor Cyan
npm ci

# 4. 生成 Prisma 客户端
Write-Host "`n--> [2/3] 生成 Prisma ORM 客户端..." -ForegroundColor Cyan
npx prisma generate

# 5. 完成提示
Write-Host "`n======================================================================" -ForegroundColor Green
Write-Host "🎉 本地开发环境初始化就绪！" -ForegroundColor Green
Write-Host "您可以执行以下指令启动本地开发服务:" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor Yellow
Write-Host "随后在浏览器中打开 http://localhost:3000 进行开发调试。" -ForegroundColor White
Write-Host "======================================================================" -ForegroundColor Green
