# 패턴노트 — 5조

내배캠 PM 7기 5조 최종 프로젝트. 매매 당시의 판단 근거와 상태를 선택형으로 남겨, 반복되는 판단 패턴을 스스로 볼 수 있게 합니다.

화면은 [피그마 5조](https://www.figma.com/design/4vkt1I8oKaDETSNRHXF4ns/5%EC%A1%B0?node-id=50-2293) **패턴노트 0.2**를 기준으로 맞췄습니다. 작업 로그는 `docs/PROGRESS.md`.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3005

화면은 390px 폭 + `#DADBDF` 레터박스입니다. 개발자 도구 모바일 뷰(390×844)로 보는 것이 가장 가깝습니다.

## 플로우

스플래시 → 온보딩(가치제안 슬라이드 · 삼성전자 연습 · 리플레이) → 약관/카카오 · 닉네임 → 홈 → 계획 · 매매 기록 · 기록 확인 · 인사이트

- 연습 기록은 비회원으로 남길 수 있고, **실제 매매 저장** 시점에 가입을 요청합니다.
- 같은 판단 근거 × 당시 상태 조합이 3건이면 인사이트 카드를 발행합니다. 개별 기록에는 편향 라벨을 붙이지 않습니다.

## 데이터

- 종목: `dataset`의 KOSPI/KOSDAQ/미국 목록을 `data/stocks.json`으로 넣었습니다. 검색은 국내/해외 탭과 최근 검색 5건을 지원합니다.
- 선택값: `data/categories.json` (판단 근거 대분류·칩, 매수/매도 당시 상태).
- 로그인·계획·기록·인사이트 카드는 이 브라우저 `localStorage`에 캐시되고, Supabase `accounts` / `plans` / `trades` / `insight_cards`에 동기화됩니다. 인사이트 카드는 insert-only입니다(내러티브 수정·행 삭제 없음).

## 환경변수

`.env.local`에 넣고, Vercel이면 Project Settings → Environment Variables에도 같은 이름으로 넣습니다.

| 이름 | 필수 | 설명 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 앱 실행 | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 앱 실행 | Publishable key |
| `NEXT_PUBLIC_KAKAO_REST_KEY` | 실제 카카오 로그인 | REST API 키. 없으면 데모 로그인 |
| `NEXT_PUBLIC_KAKAO_REDIRECT_URI` | 실제 카카오 로그인 | 폴백용. 실제 요청은 현재 도메인의 `/auth/kakao/callback`. 카카오 콘솔에 로컬·배포 URI를 모두 등록 |
| `KAKAO_CLIENT_SECRET` | 실제 카카오 로그인 | 서버에서만 사용 |
| `ANTHROPIC_API_KEY` | 인사이트 문장 | 없으면 템플릿 관찰/해석 문장 |
| `DATABASE_URL` | 스키마 적용 시에만 | `postgresql://postgres:[DB-PASSWORD]@db.xxxx.supabase.co:5432/postgres` |

`NEXT_PUBLIC_` 값은 브라우저에 노출됩니다. Database password / service role key는 앱에 넣지 마세요.

테이블이 아직 없으면:

```bash
npm run db:schema
```

또는 [SQL Editor](https://supabase.com/dashboard/project/cwvbkmiawjruzlxdbmfq/sql/new)에 `supabase/schema.sql`을 붙여넣고 Run 합니다.

카카오 로그인은 **회원번호만**으로 사용자를 식별합니다. 이메일은 요청하지 않습니다(비즈 앱 등록 없이 운영).

카카오 디벨로퍼스 Redirect URI에 아래를 **둘 다** 등록하세요.

- `http://localhost:3005/auth/kakao/callback`
- `https://pattern-note.vercel.app/auth/kakao/callback`
