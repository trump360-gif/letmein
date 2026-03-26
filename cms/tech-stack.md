# Tech Stack — CMS Admin
> Next.js 기반 모노레포 + FSD 아키텍처

---

## 프로젝트 구조 개요

```
모노레포 (Turborepo)
  ├── apps/
  │    ├── web/          ← 사용자 프론트엔드 (Next.js)
  │    └── admin/        ← 어드민 대시보드 (Next.js)
  └── packages/
       ├── ui/           ← 공용 컴포넌트
       ├── db/           ← Prisma 스키마 + 쿼리
       ├── types/        ← 공용 TypeScript 타입
       ├── utils/        ← 공용 유틸리티
       └── config/       ← ESLint, Tailwind, TS 설정 공유
```

---

## FSD (Feature-Sliced Design) 구조

각 앱 내부는 FSD 방식으로 구성.

```
apps/admin/src/
  ├── app/              ← Next.js App Router (라우팅만)
  │    ├── (auth)/
  │    ├── (dashboard)/
  │    └── layout.tsx
  │
  ├── pages/            ← 페이지 조합 레이어
  │    ├── dashboard/
  │    ├── users/
  │    ├── boards/
  │    └── ...
  │
  ├── widgets/          ← 독립적인 UI 블록
  │    ├── sidebar/
  │    ├── header/
  │    ├── stats-card/
  │    └── activity-feed/
  │
  ├── features/         ← 비즈니스 기능 단위
  │    ├── auth/
  │    ├── user-manage/
  │    ├── post-manage/
  │    ├── report-handle/
  │    ├── banner-editor/
  │    └── notification-send/
  │
  ├── entities/         ← 도메인 모델
  │    ├── user/
  │    ├── post/
  │    ├── board/
  │    ├── report/
  │    └── notification/
  │
  └── shared/           ← 완전 공용 (도메인 무관)
       ├── ui/          ← 기본 컴포넌트 (Button, Input, Modal...)
       ├── api/         ← fetch 래퍼, 에러 핸들러
       ├── hooks/       ← useDebounce, usePagination...
       ├── lib/         ← 유틸 함수
       └── constants/   ← 상수값
```

---

## 코어 스택

| 분류 | 기술 | 버전 | 선택 이유 |
|------|------|------|----------|
| 프레임워크 | Next.js | 14+ | App Router, SSR/SSG, API Routes 통합 |
| 언어 | TypeScript | 5+ | 타입 안전성 |
| 스타일 | Tailwind CSS | 3+ | 유틸리티 우선, 빠른 개발 |
| UI 컴포넌트 | shadcn/ui | latest | Radix 기반, 커스터마이징 용이 |
| 모노레포 | Turborepo | latest | 빌드 캐싱, 워크스페이스 관리 |

---

## 상태 관리

| 분류 | 기술 | 용도 |
|------|------|------|
| 전역 상태 | Zustand | 클라이언트 전역 상태 (사이드바, 모달, 유저 세션 등) |
| 서버 상태 | TanStack Query | API 데이터 캐싱, 동기화, 무한스크롤 |
| 폼 상태 | React Hook Form | 폼 유효성 검사 |
| 유효성 검사 | Zod | 스키마 기반 검사 (RHF + Zod 조합) |

### Zustand 스토어 구조

```ts
// shared/store/ui.store.ts — UI 전역 상태
interface UIStore {
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  toggleSidebar: () => void
}

// shared/store/auth.store.ts — 어드민 인증
interface AuthStore {
  admin: AdminUser | null
  role: AdminRole | null
  permissions: Permission[]
  setAdmin: (admin: AdminUser) => void
  clearAuth: () => void
}

// features/notification-send/store/send.store.ts — 기능별 로컬 스토어
interface NotificationSendStore {
  selectedUsers: number[]
  channel: Channel
  draft: NotificationDraft
}
```

---

## 데이터베이스

