import { useEffect, useMemo, useState } from 'react';
import { STATIONS, SEG_BY_ID, stationLines } from '../lib/network';
import { METRIC_LABEL, METRICS, SEV_RANK, cssv, loadTok, worstSev } from '../lib/constants';
import LineBadge from './LineBadge';
import type { Alarm, LineId, Metric, MetricsData, Selection, Severity, StationId } from '../types';

interface TopStationsProps {
  data: MetricsData;
  metric: Metric;
  line: LineId;
  sel: Selection | null;
  onSelect: (id: StationId) => void;
}

interface Row {
  id: StationId;
  voc: number;
  load: number;
  alarms: Alarm[];
  sev: Severity | null;
}

// 역 기준으로 볼 알람: 역 장비 알람 + 그 역에 닿은 터널 구간 알람
function stationAlarms(data: MetricsData, id: StationId): Alarm[] {
  return data.alarms.filter((a) => a.st === id || (a.seg && (SEG_BY_ID[a.seg].a === id || SEG_BY_ID[a.seg].b === id)));
}

const SORT: Record<Metric, (a: Row, b: Row) => number> = {
  voc: (a, b) => b.voc - a.voc,
  load: (a, b) => b.load - a.load,
  alarm: (a, b) =>
    (a.sev ? SEV_RANK[a.sev] : 9) - (b.sev ? SEV_RANK[b.sev] : 9) || b.alarms.length - a.alarms.length || b.load - a.load,
};

// 역 TOP 10: VOC · 부하율 · 알람을 한 줄에 함께 본다. 정렬 기준은 지표 선택을 따르고, 표에서 바꿀 수도 있다.
export default function TopStations({ data, metric, line, sel, onSelect }: TopStationsProps) {
  const [sortBy, setSortBy] = useState<Metric>(metric);
  useEffect(() => setSortBy(metric), [metric]);

  const rows = useMemo(() => {
    const ids = STATIONS.filter((id) => line === 'all' || stationLines[id].includes(line));
    const maxVoc = Math.max(1, ...ids.map((id) => data.st[id].voc));
    const list = ids.map((id): Row => {
      const alarms = stationAlarms(data, id);
      return { id, voc: data.st[id].voc, load: data.st[id].load, alarms, sev: worstSev(alarms) };
    });
    return { top: list.sort(SORT[sortBy]).slice(0, 10), maxVoc };
  }, [data, line, sortBy]);

  return (
    <section className="top10" aria-labelledby="top10-title">
      <div className="top10-head">
        <h2 id="top10-title">
          역 TOP 10 <span className="h2-sub">{METRIC_LABEL[sortBy]} 순{line !== 'all' ? ' · 선택한 호선' : ''}</span>
        </h2>
        <div className="seg sm" role="group" aria-label="정렬 기준">
          {METRICS.map((m) => (
            <button key={m} type="button" aria-pressed={sortBy === m} onClick={() => setSortBy(m)}>{METRIC_LABEL[m]}</button>
          ))}
        </div>
      </div>
      <div className="tbl">
        <table>
          <thead>
            <tr>
              <th className="r">#</th>
              <th>역</th>
              <th>호선</th>
              <th className={sortBy === 'voc' ? 'on' : undefined}>VOC</th>
              <th className={sortBy === 'load' ? 'on' : undefined}>부하율</th>
              <th className={sortBy === 'alarm' ? 'on' : undefined}>미해제 알람</th>
            </tr>
          </thead>
          <tbody>
            {rows.top.map((r, i) => (
              <tr
                key={r.id}
                className="top10-row"
                aria-current={!!(sel && sel.type === 'station' && sel.id === r.id)}
                tabIndex={0}
                onClick={() => onSelect(r.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(r.id); } }}
              >
                <td className="r num rank">{i + 1}</td>
                <td className="top10-name">{r.id}</td>
                <td><span className="lines">{stationLines[r.id].map((l) => <LineBadge key={l} lineId={l} />)}</span></td>
                <td>
                  <span className="cell-bar">
                    <span className="num">{r.voc.toLocaleString('ko-KR')}건</span>
                    <span className="bar"><i style={{ width: `${(r.voc / rows.maxVoc) * 100}%`, background: 'var(--accent)' }} /></span>
                  </span>
                </td>
                <td>
                  <span className="cell-bar">
                    <span className="num" style={{ color: r.load >= 70 ? cssv(loadTok(r.load)) : undefined, fontWeight: 700 }}>{r.load}%</span>
                    <span className="bar"><i style={{ width: `${r.load}%`, background: cssv(loadTok(r.load)) }} /></span>
                  </span>
                </td>
                <td>
                  {r.sev ? (
                    <span className="st-badge"><span className={`sev sm ${r.sev}`}>{r.sev}</span><span className="num">{r.alarms.length}건</span></span>
                  ) : (
                    <span className="muted">없음</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="note">행을 누르면 지도가 그 역으로 이동합니다. 알람은 역 장비와 역에 닿은 터널 구간 알람을 합친 건수입니다.</p>
    </section>
  );
}
