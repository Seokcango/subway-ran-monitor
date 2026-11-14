import { TECHS, METRICS, PERIODS, TECH_LABEL, METRIC_LABEL, PERIOD_SHORT } from '../lib/constants';
import type { ReactNode } from 'react';
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
  asOf: string;
  /** 컨트롤 오른쪽에 붙는 추가 요소 (데이터 업로드) */
  extra?: ReactNode;
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

// PRD 6.1 공통 조작 영역: 기술 · 지표 · 기간
export default function TopBar({ tech, metric, period, onChange, asOf, extra }: TopBarProps) {
  return (
    <header className="top">
      <div>
        <div className="eyebrow">
          <span>무선망 노선도 데이터 시각화</span>
          <span className="asof">{asOf}</span>
        </div>
        <h1>Subway Signal</h1>
      </div>
      <div className="controls">
        <Segmented id="tech" label="기술" options={TECHS} labels={TECH_LABEL} value={tech} onChange={(v) => onChange('tech', v)} />
        <Segmented id="metric" label="지표" options={METRICS} labels={METRIC_LABEL} value={metric} onChange={(v) => onChange('metric', v)} />
        <Segmented id="period" label="기간" options={PERIODS} labels={PERIOD_SHORT} value={period} onChange={(v) => onChange('period', v)} />
        {extra}
      </div>
    </header>
  );
}
