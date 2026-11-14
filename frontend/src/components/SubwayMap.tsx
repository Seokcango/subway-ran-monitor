import { useEffect, useMemo, useRef, type MouseEvent, type PointerEvent, type ReactElement } from 'react';
import { SEGS, STATIONS, POS, LINE_BY_ID, SEG_BY_ID, stationLines, segName, MAP_W, MAP_H } from '../lib/network';
import { METRIC_LABEL, SEV_TOK, cssv, loadTok, worstSev, clamp, LOAD_WARN } from '../lib/constants';
import { zoomViewBox } from '../lib/viewbox';
import { useElementSize } from '../hooks/useElementSize';
import StationPopover from './StationPopover';
import type { LineId, Metric, MetricsData, PickHandler, Selection, StationId, ViewBox } from '../types';

interface SubwayMapProps {
  data: MetricsData;
  metric: Metric;
  /** 'all' 또는 호선 id */
  line: LineId;
  sel: Selection | null;
  vb: ViewBox;
  onViewBoxChange: (vb: ViewBox) => void;
  onPick: PickHandler;
  onClear: () => void;
  onShowDetail: () => void;
  onZoomTo: (stationId: StationId) => void;
}

interface DragState {
  sx: number;
  sy: number;
  vb: ViewBox;
  moved: boolean;
  id: number;
}

