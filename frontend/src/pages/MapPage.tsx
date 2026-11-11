import { useCallback, useEffect, useRef, useState } from 'react';
import TopBar from '../components/TopBar';
import SummaryBar from '../components/SummaryBar';
import LineFilter from '../components/LineFilter';
import SubwayMap from '../components/SubwayMap';
import Legend from '../components/Legend';
import SidePanel from '../components/SidePanel';
import DetailPanel from '../components/DetailPanel';
import { useUrlState } from '../hooks/useUrlState';
import { useMetrics } from '../hooks/useMetrics';
import { BASE_VB, SEG_BY_ID } from '../lib/network';
import { zoomViewBox, focusViewBox } from '../lib/viewbox';
import type { Alarm, LineId, PickHandler, Selection, ViewBox, ViewParams } from '../types';

const AS_OF = '2026-11-10 22:00';

// 화면 ①~④: 하나의 노선도에서 기술·지표·기간만 바꿔 본다.
export default function MapPage() {
  const [{ tech, metric, period }, setParam] = useUrlState();
  const { data, error, loading, retry } = useMetrics(tech, period);
  const [line, setLine] = useState<LineId>('all');
  const [sel, setSel] = useState<Selection | null>(null);
  const [vb, setVb] = useState<ViewBox>(BASE_VB);
  const detailRef = useRef<HTMLElement>(null);

  const onChange = <K extends keyof ViewParams>(key: K, value: ViewParams[K]) => {
    if (key === 'metric' && sel && sel.alarm) setSel(null);
    setParam(key, value);
  };

  const pick = useCallback<PickHandler>((type, id, focus) => {
    setSel({ type, id });
    if (focus) setVb((v) => focusViewBox(v, type === 'station' ? id : SEG_BY_ID[id].a));
  }, []);
  const clear = useCallback(() => setSel(null), []);

  const pickAlarm = (a: Alarm) => {
    setSel(a.seg ? { type: 'segment', id: a.seg, alarm: a.id } : { type: 'station', id: a.focus, alarm: a.id });
    setVb((v) => focusViewBox(v, a.focus));
  };

  const showDetail = () => {
    const el = detailRef.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    const btn = el.querySelector<HTMLButtonElement>('button');
    if (btn) btn.focus({ preventScroll: true });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSel(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="wrap">
      <TopBar tech={tech} metric={metric} period={period} onChange={onChange} asOf={AS_OF} />

      {error && (
        <div className="error" role="alert">
          데이터를 불러오지 못했습니다. ({error.message})
          <button type="button" onClick={retry}>다시 시도</button>
        </div>
      )}

      {!data ? (
        <p className="note">{loading ? '노선도 데이터를 불러오는 중…' : ''}</p>
      ) : (
        <>
          <SummaryBar data={data} period={period} />
          <div className="main" aria-busy={loading}>
            <section className="mapcol" aria-label="노선도">
              <div className="mapbar">
                <LineFilter value={line} onChange={setLine} />
                <div className="zoom">
                  <button type="button" aria-label="확대" onClick={() => setVb((v) => zoomViewBox(v, 0.7))}>+</button>
                  <button type="button" aria-label="축소" onClick={() => setVb((v) => zoomViewBox(v, 1 / 0.7))}>−</button>
                  <button type="button" aria-label="전체 보기" onClick={() => setVb(BASE_VB)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
                    </svg>
                  </button>
                </div>
              </div>
              <SubwayMap
                data={data}
                metric={metric}
                line={line}
                sel={sel}
                vb={vb}
                onViewBoxChange={setVb}
                onPick={pick}
                onClear={clear}
                onShowDetail={showDetail}
                onZoomTo={(id) => setVb((v) => focusViewBox(v, id, 300))}
              />
              <Legend metric={metric} />
              <p className="note">
                가상 데이터 · 서울 시내 구간 1–9호선과 주요 광역 노선 · 노선 순서와 색은 실제 기준, 역 좌표는 근사값(공공데이터 적재 시 교체).
                역을 누르면 정보 카드가 열립니다. 드래그로 이동, Ctrl+휠 또는 버튼으로 확대하면 모든 역 이름이 보입니다.
              </p>
            </section>

            <aside>
              <DetailPanel key={sel ? sel.type + sel.id : 'none'} ref={detailRef} data={data} sel={sel} period={period} onClose={clear} onPick={pick} />
              <SidePanel metric={metric} data={data} line={line} sel={sel} tech={tech} period={period} onPick={pick} onAlarm={pickAlarm} />
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
