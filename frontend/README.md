# frontend — 무선망 노선도 (React + TypeScript + Vite)

시안 C(수송 흐름 지도)와 `prd_RENEWAL.md`의 메인 노선도(화면 ①~④)를 React로 옮긴 프론트엔드입니다.
`prototype/index.html`과 같은 화면이며, 지금은 가상 데이터로 동작합니다.

## 실행

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run typecheck  # 타입 검사 (tsc)
npm run build      # 타입 검사 후 dist/ 생성
```

Node.js 18 이상이 필요합니다.

## 구조

```
src/
├── main.tsx, App.tsx
├── types.ts                 # 도메인 타입 (API 응답 형태 포함)
├── styles.css               # 디자인 토큰(라이트/다크) + 화면 스타일
├── pages/MapPage.tsx        # ①~④ 지표만 바꿔 보는 메인 화면
├── components/
│   ├── TopBar.tsx           # 5G/LTE · 지표 · 기간 선택 (URL 쿼리와 동기화)
│   ├── SummaryBar.tsx       # 요약 4개 수치
│   ├── LineFilter.tsx       # 호선 필터
│   ├── SubwayMap.tsx        # 노선도 SVG, 확대/이동, 역·구간 클릭
│   ├── StationPopover.tsx   # 역 클릭 시 지도 위 정보 카드
│   ├── SidePanel.tsx        # 지표별 오른쪽 패널 (TOP 5, 유형 비율, 알람 목록)
│   ├── DetailPanel.tsx      # 선택한 역·구간 장비 현황
│   ├── Legend.tsx, LineBadge.tsx
│   └── charts/LoadTimeseriesChart.tsx
├── api/index.ts             # 데이터 함수 (mock ↔ 실제 API 전환 지점)
├── data/network.ts          # 노선·역 마스터 (역 순서·색은 실제, 좌표는 근사값)
├── data/mock.ts             # 가상 데이터 생성기
├── hooks/                   # useUrlState, useMetrics, useElementSize
└── lib/                     # 노선 구조·투영, 상수, 확대 계산
```

## 백엔드 연결

- `vite.config.ts`가 `/api` 요청을 `http://localhost:8000`(FastAPI)으로 넘깁니다.
- `.env.local`에 `VITE_USE_MOCK=false`를 넣으면 `src/api/index.ts`가 가상 데이터 대신 실제 API를 호출합니다.
- 역 좌표는 공공데이터를 적재한 뒤 `GET /api/lines` 응답으로 바꿀 예정입니다.
