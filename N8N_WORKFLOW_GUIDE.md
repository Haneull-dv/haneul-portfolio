# 🤖 N8N 워크플로우 자동화 가이드

N8N을 활용한 주가 및 재무제표 데이터 자동화 워크플로우 구축 가이드입니다.

## 🚀 시작하기

### N8N 접속
- **URL**: http://localhost:5678
- **Username**: admin
- **Password**: password

### 기본 설정
```bash
# N8N 시작
make up-n8n

# 로그 확인
make logs-n8n

# N8N 컨테이너 접속
docker exec -it n8n sh
```

## 📊 주요 워크플로우 템플릿

### 1. 📈 주가 데이터 자동 수집 워크플로우

#### 구성 요소
1. **Cron Node** - 스케줄링 (매일 오전 9시)
2. **HTTP Request Node** - StockPrice API 호출
3. **Code Node** - 데이터 변환 및 검증
4. **PostgreSQL Node** - 데이터베이스 저장
5. **Slack/Discord Node** - 알림 발송

#### 설정 방법
```json
{
  "nodes": [
    {
      "name": "Daily Stock Data Collection",
      "type": "n8n-nodes-base.cron",
      "parameters": {
        "rule": {
          "interval": [{
            "field": "cronExpression",
            "expression": "0 9 * * 1-5"
          }]
        }
      }
    },
    {
      "name": "Get Stock Price",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "http://stockprice:9006/api/v1/stockprice/",
        "qs": {
          "symbol": "005930"
        }
      }
    },
    {
      "name": "Save to Database",
      "type": "n8n-nodes-base.postgres",
      "parameters": {
        "operation": "insert",
        "schema": "public",
        "table": "stock_prices",
        "columns": "symbol,price,timestamp"
      }
    }
  ]
}
```

#### 수집 대상 주식 목록
- **005930**: 삼성전자
- **000660**: SK하이닉스  
- **035420**: NAVER
- **051910**: LG화학
- **068270**: 셀트리온

### 2. 📋 재무제표 분석 자동화 워크플로우

#### 구성 요소
1. **File Trigger Node** - 엑셀 파일 업로드 감지
2. **DSDCheck API** - 재무제표 검증
3. **DSDGen API** - 재무제표 생성
4. **Email Node** - 결과 이메일 발송
5. **File Management Node** - 결과 파일 저장

#### 설정 방법
```json
{
  "nodes": [
    {
      "name": "File Upload Trigger",
      "type": "n8n-nodes-base.localFileTrigger",
      "parameters": {
        "path": "/app/uploads",
        "fileExtensions": "xlsx,xls"
      }
    },
    {
      "name": "Validate Financial Data",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "http://check:8086/api/v1/dsdcheck/validate",
        "method": "POST"
      }
    },
    {
      "name": "Generate Report",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "http://gen:8085/api/v1/dsdgen/generate",
        "method": "POST"
      }
    }
  ]
}
```

### 3. 🔔 시장 동향 모니터링 워크플로우

#### 구성 요소
1. **Interval Node** - 10분마다 실행
2. **StockTrend API** - 트렌드 데이터 조회
3. **Condition Node** - 급등/급락 조건 확인
4. **Multiple Notification Nodes** - 다중 알림 채널

#### 알림 조건
- **급등**: 5% 이상 상승
- **급락**: 5% 이상 하락
- **거래량 급증**: 평균 대비 3배 이상

#### 설정 예시
```json
{
  "nodes": [
    {
      "name": "Check Every 10 Minutes",
      "type": "n8n-nodes-base.interval",
      "parameters": {
        "interval": 600000
      }
    },
    {
      "name": "Get Stock Trends",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "http://stock:8081/api/v1/stocktrend/trends",
        "qs": {
          "period": "1d"
        }
      }
    },
    {
      "name": "Check Alert Conditions",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "number": [
            {
              "value1": "={{ $json.change_rate }}",
              "operation": "larger",
              "value2": 5
            }
          ]
        }
      }
    }
  ]
}
```

## 📧 알림 채널 설정

### Slack 알림
```json
{
  "name": "Slack Alert",
  "type": "n8n-nodes-base.slack",
  "parameters": {
    "channel": "#stock-alerts",
    "text": "🚨 {{ $json.symbol }} 급등 감지: {{ $json.change_rate }}% 상승"
  }
}
```

