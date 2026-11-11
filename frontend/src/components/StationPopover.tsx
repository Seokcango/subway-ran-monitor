import { useLayoutEffect, useRef, useState } from 'react';
import { POS, stationLines } from '../lib/network';
import { cssv, loadTok } from '../lib/constants';
import { stationAlarms } from '../lib/selectors';
import LineBadge from './LineBadge';
import type { ElementSize } from '../hooks/useElementSize';
import type { MetricsData, StationId, ViewBox } from '../types';

interface StationPopoverProps {
  stationId: StationId;
  data: MetricsData;
  vb: ViewBox;
  boxSize: ElementSize;
  onClose: () => void;
  onShowDetail: () => void;
  onZoom: () => void;
}

// 역을 누르면 지도 위 그 역 옆에 뜨는 정보 카드
export default function StationPopover({ stationId, data, vb, boxSize, onClose, onShowDetail, onZoom }: StationPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: 0, top: 0, visible: false });
  const sd = data.st[stationId];
  const al = stationAlarms(data, stationId);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !boxSize.width) return;
    const [px, py] = POS[stationId];
    const x = ((px - vb.x) / vb.w) * boxSize.width;
    const y = ((py - vb.y) / vb.h) * boxSize.height;
    if (x < 0 || y < 0 || x > boxSize.width || y > boxSize.height) { setPos((p) => ({ ...p, visible: false })); return; }
    const pw = el.offsetWidth, ph = el.offsetHeight, gap = 14;
    let left = x + gap;
    if (left + pw > boxSize.width - 8) left = x - gap - pw;
    if (left < 8) left = Math.max(8, Math.min(boxSize.width - pw - 8, x - pw / 2));
    const top = Math.max(8, Math.min(boxSize.height - ph - 8, y - ph / 2));
    setPos({ left, top, visible: true });
  }, [stationId, vb, boxSize, data]);

  return (
    <div
      ref={ref}
      className="pop"
      role="dialog"
      aria-label={`${stationId} 역 정보`}
      style={{ left: pos.left, top: pos.top, visibility: pos.visible ? 'visible' : 'hidden' }}
    >
      <div className="pop-head">
        <div>
          <strong>{stationId}</strong>
          <div className="lines">{stationLines[stationId].map((l) => <LineBadge key={l} lineId={l} />)}</div>
        </div>
        <button type="button" className="x" onClick={onClose} aria-label="정보 카드 닫기">×</button>
      </div>
      <div className="pop-facts">
        <div><div className="k">부하율</div><div className="v num" style={{ color: cssv(loadTok(sd.load)) }}>{sd.load}%</div></div>
        <div><div className="k">VOC</div><div className="v num">{sd.voc}건</div></div>
        <div><div className="k">알람</div><div className="v num" style={al.length ? { color: 'var(--crit)' } : undefined}>{al.length}건</div></div>
      </div>
      {al.length > 0 && (
        <div className="al">
          {al.map((a) => (
            <span key={a.id}><span className={`sev sm ${a.sev}`}>{a.sev}</span> {a.eq} · {a.at}</span>
          ))}
        </div>
      )}
      <div className="pop-actions">
        <button type="button" onClick={onShowDetail}>장비 상세 보기</button>
        <button type="button" className="ghost" onClick={onZoom}>이 역 확대</button>
      </div>
    </div>
  );
}
