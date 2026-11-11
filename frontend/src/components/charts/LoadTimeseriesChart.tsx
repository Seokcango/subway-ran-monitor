import { useEffect, useState } from 'react';
import { getLoadTimeseries } from '../../api/index';
import { cssv, loadTok, LOAD_CRIT, LOAD_WARN, PERIOD_LABEL } from '../../lib/constants';
import type { Period, Tech, TimeseriesPoint } from '../../types';

interface LoadTimeseriesChartProps {
  targetId: string;
  name: string;
  kind: string;
  /** 최대 부하율. null이면 측정값 없음 */
  peak: number | null;
  tech: Tech;
  period: Period;
}

const CW = 380, CH = 190, X0 = 34, Y0 = 14;
const PW = CW - X0 - 10, PH = CH - Y0 - 30;
const X = (i: number) => X0 + (i * PW) / 23;
const Y = (p: number) => Y0 + PH - (p / 100) * PH;

// PRD 6.4: 선택한 역·구간의 시간대별 부하율 그래프 (85% 기준선 표시)
export default function LoadTimeseriesChart({ targetId, name, kind, peak, tech, period }: LoadTimeseriesChartProps) {
  const [rows, setRows] = useState<TimeseriesPoint[] | null>(null);

  useEffect(() => {
    let alive = true;
    getLoadTimeseries(targetId, peak, tech, period).then((r) => { if (alive) setRows(r); });
    return () => { alive = false; };
  }, [targetId, peak, tech, period]);

  const title = (
    <h2>
      시간대별 부하율 · {name}{' '}
      <span className="h2-sub">{kind}{period === '24h' ? '' : ` · ${PERIOD_LABEL[period]} 시간대 평균`}</span>
    </h2>
  );
  if (peak == null) return <section>{title}<p className="note">이 구간은 측정값이 없습니다. 중계기 상태를 확인하세요.</p></section>;
  if (!rows) return <section>{title}<p className="note">불러오는 중…</p></section>;

  const pts = rows.map((r, i) => `${X(i).toFixed(1)},${Y(r.load).toFixed(1)}`).join(' ');
  const area = `M${X(0)},${Y(0)} L${pts.split(' ').join(' L')} L${X(23)},${Y(0)} Z`;
  const peakRow = rows.reduce((m, r) => (r.load > m.load ? r : m), rows[0]);

  return (
    <section>
      {title}
      <div className="tbl">
        <svg className="chart" viewBox={`0 0 ${CW} ${CH}`} role="img" aria-label={`${name} 시간대별 부하율, 최고 ${peakRow.hour}시 ${peakRow.load}%`}>
          {[0, 50, 100].map((p) => (
            <g key={p}>
              <line x1={X0} x2={X0 + PW} y1={Y(p)} y2={Y(p)} style={{ stroke: 'var(--rule)' }} />
              <text x={X0 - 6} y={Y(p) + 4} textAnchor="end" fontSize="10" style={{ fill: 'var(--ink-2)' }}>{p}</text>
            </g>
          ))}
          <line x1={X0} x2={X0 + PW} y1={Y(LOAD_CRIT)} y2={Y(LOAD_CRIT)} strokeDasharray="4 4" strokeWidth="1.5" style={{ stroke: 'var(--crit)' }} />
          <text x={X0 + PW} y={Y(LOAD_CRIT) - 5} textAnchor="end" fontSize="10" style={{ fill: 'var(--crit)' }}>85% 위험</text>
          <line x1={X0} x2={X0 + PW} y1={Y(LOAD_WARN)} y2={Y(LOAD_WARN)} strokeDasharray="2 4" style={{ stroke: 'var(--warn)' }} />
          <path d={area} style={{ fill: 'var(--ink)', fillOpacity: 0.07 }} />
          <polyline points={pts} fill="none" strokeWidth="2.2" strokeLinejoin="round" style={{ stroke: 'var(--ink)' }} />
          <circle cx={X(peakRow.hour)} cy={Y(peakRow.load)} r="4" strokeWidth="2" style={{ fill: cssv(loadTok(peakRow.load)), stroke: 'var(--surface)' }} />
          <text x={Math.min(X(peakRow.hour), X0 + PW - 60)} y={Y(peakRow.load) - 9} fontSize="11" fontWeight="700" style={{ fill: 'var(--ink)' }}>
            {peakRow.hour}시 {peakRow.load}%
          </text>
          {[0, 6, 12, 18, 23].map((i) => (
            <text key={i} x={X(i)} y={CH - 8} textAnchor="middle" fontSize="10" style={{ fill: 'var(--ink-2)' }}>{String(i).padStart(2, '0')}시</text>
          ))}
        </svg>
      </div>
    </section>
  );
}