### Discord 웹훅
```json
{
  "name": "Discord Alert",
  "type": "n8n-nodes-base.discord",
  "parameters": {
    "webhook": "https://discord.com/api/webhooks/...",
    "content": "📈 주가 알림: {{ $json.symbol }} - {{ $json.change_rate }}%"
  }
}
```

### 이메일 알림
```json
{
  "name": "Email Alert", 
  "type": "n8n-nodes-base.emailSend",
  "parameters": {
    "to": "admin@company.com",
    "subject": "주가 알림: {{ $json.symbol }}",
    "html": "<h2>{{ $json.symbol }} 주가 변동 알림</h2><p>변동률: {{ $json.change_rate }}%</p>"
  }
}
```

## 🔄 고급 워크플로우 패턴

### 1. 에러 핸들링
```json
{
  "name": "Error Handler",
  "type": "n8n-nodes-base.function",
  "parameters": {
    "functionCode": "if ($json.error) { return [{ json: { status: 'failed', message: $json.error } }]; }"
  }
}
```

### 2. 데이터 변환
```json
{
  "name": "Data Transformer",
  "type": "n8n-nodes-base.function",
  "parameters": {
    "functionCode": "return [{ json: { symbol: $json.symbol.toUpperCase(), price: parseFloat($json.price) } }];"
  }
}
```

### 3. 조건부 실행
```json
{
  "name": "Market Hours Check",
  "type": "n8n-nodes-base.if",
  "parameters": {
    "conditions": {
      "dateTime": [
        {
          "value1": "{{ $now }}",
          "operation": "between",
          "value2": "09:00",
          "value3": "15:30"
        }
      ]
    }
  }
}
```

## 📚 유용한 스크립트

### 주가 데이터 정규화
```javascript
// Function Node 내부 코드
const stockData = $input.all();
const normalizedData = stockData.map(item => ({
  symbol: item.json.symbol,
  price: parseFloat(item.json.current_price),
  change: parseFloat(item.json.change),
  volume: parseInt(item.json.volume),
  timestamp: new Date().toISOString()
}));

return normalizedData.map(data => ({ json: data }));
```

### 거래량 기반 필터링
```javascript
// 평균 거래량 대비 3배 이상인 종목만 필터링
const avgVolume = $json.avg_volume;
const currentVolume = $json.volume;

if (currentVolume > avgVolume * 3) {
  return [{ json: $json }];
}

return [];
```

## 🔧 워크플로우 관리

### 백업 및 복원
```bash
# 워크플로우 백업
docker cp n8n:/home/node/.n8n/workflows ./n8n_backup/workflows

# 복원
docker cp ./n8n_backup/workflows n8n:/home/node/.n8n/
```

### 스케줄링 최적화
- **주가 수집**: 장 시간 중 10분마다
- **재무제표 분석**: 업무시간 중 파일 업로드 시
- **시장 동향**: 실시간 (1분마다)
- **일간 리포트**: 매일 오후 6시

### 모니터링
```bash
# N8N 실행 상태 확인
curl http://localhost:5678/rest/active

# 워크플로우 상태 확인  
curl http://localhost:5678/rest/executions

# 에러 로그 확인
make logs-n8n
```

## 🚨 트러블슈팅

### 자주 발생하는 문제들

1. **API 연결 실패**
   - 서비스 컨테이너 상태 확인: `docker-compose ps`
   - 네트워크 연결 확인: `docker network ls`

2. **데이터베이스 연결 오류**
   - PostgreSQL 컨테이너 확인: `make logs-postgres`
   - 연결 정보 재확인: `DATABASE_URL` 환경변수

3. **워크플로우 실행 실패**
   - N8N 로그 확인: `make logs-n8n`
   - 개별 노드 에러 메시지 확인

### 성능 최적화
- **배치 처리**: 여러 종목을 한번에 처리
- **캐싱**: 중복 API 호출 방지
- **비동기 처리**: 병렬 실행 활용

## 📖 추가 자료

- [N8N 공식 문서](https://docs.n8n.io/)
- [워크플로우 템플릿](https://n8n.io/workflows/)
- [API 연동 가이드](https://docs.n8n.io/integrations/) 