// PRD 6.2: 역 = 원, 역간 터널 구간 = 선. 확대/축소·이동, 호선 필터.
export default function SubwayMap({ data, metric, line, sel, vb, onViewBoxChange, onPick, onClear, onShowDetail, onZoomTo }: SubwayMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  const justDragged = useRef(false);
  const vbRef = useRef(vb);
  vbRef.current = vb;
  const size = useElementSize(boxRef);

  const lineOn = (lid: LineId) => line === 'all' || line === lid;
  const stationOn = (id: StationId) => line === 'all' || stationLines[id].includes(line);

  // 확대 정도(k)에 따라 크기를 다시 계산. 드래그(x, y 이동)만으로는 다시 그리지 않는다.
  const k = Math.round((vb.w / MAP_W) * 100) / 100;
  const layers = useMemo(() => {
    const s = Math.pow(k, 0.78);
    const zoomed = k < 0.55;
    const lw = 3.4 * s;
    const maxVoc = Math.max(1, ...STATIONS.map((id) => data.st[id].voc));
    const halos: ReactElement[] = [], lines: ReactElement[] = [], hits: ReactElement[] = [], marks: ReactElement[] = [], stations: ReactElement[] = [], labels: ReactElement[] = [];

    SEGS.forEach((sg) => {
      const a = POS[sg.a], b = POS[sg.b];
      const on = lineOn(sg.line);
      const v = data.seg[sg.id].load;
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const len = Math.hypot(dx, dy) || 1;
      const off = sg.par * lw * 1.15 * (sg.flip ? -1 : 1);
      const nx = (-dy / len) * off, ny = (dx / len) * off;
      const at = { x1: a[0] + nx, y1: a[1] + ny, x2: b[0] + nx, y2: b[1] + ny };
      const selected = sel && sel.type === 'segment' && sel.id === sg.id;

      if (metric === 'load' && on && v != null && v >= LOAD_WARN) {
        halos.push(<line key={`h-${sg.id}`} {...at} strokeWidth={(4 + 16 * Math.sqrt(v / 100)) * s} style={{ stroke: cssv(loadTok(v)), opacity: 0.55 }} />);
      }
      if (selected) halos.push(<line key={`sel-${sg.id}`} {...at} strokeWidth={lw + 7 * s} style={{ stroke: 'var(--ink)' }} />);

      if (metric === 'load' && v == null && on) {
        lines.push(<line key={sg.id} {...at} strokeWidth={lw} strokeDasharray={`${2 * s} ${5 * s}`} style={{ stroke: 'var(--nodata)' }} />);
      } else {
        const op = !on ? 0.1 : metric === 'alarm' ? 0.55 : 1;
        lines.push(<line key={sg.id} {...at} strokeWidth={lw} style={{ stroke: LINE_BY_ID[sg.line].color, opacity: op }} />);
      }

      if (on) {
        hits.push(
          <line key={`hit-${sg.id}`} {...at} strokeWidth={14 * s} className="seg-hit" data-seg={sg.id} style={{ stroke: 'transparent' }}>
            <title>{`${LINE_BY_ID[sg.line].name} ${segName(sg)} 터널 · 부하율 ${v == null ? '데이터 없음' : `${v}%`}`}</title>
          </line>,
        );
      }

      if (metric === 'alarm' && on) {
        const al = data.alarms.find((x) => x.seg === sg.id);
        if (al) {
          const mx = (at.x1 + at.x2) / 2, my = (at.y1 + at.y2) / 2, h = 8 * s;
          marks.push(
            <g key={`m-${sg.id}`} data-seg={sg.id} className="seg-hit">
              {al.sev === 'Critical' && <rect x={mx - h} y={my - h} width={h * 2} height={h * 2} rx={2 * s} className="pulse" style={{ fill: cssv(SEV_TOK[al.sev]) }} />}
              <rect x={mx - h} y={my - h} width={h * 2} height={h * 2} rx={2 * s} style={{ fill: cssv(SEV_TOK[al.sev]), stroke: 'var(--surface)', strokeWidth: 1.5 * s }} />
              <text x={mx} y={my + 4 * s} textAnchor="middle" fontSize={11 * s} fontWeight="700" fill="#FFFFFF">T</text>
            </g>,
          );
        }
      }
    });

    // 확대 전에도 이름을 보여줄 역: 3개 노선 이상 환승역 + 지표 상위 역 + 알람 역 + 선택 역
    const must = new Set(STATIONS.filter((id) => stationLines[id].length >= 3));
    if (metric === 'load') [...STATIONS].sort((x, y) => data.st[y].load - data.st[x].load).slice(0, 6).forEach((id) => must.add(id));
    if (metric === 'voc') [...STATIONS].sort((x, y) => data.st[y].voc - data.st[x].voc).slice(0, 6).forEach((id) => must.add(id));
    if (metric === 'alarm') data.alarms.forEach((a) => { must.add(a.focus); if (a.seg) must.add(SEG_BY_ID[a.seg].b); });
    if (sel && sel.type === 'station') must.add(sel.id);

    STATIONS.forEach((id) => {
      const [px, py] = POS[id];
      const on = stationOn(id);
      const sd = data.st[id];
      const transfer = stationLines[id].length > 1;
      const selected = sel && sel.type === 'station' && sel.id === id;
      const r0 = (transfer ? 4.6 : 3.2) * s;
      let core: ReactElement;
      let extra: ReactElement | null = null;
      let label = `${id}, ${METRIC_LABEL[metric]} `;

      if (metric === 'load') {
        const hot = sd.load >= LOAD_WARN;
        core = <circle className="st-core" cx={px} cy={py} r={hot ? r0 * 1.25 : r0} style={{ fill: hot ? cssv(loadTok(sd.load)) : 'var(--surface)', stroke: hot ? 'var(--surface)' : 'var(--ink)', strokeWidth: (hot ? 1.4 : 1.3) * s }} />;
        label += `${sd.load}%`;
      } else if (metric === 'voc') {
        const rv = (2.5 + 15 * Math.sqrt(sd.voc / maxVoc)) * s;
        core = <circle className="st-core" cx={px} cy={py} r={rv} style={{ fill: 'var(--accent)', fillOpacity: 0.25, stroke: 'var(--accent)', strokeWidth: 1.3 * s }} />;
        if (rv >= 11 * s && (zoomed || sd.voc / maxVoc > 0.45)) {
          extra = <text x={px} y={py + 3.6 * s} textAnchor="middle" fontSize={10 * s} fontWeight="700" style={{ fill: 'var(--ink)' }}>{sd.voc}</text>;
        }
        label += `${sd.voc}건`;
      } else {
        const w = worstSev(data.alarms.filter((a) => a.st === id));
        if (w === 'Critical') extra = <circle cx={px} cy={py} r={9 * s} className="pulse" style={{ fill: 'var(--crit)' }} />;
        core = <circle className="st-core" cx={px} cy={py} r={w ? 7 * s : r0} style={{ fill: w ? cssv(SEV_TOK[w]) : 'var(--surface)', stroke: w ? 'var(--surface)' : 'var(--ink-2)', strokeWidth: 1.3 * s }} />;
        label += w ? `${w} 알람` : '알람 없음';
      }

      stations.push(
        <g
          key={id}
          className="st"
          data-st={id}
          role="button"
          tabIndex={on ? 0 : -1}
          aria-label={label}
          style={{ opacity: on ? 1 : 0.15 }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick('station', id); }
          }}
        >
          {selected && <circle cx={px} cy={py} r={r0 + 6 * s} style={{ fill: 'none', stroke: 'var(--ink)', strokeWidth: 2.2 * s }} />}
          {metric === 'alarm' && extra}
          {core}
          {metric === 'voc' && extra}
          <circle cx={px} cy={py} r={Math.max(9 * s, r0 + 4 * s)} style={{ fill: 'transparent' }} />
        </g>,
      );

      if (on && (zoomed || must.has(id))) {
        const strong = transfer || selected || must.has(id);
        labels.push(
          <text
            key={`l-${id}`}
            x={px + 7 * s}
            y={py - 6 * s}
            fontSize={11 * s}
            fontWeight={strong ? 700 : 400}
            paintOrder="stroke"
            strokeWidth={3.2 * s}
            strokeLinejoin="round"
            style={{ fill: strong ? 'var(--ink)' : 'var(--ink-2)', stroke: 'var(--surface)' }}
          >
            {id}
          </text>,
        );
      }
    });

    return { halos, lines, hits, marks, stations, labels };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, metric, line, sel, k]);

  // 드래그로 이동, 클릭과 구분
  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    drag.current = { sx: e.clientX, sy: e.clientY, vb: { ...vb }, moved: false, id: e.pointerId };
    justDragged.current = false;
  };
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    const svg = svgRef.current;
    if (!d || !svg) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (!d.moved && Math.abs(dx) + Math.abs(dy) > 5) {
      d.moved = true;
      svg.classList.add('dragging');
      try { svg.setPointerCapture(d.id); } catch { /* 무시 */ }
    }
    if (d.moved) {
      const r = svg.getBoundingClientRect();
      onViewBoxChange({ ...d.vb, x: d.vb.x - (dx / r.width) * d.vb.w, y: d.vb.y - (dy / r.height) * d.vb.h });
    }
  };
  const endDrag = () => {
    if (!drag.current) return;
    justDragged.current = drag.current.moved;
    drag.current = null;
    svgRef.current?.classList.remove('dragging');
  };
  const onClick = (e: MouseEvent<SVGSVGElement>) => {
    if (justDragged.current) { justDragged.current = false; return; }
    const target = e.target as Element;
    const st = target.closest<SVGElement>('[data-st]');
    const sg = target.closest<SVGElement>('[data-seg]');
    if (st?.dataset.st) onPick('station', st.dataset.st);
    else if (sg?.dataset.seg) onPick('segment', sg.dataset.seg);
    else if (sel) onClear();
  };

  // 지도 위에서 휠(스크롤)을 굴리면 커서 위치 기준으로 확대/축소. 트랙패드 핀치(ctrlKey)도 같은 경로.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      const r = svg.getBoundingClientRect();
      const cur = vbRef.current;
      const cx = cur.x + ((e.clientX - r.left) / r.width) * cur.w;
      const cy = cur.y + ((e.clientY - r.top) / r.height) * cur.h;
      // 마우스 휠은 한 칸(약 100px)에 약 16%, 핀치는 작은 delta가 연속으로 들어오므로 더 민감하게
      const dy = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
      const factor = Math.exp(clamp(dy, -120, 120) * (e.ctrlKey ? 0.01 : 0.0015));
      onViewBoxChange(zoomViewBox(cur, factor, cx, cy));
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [onViewBoxChange]);

  return (
    <div className="mapbox" ref={boxRef}>
      <svg
        ref={svgRef}
        id="map"
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        style={{ aspectRatio: `${MAP_W} / ${MAP_H}` }}
        role="group"
        aria-label="서울 지하철 무선망 노선도. 마우스 휠로 확대·축소, 드래그로 이동"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={onClick}
      >
        <g fill="none" strokeLinecap="round">{layers.halos}</g>
        <g fill="none" strokeLinecap="round">{layers.lines}</g>
        <g>{layers.hits}</g>
        <g>{layers.marks}</g>
        <g>{layers.stations}</g>
        <g>{layers.labels}</g>
      </svg>
      <div className="map-hint" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="6" y="2.5" width="12" height="19" rx="6" />
          <path d="M12 6.5v4" />
        </svg>
        <span><b>스크롤</b>로 확대·축소</span>
        <span className="sep" />
        <span><b>드래그</b>로 이동</span>
      </div>
      {sel && sel.type === 'station' && (
        <StationPopover
          stationId={sel.id}
          data={data}
          vb={vb}
          boxSize={size}
          onClose={onClear}
          onShowDetail={onShowDetail}
          onZoom={() => onZoomTo(sel.id)}
        />
      )}
    </div>
  );
}
