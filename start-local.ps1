$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDirectory = Join-Path $projectRoot 'backend'
$frontendDirectory = Join-Path $projectRoot 'frontend'

function Test-LocalPort([int]$Port) {
  return $null -ne (Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue)
}

function Wait-LocalPort([int]$Port, [string]$Name, [int]$TimeoutSeconds = 60) {
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-LocalPort $Port) { return }
    Start-Sleep -Milliseconds 500
  }
  throw "Service $Name did not become ready on port $Port."
}

$backendEnv = Join-Path $backendDirectory '.env'
if (-not (Test-Path $backendEnv)) {
  @'
NODE_ENV=development
PORT=3002
DATABASE_URL=postgresql://gym_app:gym_local_app@localhost:5432/gym_saas?schema=public
DATABASE_ADMIN_URL=postgresql://gym_admin:gym_local_admin@localhost:5432/gym_saas?schema=public
JWT_ACCESS_SECRET=local_access_secret_change_before_production_123456
JWT_REFRESH_SECRET=local_refresh_secret_change_before_production_123456
JWT_ACCESS_TTL_SECONDS=900
CORS_ORIGIN=http://localhost:3001
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=
S3_ENDPOINT=
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_REGION=default
SMS_PROVIDER_API_KEY=
SMTP_HOST=
'@ | Set-Content -LiteralPath $backendEnv -Encoding utf8
}

$frontendEnv = Join-Path $frontendDirectory '.env.local'
if (-not (Test-Path $frontendEnv)) {
  @'
DEMO_MODE=false
NEXT_PUBLIC_DEMO_MODE=false
API_BASE_URL=http://localhost:3002/api/v1
NEXT_PUBLIC_API_BASE_URL=http://localhost:3002/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:3002
NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=true
'@ | Set-Content -LiteralPath $frontendEnv -Encoding utf8
}

if (-not (Test-Path (Join-Path $backendDirectory 'node_modules'))) {
  Push-Location $backendDirectory
  npm.cmd install
  Pop-Location
}
if (-not (Test-Path (Join-Path $frontendDirectory 'node_modules'))) {
  Push-Location $frontendDirectory
  npm.cmd install
  Pop-Location
}

$backendAlreadyRunning = Test-LocalPort 3002

if (-not (Test-LocalPort 5432)) {
  Start-Process -FilePath 'npm.cmd' -ArgumentList @('run', 'local:postgres') -WorkingDirectory $backendDirectory -WindowStyle Hidden
}
Wait-LocalPort 5432 'PostgreSQL' 90

if (-not (Test-LocalPort 6379)) {
  Start-Process -FilePath 'npm.cmd' -ArgumentList @('run', 'local:redis') -WorkingDirectory $backendDirectory -WindowStyle Hidden
}
Wait-LocalPort 6379 'Redis' 60

if (-not $backendAlreadyRunning) {
  Push-Location $backendDirectory
  npx.cmd prisma generate
  if ($LASTEXITCODE -ne 0) { throw 'Prisma client generation failed.' }
  npx.cmd prisma migrate deploy
  if ($LASTEXITCODE -ne 0) { throw 'Database migration failed.' }
  npm.cmd run local:rls
  if ($LASTEXITCODE -ne 0) { throw 'RLS policy setup failed.' }
  npm.cmd run local:seed
  if ($LASTEXITCODE -ne 0) { throw 'Local demo data setup failed.' }
  Pop-Location
}

if (-not (Test-LocalPort 3002)) {
  Start-Process -FilePath 'npm.cmd' -ArgumentList @('run', 'start:dev') -WorkingDirectory $backendDirectory -WindowStyle Hidden
}
if (-not (Test-LocalPort 3001)) {
  Start-Process -FilePath 'npm.cmd' -ArgumentList @('run', 'dev') -WorkingDirectory $frontendDirectory -WindowStyle Hidden
}

Wait-LocalPort 3002 'API' 90
Wait-LocalPort 3001 'Frontend' 90

Write-Host ''
Write-Host 'Local project is ready:' -ForegroundColor Green
Write-Host '  Website: http://localhost:3001'
Write-Host '  API docs: http://localhost:3002/api/docs'
Write-Host '  Demo account password: demo1234'
Write-Host ''
Start-Process 'http://localhost:3001'
