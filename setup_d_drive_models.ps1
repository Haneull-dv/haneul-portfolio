# D드라이브에 모델 디렉토리 설정 스크립트

Write-Host "=== SLM 모델 서비스 D드라이브 설정 ===" -ForegroundColor Green

# D드라이브 디렉토리 생성
$modelBasePath = "D:\portfolio-models"
$newsClassifierPath = "$modelBasePath\slm-newsclassifier-inference"
$summarizerPath = "$modelBasePath\slm-summarizer-inference"
$newsClassifierModelsPath = "$modelBasePath\newsclassifier-models"
$summarizerModelsPath = "$modelBasePath\summarizer-models"

Write-Host "1. D드라이브에 디렉토리 생성 중..." -ForegroundColor Yellow

# 기본 모델 디렉토리 생성
New-Item -ItemType Directory -Path $modelBasePath -Force
New-Item -ItemType Directory -Path $newsClassifierPath -Force
New-Item -ItemType Directory -Path $summarizerPath -Force
New-Item -ItemType Directory -Path $newsClassifierModelsPath -Force
New-Item -ItemType Directory -Path $summarizerModelsPath -Force

Write-Host "2. 소스 코드 복사 중..." -ForegroundColor Yellow

# 뉴스 분류기 코드 복사
if (Test-Path "slm-newsclassifier-inference") {
    Copy-Item -Path "slm-newsclassifier-inference\*" -Destination $newsClassifierPath -Recurse -Force
    Write-Host "   ✓ 뉴스 분류기 코드 복사 완료" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ slm-newsclassifier-inference 디렉토리를 찾을 수 없습니다" -ForegroundColor Red
}

# 요약기 코드 복사
if (Test-Path "slm-summarizer-inference") {
    Copy-Item -Path "slm-summarizer-inference\*" -Destination $summarizerPath -Recurse -Force
    Write-Host "   ✓ 요약기 코드 복사 완료" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ slm-summarizer-inference 디렉토리를 찾을 수 없습니다" -ForegroundColor Red
}

Write-Host "3. 특수 디렉토리 생성 중..." -ForegroundColor Yellow

# offload 디렉토리 특별 처리
$offloadPath = "$summarizerPath\offload"
New-Item -ItemType Directory -Path $offloadPath -Force
New-Item -ItemType File -Path "$offloadPath\.gitkeep" -Force

Write-Host "4. 권한 설정 중..." -ForegroundColor Yellow

# 디렉토리 권한 확인 및 설정
try {
    $acl = Get-Acl $modelBasePath
    Write-Host "   ✓ D드라이브 접근 권한 확인 완료" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️ D드라이브 접근 권한에 문제가 있을 수 있습니다" -ForegroundColor Yellow
}

Write-Host "5. 설정 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "생성된 디렉토리:" -ForegroundColor Cyan
Write-Host "  - $newsClassifierPath" -ForegroundColor White
Write-Host "  - $summarizerPath" -ForegroundColor White
Write-Host "  - $newsClassifierModelsPath" -ForegroundColor White
Write-Host "  - $summarizerModelsPath" -ForegroundColor White
Write-Host ""
Write-Host "이제 'docker-compose up -d newsclassifier summarizer' 명령으로 컨테이너를 시작할 수 있습니다." -ForegroundColor Green

# 현재 디스크 사용량 체크
Write-Host ""
Write-Host "=== 디스크 사용량 정보 ===" -ForegroundColor Blue
Get-WmiObject -Class Win32_LogicalDisk | Where-Object {$_.DriveType -eq 3} | ForEach-Object {
    $freeGB = [math]::Round($_.FreeSpace / 1GB, 2)
    $totalGB = [math]::Round($_.Size / 1GB, 2)
    $usedGB = $totalGB - $freeGB
    $usedPercent = [math]::Round(($usedGB / $totalGB) * 100, 1)
    Write-Host "$($_.DeviceID) 드라이브: $usedGB GB / $totalGB GB 사용 ($usedPercent%)" -ForegroundColor White
} 