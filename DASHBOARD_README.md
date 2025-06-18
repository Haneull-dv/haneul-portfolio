# Haneul Dashboard - Next.js 15 변환 완료

## 🎉 변환 완료된 내용

기존 HTML/CSS/JavaScript 대시보드를 **Next.js 15, React 19, TypeScript**로 성공적으로 변환했습니다!

## 🏗️ 마이크로서비스 아키텍처

### 현재 운영 중인 서비스들

| 서비스 | 포트 | 컨테이너명 | 설명 |
|--------|------|------------|------|
| **Frontend** | 3000 | frontend | Next.js 15 대시보드 |
| **Gateway** | 8080 | gateway | API 게이트웨이 |
| **StockPrice** | 9006 | stockprice | 주가 정보 조회 서비스 |
| **StockTrend** | 8081 | stock | 주가 트렌드 분석 |
| **IRSummary** | 8083 | summary | IR 보고서 요약 |
| **DSDGen** | 8085 | gen | 재무제표 생성 |
| **DSDCheck** | 8086 | check | 재무제표 검증 |
| **N8N** | 5678 | n8n | 워크플로우 자동화 |
| **PostgreSQL** | 5433 | db | 데이터베이스 |

### 🔗 서비스 연동 구조
```
Frontend (Next.js) 
    ↓
Gateway (API 게이트웨이)
    ↓
┌─────────────────────────────────────┐
│  비즈니스 서비스들                    │
├─ StockPrice (주가 조회)              │
├─ StockTrend (주가 트렌드)            │
├─ IRSummary (IR 요약)               │
├─ DSDGen (재무제표 생성)              │
└─ DSDCheck (재무제표 검증)            │
└─────────────────────────────────────┘
    ↓
PostgreSQL (데이터베이스)

N8N (워크플로우 자동화) ← → 모든 서비스들
```

## 📁 프로젝트 구조

```
frontend/src/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx              # 메인 대시보드 페이지
│   │   ├── digest/               # 다이제스트 페이지
│   │   ├── dsd/                  # 재무제표 페이지
│   │   ├── trends/               # 트렌드 분석 페이지
│   │   ├── validation/           # 검증 페이지
│   │   └── dashboard.module.scss # 대시보드 레이아웃 스타일
│   └── layout.tsx                # 루트 레이아웃 (BoxIcons 포함)
├── features/
│   └── dashboard/
│       ├── DashboardContent.tsx       # 대시보드 메인 컨텐츠
│       └── DashboardContent.module.scss
├── shared/
│   ├── components/
│   │   ├── Sidebar/
│   │   │   ├── Sidebar.tsx
│   │   │   └── Sidebar.module.scss
│   │   ├── Header/
│   │   │   ├── Header.tsx
│   │   │   └── Header.module.scss
│   │   ├── NotificationMenu/
│   │   │   ├── NotificationMenu.tsx
│   │   │   └── NotificationMenu.module.scss
│   │   └── ProfileMenu/
│   │       ├── ProfileMenu.tsx
│   │       └── ProfileMenu.module.scss
│   ├── hooks/
│   │   ├── useSidebar.ts         # 사이드바 토글 훅
│   │   ├── useDarkMode.ts        # 다크모드 훅
│   │   ├── useMenuToggle.ts      # 메뉴 토글 훅
│   │   ├── useSearchToggle.ts    # 검색 토글 훅
│   │   └── useActiveMenu.ts      # 활성 메뉴 훅
│   └── styles/
│       └── globals.scss          # 전역 스타일 & CSS 변수
```

## 🚀 주요 기능

### 1. **컴포넌트 분리**
- ✅ **Sidebar.tsx** - 사이드바 메뉴
- ✅ **Header.tsx** - 상단 네비게이션
- ✅ **NotificationMenu.tsx** - 알림 메뉴
- ✅ **ProfileMenu.tsx** - 프로필 메뉴
- ✅ **DashboardContent.tsx** - 대시보드 메인 컨텐츠

### 2. **커스텀 훅으로 기능 분리**
- ✅ **useSidebar()** - 사이드바 토글 & 반응형 처리
- ✅ **useDarkMode()** - 다크모드 토글 & 로컬스토리지 저장
- ✅ **useMenuToggle()** - 알림/프로필 메뉴 토글
- ✅ **useSearchToggle()** - 모바일 검색 폼 토글
- ✅ **useActiveMenu()** - 사이드바 활성 메뉴 관리

### 3. **SCSS 모듈 시스템**
- ✅ 각 컴포넌트별 독립적인 SCSS 모듈
- ✅ CSS 변수를 통한 테마 시스템
- ✅ 다크모드 지원
- ✅ 반응형 디자인

### 4. **TypeScript 타입 안전성**
- ✅ 모든 컴포넌트와 훅에 타입 정의
- ✅ Props 인터페이스 정의
- ✅ 이벤트 핸들러 타입 정의

## 🎨 스타일 시스템