| 분류 | 기술 | 설명 |
|------|------|------|
| DB | PostgreSQL 16 | 메인 데이터베이스 |
| ORM | Prisma | 타입세이프 쿼리, 마이그레이션 관리 |
| 커넥션 풀 | PgBouncer | 커넥션 수 관리 (서버리스 환경 대비) |
| 캐시 | Redis | 세션, 알림 큐, rate limit |

### Prisma 구조 (packages/db)

```
packages/db/
  ├── prisma/
  │    ├── schema.prisma
  │    └── migrations/
  ├── src/
  │    ├── client.ts      ← PrismaClient 싱글턴
  │    ├── queries/       ← 도메인별 쿼리 함수
  │    │    ├── user.ts
  │    │    ├── post.ts
  │    │    └── ...
  │    └── index.ts
  └── package.json
```

---

## 인증

| 분류 | 기술 | 설명 |
|------|------|------|
| 사용자 인증 | NextAuth.js v5 | 소셜 로그인 + 세션 관리 |
| 어드민 인증 | 별도 구현 | JWT + 2FA (TOTP) |
| 토큰 | jose | JWT 서명/검증 |
| 2FA | otplib | TOTP 생성/검증 |
| 비밀번호 | bcryptjs | 해시 |

---

## 에디터

| 분류 | 기술 | 설명 |
|------|------|------|
| 에디터 | TipTap | 무료 + 커스텀 확장 |
| 이미지 처리 | sharp | WebP 변환, 리사이즈, EXIF 제거 |
| 핑거프린팅 | @fingerprintjs/fingerprintjs | 디바이스 식별 |

---

## 파일 / 이미지

| 분류 | 기술 | 설명 |
|------|------|------|
| 이미지 처리 | sharp | WebP 변환, 리사이즈, EXIF 제거, 썸네일 생성 |
| 이미지 저장 (현재) | PostgreSQL BYTEA | 빠른 시작용 |
| 이미지 저장 (이후) | Cloudflare R2 | 마이그레이션 대상 |
| 업로드 처리 | Next.js API Route | multipart/form-data 파싱 |

---

## API / 통신

| 분류 | 기술 | 설명 |
|------|------|------|
| API 레이어 | Next.js API Routes | REST API |
| 클라이언트 fetch | TanStack Query + ky | 캐싱 + 인터셉터 |
| 실시간 | Server-Sent Events | 알림 실시간 수신 |
| 웹소켓 | (미정) | 필요 시 추가 |

---

## 알림 발송

| 채널 | 라이브러리 | 설명 |
|------|-----------|------|
| 이메일 | nodemailer | SMTP 발송 |
| 이메일 (SendGrid) | @sendgrid/mail | SendGrid API |
| 카카오 알림톡 | 직접 구현 | KakaoTalk 비즈니스 API |
| SMS | 직접 구현 | 솔라피 REST API |
| 푸시 | web-push | PWA 브라우저 푸시 |

---

## 통계 / 분석

| 분류 | 기술 | 설명 |
|------|------|------|
| 외부 분석 | Google Analytics 4 | 트래픽, 유입, 행동 분석 |
| 차트 | Recharts | 대시보드 차트 |
| 날짜 처리 | date-fns | 날짜 포맷, 계산 |

---

## 보안

| 분류 | 기술 | 설명 |
|------|------|------|
| Rate limiting | redis + 직접 구현 | API 호출 제한 |
| CSRF | next-csrf | CSRF 토큰 |
| 헤더 보안 | next.config.js headers | CSP, HSTS 등 |
| 입력 검사 | Zod | 서버/클라이언트 공통 |
| XSS 방지 | DOMPurify | HTML 콘텐츠 sanitize |
| SQL | Prisma | Parameterized query 자동 |

---

## 인프라 / 배포

