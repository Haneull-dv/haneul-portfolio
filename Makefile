# 모든 명령어 앞에 'make' 를 붙여서 실행해야 함
# 🔧 공통 명령어
up:
	docker-compose up -d --build

down:
	docker-compose down

logs:
	docker-compose logs -f

restart:
	docker-compose down && docker-compose up -d --build

ps:
	docker-compose ps


# 🚀 마이크로서비스별 명령어

## frontend
build-frontend:
	docker-compose build frontend

up-frontend:
	docker-compose up -d frontend

down-frontend:
	docker-compose stop frontend

logs-frontend:
	docker-compose logs -f frontend

restart-frontend:
	docker-compose down frontend && docker-compose up -d --build frontend

## gateway
build-gateway:
	docker-compose build gateway

up-gateway:
	docker-compose up -d gateway

down-gateway:
	docker-compose stop gateway

logs-gateway:
	docker-compose logs -f gateway

restart-gateway:
	docker-compose down gateway && docker-compose up -d --build gateway

## weekly_stockprice
build-weekly-stockprice:
	docker-compose build stockprice

up-weekly-stockprice:
	docker-compose up -d stockprice

down-weekly-stockprice:
	docker-compose stop stockprice

logs-weekly-stockprice:
	docker-compose logs -f stockprice

restart-weekly-stockprice:
	docker-compose down stockprice && docker-compose up -d --build stockprice

# 개발 전용 (빌드 없이 재시작)
dev-weekly-stockprice:
	docker-compose stop stockprice
	docker-compose up -d stockprice

## conanai_stocktrend
build-conanai-stocktrend:
	docker-compose build stocktrend

up-conanai-stocktrend:
	docker-compose up -d stocktrend

down-conanai-stocktrend:
	docker-compose stop stocktrend

logs-conanai-stocktrend:
	docker-compose logs -f stocktrend

restart-conanai-stocktrend:
	docker-compose down stocktrend && docker-compose up -d --build stocktrend

## conanai_irsummary
build-conanai-irsummary:
	docker-compose build irsummary

up-conanai-irsummary:
	docker-compose up -d irsummary

down-conanai-irsummary:
	docker-compose stop irsummary

logs-conanai-irsummary:
	docker-compose logs -f irsummary

restart-conanai-irsummary:
	docker-compose down irsummary && docker-compose up -d --build irsummary

## conanai_dsdgen
build-conanai-dsdgen:
	docker-compose build dsdgen

up-conanai-dsdgen:
	docker-compose up -d dsdgen

down-conanai-dsdgen:
	docker-compose stop dsdgen

logs-conanai-dsdgen:
	docker-compose logs -f dsdgen

restart-conanai-dsdgen:
	docker-compose down dsdgen && docker-compose up -d --build dsdgen

## conanai_dsdcheck
build-conanai-dsdcheck:
	docker-compose build dsdcheck

up-conanai-dsdcheck:
	docker-compose up -d dsdcheck

down-conanai-dsdcheck:
	docker-compose stop dsdcheck

logs-conanai-dsdcheck:
	docker-compose logs -f dsdcheck

restart-conanai-dsdcheck:
	docker-compose down dsdcheck && docker-compose up -d --build dsdcheck

## weekly_disclosure
build-weekly-disclosure:
	docker-compose build disclosure

up-weekly-disclosure:
	docker-compose up -d disclosure

down-weekly-disclosure:
	docker-compose stop disclosure

logs-weekly-disclosure:
	docker-compose logs -f disclosure

restart-weekly-disclosure:
	docker-compose down disclosure && docker-compose up -d --build disclosure

# 개발 전용 (빌드 없이 재시작)
dev-weekly-disclosure:
	docker-compose stop disclosure
	docker-compose up -d disclosure

## weekly_issue
build-weekly-issue:
	docker-compose build issue

up-weekly-issue:
	docker-compose up -d issue

down-weekly-issue:
	docker-compose stop issue

logs-weekly-issue:
	docker-compose logs -f issue

restart-weekly-issue:
	docker-compose down issue && docker-compose up -d --build issue

# 개발 전용 (빌드 없이 재시작)
dev-weekly-issue:
	docker-compose stop issue
	docker-compose up -d issue

## n8n
up-n8n:
	docker-compose up -d n8n

down-n8n:
	docker-compose stop n8n

logs-n8n:
	docker-compose logs -f n8n

restart-n8n:
	docker-compose down n8n && docker-compose up -d n8n

# 🔗 워크플로우 자동화
workflow-up:
	docker-compose up -d n8n stockprice stocktrend

