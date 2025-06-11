# Portfolio Frontend

김하늘의 개인 포트폴리오 웹사이트 프론트엔드입니다.

## 🏗️ 프로젝트 구조

```
frontend/src/
├── app/                    # Next.js App Router 페이지
│   ├── dashboard/         # 대시보드 페이지
│   ├── about/            # About Me 페이지
│   ├── skills/           # Skills 페이지
│   ├── projects/         # Projects 페이지
│   ├── contact/          # Contact 페이지
│   ├── layout.tsx        # 루트 레이아웃
│   └── page.tsx          # 홈페이지 (인트로)
├── shared/               # 공통 컴포넌트 및 유틸리티
│   ├── components/       # 재사용 가능한 UI 컴포넌트
│   │   ├── Layout/       # 공통 레이아웃 컴포넌트
│   │   ├── Card/         # 카드 컴포넌트
│   │   ├── CardContainer/ # 카드 컨테이너
│   │   ├── PageHeader/   # 페이지 헤더
│   │   ├── Sidebar/      # 사이드바
│   │   └── Header/       # 상단 네비게이션
│   ├── hooks/            # 커스텀 훅
│   ├── lib/              # 유틸리티 함수
│   └── styles/           # 공통 스타일
├── features/             # 기능별 컴포넌트
└── styles/               # 전역 스타일
```

## 🎨 디자인 시스템

### 공통 컴포넌트

#### Layout
- **Layout**: 사이드바와 헤더를 포함한 공통 레이아웃
- **PageHeader**: 페이지 제목, 브레드크럼, 액션 버튼을 포함한 헤더
- **Sidebar**: 네비게이션 사이드바
- **Header**: 상단 네비게이션 바

#### Card System
- **Card**: 재사용 가능한 카드 컴포넌트
  - 제목, 헤더 액션, 컨텐츠 영역 지원
  - 호버 효과 및 다크모드 지원
- **CardContainer**: 카드들을 배치하는 그리드 컨테이너
  - 1-4 컬럼 지원
  - 반응형 디자인
  - 다양한 간격 옵션 (small, medium, large)

### 페이지 구성

#### Dashboard (`/dashboard`)
- 통계 카드 (New Order, Visitors, Total Sales)
- Recent Orders 테이블
- Todos 리스트

#### About Me (`/about`)
- About 카드: 자기소개
- Profile 카드: 개인정보 및 프로필 이미지

#### Skills (`/skills`)
- Frontend Development 스킬 바
- Backend Development 스킬 바
- Tools & Technologies 태그

#### Projects (`/projects`)
- 프로젝트 카드들
- 각 프로젝트별 이미지, 설명, 기술스택, 링크

#### Contact (`/contact`)
- 연락처 폼
- 연락처 정보
- 소셜 미디어 링크

## 🚀 주요 기능

### 반응형 디자인
- 모바일, 태블릿, 데스크톱 지원
- 카드 그리드 자동 조정
- 사이드바 반응형 동작

### 다크모드 지원
- CSS 변수를 활용한 테마 시스템
- 모든 컴포넌트에서 다크모드 지원

### 네비게이션
- 사이드바를 통한 페이지 간 이동
- 현재 페이지 하이라이트
- 브레드크럼 네비게이션

### 재사용성
- 모든 UI 컴포넌트 재사용 가능
- 일관된 디자인 시스템
- TypeScript 타입 지원

## 🛠️ 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: SCSS Modules
- **Icons**: Boxicons
- **Fonts**: Google Fonts (Nunito, Poppins, Lato)

## 📱 사용법

### 개발 서버 실행
```bash
npm run dev
```

### 빌드
```bash
npm run build
```

### 새로운 페이지 추가
1. `app/` 폴더에 새 디렉토리 생성
2. `page.tsx` 파일 생성
3. `Layout` 컴포넌트로 감싸기
4. `PageHeader`와 `CardContainer` 사용하여 일관된 디자인 유지

### 새로운 카드 컴포넌트 추가
```tsx
<Card 
  title="카드 제목"
  headerActions={
    <>
      <i className='bx bx-icon'></i>
      <i className='bx bx-dots-vertical-rounded'></i>
    </>
  }
>
  <div>카드 내용</div>
</Card>
```

## 🎯 향후 개선사항

- [ ] 애니메이션 효과 추가
- [ ] 검색 기능 구현
- [ ] 다국어 지원
- [ ] PWA 지원
- [ ] 성능 최적화