| 분류 | 기술 | 설명 |
|------|------|------|
| 배포 | Vercel / 자체 서버 | 미정 |
| 컨테이너 | Docker | 로컬 개발 환경 |
| DB 호스팅 | Supabase / 자체 서버 | PostgreSQL |
| 캐시 | Upstash Redis | 서버리스 Redis |
| 모니터링 | Sentry | 에러 추적 |
| 로깅 | pino | 구조화 로그 |

---

## 개발 도구

| 분류 | 기술 |
|------|------|
| 린터 | ESLint + eslint-config-next |
| 포맷터 | Prettier |
| 타입 체크 | TypeScript strict mode |
| 테스트 | Vitest + Testing Library |
| E2E | Playwright |
| 커밋 훅 | husky + lint-staged |
| 커밋 컨벤션 | Commitlint |

---

## 패키지 전체 목록

### apps/admin, apps/web 공통 의존성

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "typescript": "^5.0.0",

    // 상태 관리
    "zustand": "^4.0.0",
    "@tanstack/react-query": "^5.0.0",
    "react-hook-form": "^7.0.0",
    "zod": "^3.0.0",
    "@hookform/resolvers": "^3.0.0",

    // UI
    "tailwindcss": "^3.0.0",
    "@radix-ui/react-dialog": "latest",
    "@radix-ui/react-dropdown-menu": "latest",
    "@radix-ui/react-tooltip": "latest",
    "class-variance-authority": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest",
    "lucide-react": "latest",

    // 인증
    "next-auth": "^5.0.0",
    "jose": "^5.0.0",
    "bcryptjs": "^2.0.0",
    "otplib": "^12.0.0",

    // HTTP
    "ky": "^1.0.0",

    // 날짜
    "date-fns": "^3.0.0",

    // 유틸
    "nanoid": "^5.0.0"
  }
}
```

### apps/admin 전용

```json
{
  "dependencies": {
    // 에디터
    "@tiptap/react": "latest",
    "@tiptap/starter-kit": "latest",
    "@tiptap/extension-image": "latest",
    "@tiptap/extension-link": "latest",
    "@tiptap/extension-table": "latest",
    "@tiptap/extension-placeholder": "latest",

    // 차트
    "recharts": "^2.0.0",

    // 드래그앤드롭 (메뉴/배너 순서)
    "@dnd-kit/core": "latest",
    "@dnd-kit/sortable": "latest",

    // 기타
    "dompurify": "^3.0.0",
    "@types/dompurify": "latest"
  }
}
```

### packages/db

```json
{
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "prisma": "^5.0.0"
  }
}
```

### 서버 사이드 (API Routes)

```json
{
  "dependencies": {
    "sharp": "^0.33.0",
    "nodemailer": "^6.0.0",
    "@sendgrid/mail": "^8.0.0",
    "web-push": "^3.0.0",
    "ioredis": "^5.0.0",
    "@fingerprintjs/fingerprintjs": "^4.0.0",
    "pino": "^8.0.0",
    "pino-pretty": "^10.0.0"
  }
}
```

---

## 데이터 흐름 요약

```
클라이언트 (React)
  └── TanStack Query (서버 상태 캐싱)
       └── ky (HTTP 클라이언트)
            └── Next.js API Route
                 └── packages/db (Prisma)
                      └── PostgreSQL

전역 UI 상태 (Zustand)
  └── 사이드바, 모달, 어드민 인증, 알림 뱃지 등
```

---

## 추가 필요 기술 (현재 미확정)

| 항목 | 후보 | 결정 필요 시점 |
|------|------|--------------|
| 검색 | PostgreSQL FTS / Meilisearch | 게시물 검색 구현 시 |
| 결제 | 토스페이먼츠 SDK | 결제 모듈 구현 시 |
| 이미지 CDN | Cloudflare R2 | 용량 커질 때 마이그레이션 |
| 큐 | Bull (Redis 기반) | 알림 발송량 많아질 때 |
| 모니터링 | Sentry | 배포 전 도입 |
