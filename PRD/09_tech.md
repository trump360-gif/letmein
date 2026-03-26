# 09. 기술 스택

> 참고 문서. 아키텍처 결정 시 참조.
> 연관: [_index.md](./_index.md) (기술 스택 요약)

---

## 단계별 인프라 전략

> ⚠️ MVP부터 10만 동접 인프라를 구축하는 것은 과잉 설계. 단계별로 확장한다.

```
Phase 1 (MVP, 0–1만 유저)          Phase 2 (1만–5만 유저)          Phase 3 (5만+ 동접)
─────────────────────────          ────────────────────────          ─────────────────────
Docker Compose + 단일 서버          Docker Swarm / 다중 서버           Kubernetes + HPA
Caddy (리버스 프록시)                Nginx (L7 LB)                    Nginx + K8s LB 이중
PostgreSQL (단일)                   PostgreSQL + PgBouncer            PostgreSQL HA + PgBouncer
Redis (단일)                        Redis Sentinel                    Redis Cluster
Go API (단일 인스턴스)               Go API (2–4 인스턴스)             Go API (HPA 자동 확장)
Centrifugo (단일)                   Centrifugo (단일)                 Centrifugo 클러스터
PostgreSQL LIKE 검색                PostgreSQL trigram                 Elasticsearch
Go goroutine 비동기                 Go goroutine 비동기               RabbitMQ + Worker
Cloudflare R2                      Cloudflare R2                     Cloudflare R2 또는 MinIO
─                                  ─                                 Terraform (IaC)
```

---

## 클라이언트

| 영역 | 기술 | 비고 |
|------|------|------|
| 모바일 앱 | Flutter (Dart) + **Riverpod** | iOS / Android 동시 대응 |
| 웹 CMS | Next.js (App Router) + TypeScript + **shadcn/ui** | 관리자 전용 → [07_cms.md](./07_cms.md) |

## 백엔드 코어

| 영역 | 기술 | 비고 |
|------|------|------|
| API 서버 | **Go** (Gin 프레임워크) | 고성능 / 낮은 메모리 / 동시성 강점 |
| 데이터베이스 | PostgreSQL | 관계형 데이터 |
| 캐시 + 세션 | **Redis** | Centrifugo pub/sub 브로커 겸용, 세션 관리 |
| 파일 스토리지 | **Cloudflare R2** (MVP) | S3 호환 API → [08_media.md](./08_media.md) |
| 실시간 채팅 | Centrifugo + WebSocket | Redis 브로커 연동 → [05_chat.md](./05_chat.md) |

## 인프라 (MVP Phase 1)

| 영역 | 기술 | 비고 |
|------|------|------|
| 컨테이너화 | Docker Compose | 단일 서버에서 전 서비스 운영 |
| 리버스 프록시 | Caddy | 자동 HTTPS |
| CDN | Cloudflare | 이미지·정적 파일 |

## 인프라 (Phase 3 — 스케일 아웃 시 추가)

| 영역 | 기술 | 비고 |
|------|------|------|
| 오케스트레이션 | Kubernetes (K8s) | HPA 수평 확장 |
| 로드밸런서 | Nginx + K8s LoadBalancer | L7 + L4 이중 구성 |
| 커넥션 풀러 | PgBouncer | DB 커넥션 고갈 방지 |
| 인프라 코드 관리 | Terraform | IaC |
| 검색 | Elasticsearch | 병원명·시술 키워드 |
| 메시지 큐 | RabbitMQ | 대규모 비동기 작업 |
| 비디오 스트리밍 | Cloudflare Stream | 출연자 비디오 호스팅 (향후) |

## 앱 기능

| 영역 | 기술 | 비고 |
|------|------|------|
| 지도 | 카카오맵 / 네이버맵 | **미정** → [04_hospital.md](./04_hospital.md) |
| 유튜브 썸네일 | `img.youtube.com` + oEmbed API | → [11_roadmap.md](./11_roadmap.md) |
| 인증 | JWT + 카카오 소셜 로그인 | → [06_auth.md](./06_auth.md) |
| 푸시 알림 | FCM (Firebase Cloud Messaging) | → [05_chat.md](./05_chat.md), [02_consultation.md](./02_consultation.md) |
| 키워드 필터링 | 서버사이드 정규식 (Go) | → [02_consultation.md](./02_consultation.md) |

## 모니터링 및 에러 트래킹

| 영역 | 기술 | 비고 |
|------|------|------|
| 인프라 모니터링 | Prometheus + Grafana | 동접자 수, API 응답시간 |
| 에러 트래킹 | Sentry | Flutter 앱 + Go 서버 |

---

## 아키텍처 흐름 (MVP)

```
Flutter 앱 (Riverpod)
    │
    ├─ REST API ──→ Caddy (리버스 프록시 + HTTPS)
    │                     │
    │              Go API 서버 (단일 인스턴스)
    │                     │
    │                     ├──→ PostgreSQL
    │                     ├──→ Redis (캐시 + 세션)
    │                     └──→ Go goroutine (푸시/이미지 비동기)
    │
    ├─ WebSocket ──→ Centrifugo ──→ Redis (pub/sub)
    │
    └─ 이미지 요청 ──→ Cloudflare CDN ──→ Cloudflare R2

CMS: Next.js + shadcn/ui
```

## Phase 3 스케일 아웃 아키텍처

```
Flutter 앱 (Riverpod)
    │
    ├─ REST API ──→ Nginx (L7) ──→ K8s LoadBalancer (L4)
    │                                     │
    │                              Go API 서버 (다중 인스턴스, K8s HPA)
    │                                     │
    │                                     ├──→ PostgreSQL (PgBouncer 경유)
    │                                     ├──→ Redis Cluster (캐시 + 세션)
    │                                     └──→ RabbitMQ ──→ Worker (푸시/이미지)
    │
    ├─ WebSocket ──→ Centrifugo 클러스터 ──→ Redis (pub/sub)
    │
    └─ 이미지 요청 ──→ Cloudflare CDN ──→ R2 또는 MinIO

인프라 전체: Terraform으로 코드 관리 (IaC)
CMS: Next.js + shadcn/ui
```
