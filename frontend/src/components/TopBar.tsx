import { useEffect, useState, type ReactNode } from 'react';
import { TECHS, METRICS, PERIODS, TECH_LABEL, METRIC_LABEL, PERIOD_SHORT } from '../lib/constants';
import { fmtDate, fmtTime, isoMinute } from '../lib/date';
import type { SetViewParam } from '../hooks/useUrlState';
import type { ViewParams } from '../types';

interface SegmentedProps<T extends string> {
  id: string;
  label: string;
  options: readonly T[];
  labels: Record<T, string>;
  value: T;
  onChange: (value: T) => void;
}

interface TopBarProps extends ViewParams {
  onChange: SetViewParam;
  /** 마스트헤드 오른쪽 (최신 데이터 날짜 + 업로드) */
  right: ReactNode;
  /** 컨트롤 줄 오른쪽 (역 검색) */
  search: ReactNode;
}

function Segmented<T extends string>({ id, label, options, labels, value, onChange }: SegmentedProps<T>) {
  return (
    <div className="ctl">
      <span className="ctl-label" id={`lbl-${id}`}>{label}</span>
      <div className="seg" role="group" aria-labelledby={`lbl-${id}`}>
        {options.map((o) => (
          <button key={o} type="button" aria-pressed={value === o} onClick={() => onChange(o)}>
            {labels[o]}
          </button>
        ))}
      </div>
    </div>
  );
}

// 노선 위 신호: 역(원) 두 개를 잇는 노선 + 신호 파동
function Logo() {
  return (
    <svg className="brand-logo" width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      <rect x="1" y="1" width="38" height="38" rx="10" style={{ fill: 'var(--ink)' }} />
      <path d="M8 29h24" strokeWidth="3" strokeLinecap="round" style={{ stroke: 'var(--bg)' }} />
      <circle cx="12" cy="29" r="3.4" strokeWidth="2.2" style={{ fill: 'var(--ink)', stroke: 'var(--bg)' }} />
      <circle cx="28" cy="29" r="3.4" strokeWidth="2.2" style={{ fill: 'var(--ink)', stroke: 'var(--bg)' }} />
      <g fill="none" strokeWidth="2.4" strokeLinecap="round" style={{ stroke: 'var(--accent)' }}>
        <path d="M15.5 18.5a6.5 6.5 0 0 1 9 0" />
        <path d="M11.5 14.2a12 12 0 0 1 17 0" />
      </g>
      <circle cx="20" cy="22.5" r="2" style={{ fill: 'var(--accent)' }} />
    </svg>
  );
}

function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

// 마스트헤드(좌: 오늘 날짜 · 중앙: 로고/서비스명 · 우: 최신 데이터/업로드) + 컨트롤 줄
export default function TopBar({ tech, metric, period, onChange, right, search }: TopBarProps) {
  const now = useNow();
  return (
    <header className="masthead">
      <div className="mast-row">
        <div className="mast-meta">
          <span className="mast-k">Today</span>
          <time className="num" dateTime={isoMinute(now)}>{fmtDate(now)}</time>
          <span className="mast-time num">{fmtTime(now)}</span>
        </div>
        <a className="brand" href="./" aria-label="Subway Signal 처음 화면">
          <Logo />
          <span className="brand-text">
            <span className="brand-name">Subway Signal</span>
            <span className="brand-sub">무선망 노선도 데이터 시각화</span>
          </span>
        </a>
        {right}
      </div>
      <nav className="mast-nav" aria-label="보기 설정">
        <div className="controls">
          <Segmented id="tech" label="기술" options={TECHS} labels={TECH_LABEL} value={tech} onChange={(v) => onChange('tech', v)} />
          <Segmented id="metric" label="지표" options={METRICS} labels={METRIC_LABEL} value={metric} onChange={(v) => onChange('metric', v)} />
          <Segmented id="period" label="기간" options={PERIODS} labels={PERIOD_SHORT} value={period} onChange={(v) => onChange('period', v)} />
        </div>
        {search}
      </nav>
    </header>
  );
}
