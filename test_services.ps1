# 🧪 SKYC 마이크로서비스 통합 테스트 스크립트 (PowerShell)

Write-Host "🚀 SKYC 마이크로서비스 상태 확인 시작..." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

# 컨테이너 상태 확인
Write-Host "📦 Docker 컨테이너 상태:" -ForegroundColor Yellow
docker-compose ps

Write-Host ""
Write-Host "🌐 서비스 접속 테스트:" -ForegroundColor Yellow

# 서비스별 health check
$services = @(
    @{name="frontend"; port=3000; path="/dashboard"},
    @{name="gateway"; port=8080; path="/docs"},
    @{name="stockprice"; port=9006; path="/docs"},
    @{name="stock"; port=8081; path="/docs"},
    @{name="summary"; port=8083; path="/docs"},
    @{name="gen"; port=8085; path="/docs"},
    @{name="check"; port=8086; path="/docs"},
    @{name="n8n"; port=5678; path="/"}
)

foreach ($service in $services) {
    $url = "http://localhost:$($service.port)$($service.path)"
    Write-Host "  $($service.name) ($($service.port)$($service.path)): " -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 302) {
            Write-Host "✅ OK" -ForegroundColor Green
        } else {
            Write-Host "❌ FAIL" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ FAIL" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🔗 주요 API 엔드포인트 테스트:" -ForegroundColor Yellow

# StockPrice API 테스트
Write-Host "  StockPrice API (삼성전자): " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:9006/api/v1/stockprice/?symbol=005930" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ OK" -ForegroundColor Green
} catch {
    Write-Host "❌ FAIL" -ForegroundColor Red
}

# N8N API 테스트
Write-Host "  N8N Workflow API: " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5678/rest/active" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ OK" -ForegroundColor Green
} catch {
    Write-Host "❌ FAIL" -ForegroundColor Red
}

Write-Host ""
Write-Host "📊 PostgreSQL 연결 테스트:" -ForegroundColor Yellow
try {
    $dbTest = docker exec db psql -U hc_user -d hc_db -c "SELECT 1;" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Database connection: ✅ OK" -ForegroundColor Green
    } else {
        Write-Host "  Database connection: ❌ FAIL" -ForegroundColor Red
    }
} catch {
    Write-Host "  Database connection: ❌ FAIL" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔧 유용한 명령어:" -ForegroundColor Cyan
Write-Host "  전체 시스템 시작: make up"
Write-Host "  로그 확인: make logs"
Write-Host "  개별 서비스 재시작: make restart-stockprice"
Write-Host "  주가 서비스들만: make stock-services-up"
Write-Host "  N8N 워크플로우: make up-n8n"

Write-Host ""
Write-Host "🌐 접속 URLs:" -ForegroundColor Cyan
Write-Host "  📱 메인 대시보드: http://localhost:3000/dashboard"
Write-Host "  🤖 N8N 워크플로우: http://localhost:5678 (admin/password)"
Write-Host "  📈 StockPrice API: http://localhost:9006/docs"
Write-Host "  🚪 API Gateway: http://localhost:8080/docs"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✨ 테스트 완료!" -ForegroundColor Green 