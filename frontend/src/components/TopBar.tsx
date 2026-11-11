import { TECHS, METRICS, PERIODS, TECH_LABEL, METRIC_LABEL, PERIOD_LABEL, PERIOD_SHORT, HEADLINE } from '../lib/constants';
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
export default function TopBar({ tech, metric, period, onChange, asOf }: TopBarProps) {
  return (
    <header className="top">
      <div>
        <div className="eyebrow">
          <span>[서비스명] 무선망 노선도</span>
          <span>{TECH_LABEL[tech]} · {METRIC_LABEL[metric]} · {PERIOD_LABEL[period]}</span>
          <span>{asOf} 기준</span>
        </div>
        <h1>{HEADLINE[metric]}</h1>
      </div>
      <div className="controls">
        <Segmented id="tech" label="기술" options={TECHS} labels={TECH_LABEL} value={tech} onChange={(v) => onChange('tech', v)} />
        <Segmented id="metric" label="지표" options={METRICS} labels={METRIC_LABEL} value={metric} onChange={(v) => onChange('metric', v)} />
        <Segmented id="period" label="기간" options={PERIODS} labels={PERIOD_SHORT} value={period} onChange={(v) => onChange('period', v)} />
      </div>
    </header>
  );
}
