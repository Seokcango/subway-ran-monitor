// 노선도 아래 사용방법 카드 3개 — 조작(키) · 결과(값) 짧은 항목
const STEPS: { n: string; title: string; items: [string, string][] }[] = [
  {
    n: '01',
    title: '지표 고르기',
    items: [
      ['기술', '5G / LTE'],
      ['지표', 'VOC · 부하율 · 장비알람'],
      ['기간', '24시간 · 7일 · 30일'],
    ],
  },
  {
    n: '02',
    title: '지도 보기',
    items: [
      ['스크롤', '확대 · 축소'],
      ['드래그', '이동'],
      ['클릭', '역 · 구간 상세 보기'],
    ],
  },
  {
    n: '03',
    title: '데이터 올리기',
    items: [
      ['업로드', 'CSV 또는 JSON'],
      ['샘플 CSV', '파일 형식 확인'],
      ['되돌리기', '원래 데이터로 복귀'],
    ],
  },
];

export default function HowToUse() {
  return (
    <section className="howto" aria-labelledby="howto-title">
      <h2 id="howto-title">사용방법</h2>
      <div className="howto-grid">
        {STEPS.map((s) => (
          <article key={s.n} className="howto-card">
            <span className="howto-n num">{s.n}</span>
            <h3>{s.title}</h3>
            <dl className="howto-list">
              {s.items.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
