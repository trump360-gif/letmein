---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: verifying
stopped_at: 04-hospital-chat-ads plan 1 완료 (HCHAT-01~05)
last_updated: "2026-03-30T08:12:05.544Z"
last_activity: 2026-03-30
progress:
  total_phases: 5
  completed_phases: 1
  total_plans: 1
  completed_plans: 7
  percent: 20
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-30)

**Core value:** 병원이 CMS 웹 포탈에서 상담 요청 확인 → 응답 → 채팅 → 광고/프리미엄 관리까지 전체 비즈니스를 운영할 수 있어야 한다
**Current focus:** Phase 1 - CMS Critical 수정

## Current Position

Phase: 1 of 5 (CMS Critical 수정)
Plan: 2 of 2 completed in current phase (Plan 1 done)
Status: Phase complete — ready for verification
Last activity: 2026-03-30

Progress: [██░░░░░░░░] 20%

## Performance Metrics

**Velocity:**

- Total plans completed: 2 (Plan 1 + Plan 2 from previous session)
- Average duration: ~15 minutes/plan
- Total execution time: ~0.5 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-cms-critical | 2 | ~30m | ~15m |

**Recent Trend:**

- Last 5 plans: Plan 1 (15m), Plan 2 (15m)
- Trend: On schedule

*Updated after each plan completion*
| Phase 02-hospital-auth-dashboard P1 | 30m | 3 tasks | 14 files |
| Phase 03-hospital-profile-consult P3 | 8m | 2 tasks | 7 files |
| Phase 04-hospital-chat-ads P3 | 8 | 1 tasks | 6 files |
| Phase 03-hospital-profile-consult P2 | 20 | 2 tasks | 7 files |
| Phase 04-hospital-chat-ads P1 | 246 | 2 tasks | 11 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Init]: 병원 포탈 = CMS 역할 분기 (별도 앱 X, admin 앱에 role 분기 추가)
- [Init]: Go 서버 API 재사용 — 24개 hospital API 이미 존재, CMS에서 fetch 호출
- [Init]: 채팅은 polling으로 구현 (Centrifugo CMS 연동은 v2)
- [Init]: 드롭다운 전면 금지 — 탭/칩/드래그앤드롭만 허용
- [Plan 1]: AdminCredential 모델을 기존 AdminUser와 분리 (독립 email/password 인증용)
- [Plan 1]: prisma db push 불가 시 직접 SQL CREATE TABLE 사용 후 prisma generate
- [Plan 1]: Route Handler BigInt(1) fallback 유지, Server Action은 throw 처리
- [Phase 02-hospital-auth-dashboard]: admin_credentials 테이블에 role/hospital_id 컬럼 추가로 병원 계정 인증 구현 (별도 테이블 생성 없이)
- [Phase 02-hospital-auth-dashboard]: 대시보드 page.tsx에서 내부 API 호출 없이 Prisma 직접 조회 (same process)
- [Phase 02-hospital-auth-dashboard]: reviews 테이블은 Prisma 스키마 없어 $queryRaw 사용
- [Phase 03-hospital-profile-consult]: 응답 폼 state는 key prop 전달로 선택 변경 시 자동 리셋 (controlled reset without explicit clear logic)
- [Phase 03-hospital-profile-consult]: consultation_responses upsert — 재발송 허용, unique 제약으로 DB 중복 방지
- [Phase 04-hospital-chat-ads]: Prisma direct query for premium status instead of Go proxy — no proxy infrastructure exists in CMS
- [Phase 03-hospital-profile-consult]: PATCH /[id] with params.id==='order' sentinel handles bulk sortOrder in single dynamic route file
- [Phase 03-hospital-profile-consult]: dnd-kit optimistic local state (localDoctors) provides instant DnD feedback before server confirms sort order
- [Phase 04-hospital-chat-ads]: Prisma 직접 조회 사용 — Go 서버 프록시 아님, session.ts에 hospitalJwt 없고 기존 패턴과 일치
- [Phase 04-hospital-chat-ads]: visit_cards 테이블: $queryRaw 사용 (Prisma 모델 없음)

### Pending Todos

- Sanction 모델 스키마-코드 불일치 수정 (appliedBy, liftedBy, type 필드 추가 필요)
- Report 모델 processedBy, processedAt 필드 추가 필요
- User 모델 suspendedUntil, suspensionReason 필드 추가 필요

### Blockers/Concerns

- 기존 DB 스키마와 Prisma 스키마 간 불일치로 `prisma db push` 사용 불가 — 마이그레이션 전략 필요

## Session Continuity

Last session: 2026-03-30T08:12:05.542Z
Stopped at: 04-hospital-chat-ads plan 1 완료 (HCHAT-01~05)
Resume file: None
