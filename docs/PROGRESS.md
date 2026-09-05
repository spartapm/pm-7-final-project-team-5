# 패턴노트 구현 진행

피그마: [5조 파일](https://www.figma.com/design/4vkt1I8oKaDETSNRHXF4ns/5%EC%A1%B0?node-id=50-2293)

현재 작업 기준 페이지는 **패턴노트 0.2**입니다. `패턴노트 0.1` / `인사이트` 페이지는 deprecated.

## 디자인 토큰 (피그마에서 읽은 값)

- 배경 `#F4F6FA`, 카드 흰 배경, 네이비 `#1B2D4F`
- 매수 블루 `#3D6BFF`, 매도 리스트 레드 / 차트 오렌지 `#F07A3A`
- 인사이트 월간 카드 연블루 `#EAF3FF`
- 폰트 Pretendard, 디바이스 390px

## 화면 매핑

| # | 피그마 | 앱 라우트 | 상태 |
| --- | --- | --- | --- |
| 0 | 온보딩 (비회원 체험) `node-id=0-3` | `/` 스플래시, `/onboarding` | ✅ 가치제안 3장 → 삼성전자 연습 인트로 → 위저드(가격·시각·근거·상태·확인) → 연습 리플레이 → 가입 유도 |
| 1 | 로그인 및 회원가입 `node-id=0-116` | `/login`, `/signup/nickname`, `/welcome`, `/legal/terms`, `/legal/privacy`, `/auth/kakao/callback` | ✅ 필수 약관 체크 → 카카오 REST / 데모 → 닉네임 2~10자 → 환영(패턴노트로 기록을 이어가요) |
| 2 | 홈 `node-id=0-135` | `/home` | ✅ 2-1 매수/매도 진행률, 이번 달, CTA 2개(기록/계획), 최근 기록, 면책. 2-2 인사이트 1건↑이면 「새로 나온 인사이트」 캐러셀(최대 3) |
| 3 | 계획 `node-id=0-185` | `/plan`, `/plan/new`, `/plan/[id]` | ✅ 국내/해외 탭·최근 검색 5건, 해외는 USD·소수점. 상세에서 수정·삭제 확인 |
| 4 | 매매 기록 `node-id=0-296` | `/record` | ✅ 매수/매도 선택 → 종목 검색(제목·placeholder 피그마 4-1) → 가격/수량/일자/시각 → 판단근거(최대 3) → 당시상태(최대 2) → 확인. 비회원 실기록은 가입 게이트 |
| 5 | 기록 확인 `node-id=0-607` | `/records`, `/records/[id]` | ✅ 전체/매수/매도, 상세에 선택값 원문·시각, 삭제 확인. 편향 라벨 없음 |
| 6 | 인사이트 `node-id=135-2406` | `/insights`, `/insights/related` | ✅ 대시보드 + 경향해석. 카드 탭 → 관련 기록. 탭 뱃지「새로운 인사이트」. Claude 관찰/해석(가드레일) |

## 데이터

- 종목 CSV → `data/stocks.json` (KOSPI+KOSDAQ+NAS+NYS)
- 선택값 CSV → `data/categories.json` (판단근거 21, 당시상태 매수 7 / 매도 7)
- Supabase: `accounts`, `plans`, `trades` (`traded_time` 컬럼 포함)

## 의도적으로 넣지 않은 것

- 피그마 301장 전부 1:1 복제하지 않음. 구분되는 상태·플로우는 모두 있음.
- 뇌동매매 분류는 KPI용 내부 규칙이라 화면에 라벨로 넣지 않음 (PRD).
- 카카오 Redirect URI가 콘솔에 비어 있으면 실제 OAuth는 등록 후 동작. 그 전엔 데모 로그인.
- 인사이트 문장은 종목 주어·미래 조언·목표가/비중·순위 비교를 서버에서 걸러 냄 (PRD 7.4).

## 로컬

```bash
npm install
npm run db:schema
npm run dev   # :3005
```