### CSS 변수 (globals.scss)
```scss
:root {
  --poppins: 'Poppins', sans-serif;
  --lato: 'Lato', sans-serif;
  --light: #F9F9F9;
  --blue: #3C91E6;
  --light-blue: #CFE8FF;
  --grey: #eee;
  --dark-grey: #AAAAAA;
  --dark: #342E37;
  --red: #DB504A;
  --yellow: #FFCE26;
  --light-yellow: #FFF2C6;
  --orange: #FD7238;
  --light-orange: #FFE0D3;
}
```

### 다크모드
```scss
body.dark {
  --light: #0C0C1E;
  --grey: #060714;
  --dark: #FBFBFB;
}
```

## 🔧 사용법

### 🐳 Docker로 전체 시스템 실행
```bash
# 모든 서비스 시작
make up

# 특정 서비스만 시작
make up-frontend
make up-stockprice
make up-n8n

# 로그 확인
make logs
make logs-stockprice
make logs-n8n
```

### 개발 서버 실행
```bash
cd frontend
npm run dev
```

### 빌드
```bash
npm run build
```

## 🌐 서비스 접근 URLs

| 서비스 | URL | 설명 |
|--------|-----|------|
| **메인 대시보드** | http://localhost:3000/dashboard | Next.js 대시보드 |
| **API 게이트웨이** | http://localhost:8080 | 통합 API 엔드포인트 |
| **주가 서비스** | http://localhost:9006/api/v1/stockprice | 주가 정보 API |
| **N8N 워크플로우** | http://localhost:5678 | 자동화 워크플로우 (admin/password) |
| **PostgreSQL** | localhost:5433 | 데이터베이스 (hc_user/hc_password) |

## 🔗 N8N 워크플로우 자동화

### N8N 접속 정보
- **URL**: http://localhost:5678
- **Username**: admin  
- **Password**: password

### 추천 워크플로우 예시

#### 1. 주가 데이터 자동 수집
```
Cron Node (매일 9시) 
    → HTTP Request (StockPrice API 호출)
    → Database Insert (PostgreSQL 저장)
    → Slack/Discord 알림
```

#### 2. 재무제표 분석 자동화
```
File Trigger (엑셀 업로드)
    → DSDCheck API (검증)
    → DSDGen API (생성)
    → 이메일 발송
```

#### 3. 시장 동향 모니터링
```
HTTP Request (StockTrend API)
    → 조건부 필터링
    → 알림 발송 (급등/급락 시)
    → 대시보드 업데이트
```

## 🎯 변환된 기능들

### 1. JavaScript → TypeScript 커스텀 훅
| 원본 기능 | 변환된 훅 | 설명 |
|----------|----------|------|
| 사이드바 토글 | `useSidebar()` | 사이드바 숨김/표시, 반응형 처리 |
| 다크모드 | `useDarkMode()` | 다크모드 토글, localStorage 저장 |
| 메뉴 토글 | `useMenuToggle()` | 알림/프로필 메뉴 관리 |
| 검색 토글 | `useSearchToggle()` | 모바일 검색 폼 토글 |
| 활성 메뉴 | `useActiveMenu()` | 사이드바 메뉴 활성화 상태 |

### 2. HTML → React 컴포넌트
| 원본 섹션 | 컴포넌트 | 특징 |
|----------|----------|------|
| `#sidebar` | `<Sidebar />` | 메뉴 아이템 배열, 활성화 상태 관리 |
| `nav` | `<Header />` | 검색, 다크모드, 알림, 프로필 통합 |
| 알림 메뉴 | `<NotificationMenu />` | 독립적인 상태 관리 |
| 프로필 메뉴 | `<ProfileMenu />` | Props를 통한 사용자 정보 전달 |
| `main` | `<DashboardContent />` | 통계, 테이블, TODO 리스트 |

### 3. CSS → SCSS 모듈
- ✅ 전역 스타일과 컴포넌트 스타일 분리
- ✅ CSS 변수를 통한 테마 시스템
- ✅ 중첩 선택자와 & 연산자 활용
- ✅ 반응형 미디어 쿼리

## 📱 반응형 지원

### 브레이크포인트
- **Desktop**: > 768px - 전체 사이드바 표시
- **Tablet**: 576px ~ 768px - 사이드바 축소
- **Mobile**: < 576px - 사이드바 숨김

### 반응형 기능
- ✅ 자동 사이드바 크기 조정
- ✅ 모바일 검색 폼 토글
- ✅ 터치 친화적인 메뉴
- ✅ 적응형 레이아웃

## 🎉 완성!

기존 HTML/CSS/JavaScript 대시보드가 **현대적인 Next.js 15 + React 19 + TypeScript** 프로젝트로 완전히 변환되었습니다!

### 주요 개선사항:
- 🔥 **TypeScript** 타입 안전성
- ⚡ **Next.js 15** 최신 기능
- 🎯 **컴포넌트 기반** 아키텍처
- 🪝 **커스텀 훅** 로직 분리
- 🎨 **SCSS 모듈** 스타일 캡슐화
- 📱 **완전한 반응형** 디자인
- 🌙 **다크모드** 지원
- 🐳 **Docker 컨테이너화** 
- 🔗 **마이크로서비스** 아키텍처
- 🤖 **N8N 워크플로우** 자동화 