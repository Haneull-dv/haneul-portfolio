#!/usr/bin/env pwsh

Write-Host "=== 모든 Docker 서비스 빌드 및 실행 시작 ===" -ForegroundColor Green

# 서비스 목록
$services = @(
    "postgres",
    "gateway", 
    "frontend",
    "n8n",
    "stockprice",
    "stocktrend", 
    "irsummary",
    "dsdgen",
    "dsdcheck",
    "newsclassifier",
    "summarizer",
    "issue"
)

Write-Host "총 $($services.Count)개 서비스를 처리합니다." -ForegroundColor Yellow

# 각 서비스별로 빌드 및 실행
foreach ($service in $services) {
    Write-Host "`n--- $service 서비스 처리 중 ---" -ForegroundColor Cyan
    
    try {
        # 빌드
        Write-Host "빌드 중: $service" -ForegroundColor Blue
        docker-compose build $service
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "빌드 성공: $service" -ForegroundColor Green
            
            # 실행
            Write-Host "실행 중: $service" -ForegroundColor Blue
            docker-compose up -d $service
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "실행 성공: $service" -ForegroundColor Green
            } else {
                Write-Host "실행 실패: $service" -ForegroundColor Red
            }
        } else {
            Write-Host "빌드 실패: $service" -ForegroundColor Red
        }
    } catch {
        Write-Host "오류 발생 ($service): $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds 2
}

Write-Host "`n=== 최종 상태 확인 ===" -ForegroundColor Green
docker-compose ps

Write-Host "`n=== 모든 서비스 처리 완료 ===" -ForegroundColor Green
Write-Host "실행 중인 서비스들:" -ForegroundColor Yellow
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 