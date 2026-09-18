$ErrorActionPreference = "Stop"
$KEY = "E:\工作\服务器\服务器密钥（私钥公钥）\id_antigravity"
$REMOTE_HOST = "ubuntu@134.175.230.107"
$REMOTE = "/var/www/iyanglin.com"
$SSH = "ssh -o StrictHostKeyChecking=no -i `"$KEY`" $REMOTE_HOST"

Write-Host "[local] Building Next.js ..." -ForegroundColor Cyan
npm run build

Write-Host "[local] Packing standalone + prisma ..." -ForegroundColor Cyan
tar -czf deploy_full.tar.gz .next/standalone .next/static prisma/schema.prisma public

Write-Host "[local] Uploading ..." -ForegroundColor Cyan
scp -o StrictHostKeyChecking=no -i "$KEY" deploy_full.tar.gz "${REMOTE_HOST}:${REMOTE}/"

Write-Host "[remote] Deploying ..." -ForegroundColor Cyan
& ssh -o StrictHostKeyChecking=no -i "$KEY" $REMOTE_HOST "cd $REMOTE && tar xzf deploy_full.tar.gz && bash scripts/deploy.sh"

Write-Host "[done] Deploy complete." -ForegroundColor Green
