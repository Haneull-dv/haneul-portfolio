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

## stockprice
build-stockprice:
	docker-compose build stockprice

up-stockprice:
	docker-compose up -d stockprice

down-stockprice:
	docker-compose stop stockprice

logs-stockprice:
	docker-compose logs -f stockprice

restart-stockprice:
	docker-compose down stockprice && docker-compose up -d --build stockprice

# 개발 전용 (빌드 없이 재시작)
dev-stockprice:
	docker-compose stop stockprice
	docker-compose up -d stockprice

## stocktrend
build-stocktrend:
	docker-compose build stocktrend

up-stocktrend:
	docker-compose up -d stocktrend

down-stocktrend:
	docker-compose stop stocktrend

logs-stocktrend:
	docker-compose logs -f stocktrend

restart-stocktrend:
	docker-compose down stocktrend && docker-compose up -d --build stocktrend

## irsummary
build-irsummary:
	docker-compose build irsummary

up-irsummary:
	docker-compose up -d irsummary

down-irsummary:
	docker-compose stop irsummary

logs-irsummary:
	docker-compose logs -f irsummary

restart-irsummary:
	docker-compose down irsummary && docker-compose up -d --build irsummary

## dsdgen
build-dsdgen:
	docker-compose build dsdgen

up-dsdgen:
	docker-compose up -d dsdgen

down-dsdgen:
	docker-compose stop dsdgen

logs-dsdgen:
	docker-compose logs -f dsdgen

restart-dsdgen:
	docker-compose down dsdgen && docker-compose up -d --build dsdgen

## dsdcheck
build-dsdcheck:
	docker-compose build dsdcheck

up-dsdcheck:
	docker-compose up -d dsdcheck

down-dsdcheck:
	docker-compose stop dsdcheck

logs-dsdcheck:
	docker-compose logs -f dsdcheck

restart-dsdcheck:
	docker-compose down dsdcheck && docker-compose up -d --build dsdcheck

## issue
build-issue:
	docker-compose build issue

up-issue:
	docker-compose up -d issue

down-issue:
	docker-compose stop issue

logs-issue:
	docker-compose logs -f issue

restart-issue:
	docker-compose down issue && docker-compose up -d --build issue

# 개발 전용 (빌드 없이 재시작)
dev-issue:
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

# 📰 뉴스 파이프라인 (Issue + AI 모델들)
news-pipeline-up:
	docker-compose up -d newsclassifier summarizer issue

news-pipeline-down:
	docker-compose stop newsclassifier summarizer issue

news-pipeline-logs:
	docker-compose logs -f newsclassifier summarizer issue

news-pipeline-restart:
	docker-compose restart newsclassifier summarizer issue

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
	@echo "  📈 StockPrice: http://localhost:9006/docs"
	@echo "  📊 StockTrend: http://localhost:8081/docs"
	@echo "  📰 Issue (뉴스 파이프라인): http://localhost:8089/docs"
	@echo "  🔍 NewsClassifier: http://localhost:8087/docs"
	@echo "  📝 Summarizer: http://localhost:8088/docs"