workflow-down:
	docker-compose stop n8n stockprice stocktrend

# 📊 주가 관련 서비스들
stock-services-up:
	docker-compose up -d stockprice stocktrend

stock-services-down:
	docker-compose stop stockprice stocktrend

stock-services-logs:
	docker-compose logs -f stockprice stocktrend

# 🤖 AI 모델 서비스들
ai-services-up:
	docker-compose up -d newsclassifier summarizer

ai-services-down:
	docker-compose stop newsclassifier summarizer

ai-services-logs:
	docker-compose logs -f newsclassifier summarizer

# 📰 뉴스 파이프라인 (Weekly Issue + AI 모델들)
news-pipeline-up:
	docker-compose up -d newsclassifier summarizer issue

news-pipeline-down:
	docker-compose stop newsclassifier summarizer issue

news-pipeline-logs:
	docker-compose logs -f newsclassifier summarizer issue

news-pipeline-restart:
	docker-compose restart newsclassifier summarizer issue

# 📊 Weekly 서비스들 (disclosure, issue, stockprice)
weekly-services-up:
	docker-compose up -d disclosure issue stockprice

weekly-services-down:
	docker-compose stop disclosure issue stockprice

weekly-services-logs:
	docker-compose logs -f disclosure issue stockprice

weekly-services-restart:
	docker-compose restart disclosure issue stockprice

weekly-services-build:
	docker-compose build disclosure issue stockprice

# 📊 Weekly 전체 시스템 (데이터 수집 + 조회)
weekly-system-up:
	docker-compose up -d weekly_data disclosure issue stockprice

weekly-system-down:
	docker-compose stop weekly_data disclosure issue stockprice

weekly-system-logs:
	docker-compose logs -f weekly_data disclosure issue stockprice

weekly-system-restart:
	docker-compose restart weekly_data disclosure issue stockprice

# 🤖 n8n 자동화 테스트 명령어
test-n8n-disclosure:
	curl -X POST "http://localhost:8090/n8n/collect-disclosure" -H "Content-Type: application/json"

test-n8n-issue:
	curl -X POST "http://localhost:8089/n8n/collect-issues" -H "Content-Type: application/json"

test-n8n-stockprice:
	curl -X POST "http://localhost:9006/n8n/collect-stockprice" -H "Content-Type: application/json"

test-weekly-table:
	curl "http://localhost:8091/weekly/table-data"

# 🗄️ 데이터베이스 관련 명령어
## weekly_db 서비스 (DB 초기화용)
build-weekly-db:
	docker-compose build weekly_db

up-weekly-db:
	docker-compose up -d weekly_db

down-weekly-db:
	docker-compose stop weekly_db

logs-weekly-db:
	docker-compose logs -f weekly_db

restart-weekly-db:
	docker-compose down weekly_db && docker-compose up -d --build weekly_db

## weekly_data 서비스 (통합 API)
build-weekly-data:
	docker-compose build weekly_data

up-weekly-data:
	docker-compose up -d weekly_data

down-weekly-data:
	docker-compose stop weekly_data

logs-weekly-data:
	docker-compose logs -f weekly_data

restart-weekly-data:
	docker-compose down weekly_data && docker-compose up -d --build weekly_data

# DB 초기화 (테이블 생성)
init-db:
	docker-compose exec weekly_db python weekly_db/init_db.py

# DB 초기화 (dry-run - 모델 검증만)
init-db-dry:
	docker-compose exec weekly_db python weekly_db/init_db.py --dry-run

# 🧹 정리 명령어
clean:
	docker system prune -f

clean-all:
	docker system prune -a -f

# 🧪 테스트 명령어
test:
	powershell -ExecutionPolicy Bypass -File test_services.ps1

test-bash:
	bash test_services.sh

health-check:
	docker-compose ps
	@echo "🌐 서비스 접속 URLs:"
	@echo "  📱 대시보드: http://localhost:3000/dashboard"
	@echo "  🌐 게이트웨이: http://localhost:8080"
	@echo "  🤖 N8N: http://localhost:5678 (admin/password)"
	@echo "  📄 Weekly Disclosure: http://localhost:8090/docs"
	@echo "  📰 Weekly Issue (뉴스 파이프라인): http://localhost:8089/docs"
	@echo "  📈 Weekly StockPrice: http://localhost:9006/docs"
	@echo "  📊 Conanai StockTrend: http://localhost:8081/docs"
	@echo "  🔍 NewsClassifier: http://localhost:8087/docs"
	@echo "  📝 Summarizer: http://localhost:8088/docs"

