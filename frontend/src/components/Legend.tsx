import type { ReactNode } from 'react';
import { cssv } from '../lib/constants';
import type { CssToken, Metric } from '../types';

function Dot({ tok, children }: { tok: CssToken; children: ReactNode }) {
  return (
    <span className="it">
      <span className="dot" style={{ background: cssv(tok) }} />
      {children}
    </span>
  );
}

export default function Legend({ metric }: { metric: Metric }) {
  if (metric === 'load') {
    return (
      <div className="legend">
        <span className="it">
          <svg width="46" height="18" aria-hidden="true">
            <line x1="6" y1="9" x2="40" y2="9" strokeWidth="12" strokeLinecap="round" style={{ stroke: 'var(--crit)', opacity: 0.55 }} />
            <line x1="6" y1="9" x2="40" y2="9" strokeWidth="3.4" strokeLinecap="round" stroke="#00A84D" />
          </svg>
          노선 색 위 띠 굵기 = 터널 부하율(70% 이상)
        </span>
        <Dot tok="--ok">70% 미만 정상</Dot>
        <Dot tok="--warn">70–85% 주의</Dot>
        <Dot tok="--crit">85% 이상 위험</Dot>
        <span className="it">
          <svg width="40" height="12" aria-hidden="true">
            <line x1="4" y1="6" x2="36" y2="6" strokeWidth="3" strokeDasharray="2 5" strokeLinecap="round" style={{ stroke: 'var(--nodata)' }} />
          </svg>
          데이터 없음
        </span>
      </div>
    );
  }
  if (metric === 'voc') {
    return (
      <div className="legend">
        <span className="it">
          <svg width="40" height="24" aria-hidden="true">
            <circle cx="8" cy="14" r="4" style={{ fill: 'var(--accent)', fillOpacity: 0.25, stroke: 'var(--accent)' }} />
            <circle cx="27" cy="12" r="10" style={{ fill: 'var(--accent)', fillOpacity: 0.25, stroke: 'var(--accent)' }} />
          </svg>
          원 크기 = 역별 VOC 건수
        </span>
      </div>
    );
  }
  return (
    <div className="legend">
      <Dot tok="--crit">Critical</Dot>
      <Dot tok="--major">Major</Dot>
      <Dot tok="--warn">Minor</Dot>
      <span className="it">
        <svg width="18" height="18" aria-hidden="true">
          <rect x="1" y="1" width="16" height="16" rx="3" style={{ fill: 'var(--ink-2)' }} />
          <text x="9" y="13.5" textAnchor="middle" fontSize="11" fontWeight="700" fill="#FFFFFF">T</text>
        </svg>
        터널 장비(중계기) 알람
      </span>
    </div>
  );
}
