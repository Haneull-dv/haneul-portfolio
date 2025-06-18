#!/bin/bash

# 🧪 SKYC 마이크로서비스 통합 테스트 스크립트

echo "🚀 SKYC 마이크로서비스 상태 확인 시작..."
echo "=========================================="

# 컨테이너 상태 확인
echo "📦 Docker 컨테이너 상태:"
docker-compose ps

echo ""
echo "🌐 서비스 접속 테스트:"

# 서비스별 health check
services=(
    "frontend:3000:/dashboard"
    "gateway:8080:/docs"
    "stockprice:9006:/docs"
    "stock:8081:/docs"
    "summary:8083:/docs"
    "gen:8085:/docs"
    "check:8086:/docs"
    "n8n:5678:/"
)

for service in "${services[@]}"; do
    IFS=':' read -r name port path <<< "$service"
    echo -n "  $name ($port$path): "
    
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port$path" | grep -q "200\|302"; then
        echo "✅ OK"
    else
        echo "❌ FAIL"
    fi
done

echo ""
echo "🔗 주요 API 엔드포인트 테스트:"

# StockPrice API 테스트
echo -n "  StockPrice API (삼성전자): "
if curl -s "http://localhost:9006/api/v1/stockprice/?symbol=005930" > /dev/null; then
    echo "✅ OK"
else
    echo "❌ FAIL"
fi

# N8N API 테스트
echo -n "  N8N Workflow API: "
if curl -s "http://localhost:5678/rest/active" > /dev/null; then
    echo "✅ OK"
else
    echo "❌ FAIL"
fi

echo ""
echo "📊 PostgreSQL 연결 테스트:"
if docker exec -it db psql -U hc_user -d hc_db -c "SELECT 1;" > /dev/null 2>&1; then
    echo "  Database connection: ✅ OK"
else
    echo "  Database connection: ❌ FAIL"
fi

echo ""
echo "🔧 유용한 명령어:"
echo "  전체 시스템 시작: make up"
echo "  로그 확인: make logs"
echo "  개별 서비스 재시작: make restart-stockprice"
echo "  주가 서비스들만: make stock-services-up"
echo "  N8N 워크플로우: make up-n8n"

echo ""
echo "🌐 접속 URLs:"
echo "  📱 메인 대시보드: http://localhost:3000/dashboard"
echo "  🤖 N8N 워크플로우: http://localhost:5678 (admin/password)"
echo "  📈 StockPrice API: http://localhost:9006/docs"
echo "  🚪 API Gateway: http://localhost:8080/docs"

echo ""
echo "=========================================="
echo "✨ 테스트 완료!" 