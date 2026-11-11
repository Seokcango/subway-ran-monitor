import { STATIONS, SEGS, SEG_BY_ID, LINE_BY_ID, stationLines, segName } from '../lib/network';
import { VOC_TYPES, TYPE_TOK, cssv, loadTok, LOAD_WARN, LOAD_CRIT } from '../lib/constants';
import type { ReactNode } from 'react';
import LoadTimeseriesChart from './charts/LoadTimeseriesChart';
import type { Alarm, LineId, Metric, MetricsData, Period, PickHandler, Selection, SelectionType, StationId, Tech } from '../types';

interface PanelProps {
  data: MetricsData;
  /** 'all' 또는 호선 id */
  line: LineId;
  sel: Selection | null;
  tech: Tech;
  period: Period;
  onPick: PickHandler;
  onAlarm: (alarm: Alarm) => void;
}

interface SidePanelProps extends PanelProps {
  metric: Metric;
}

interface RankItem {
  type: SelectionType;
  id: string;
  name: string;
  kind: string;
  v: number;
  lines: LineId[];
}

function LoadPanel({ data, line, sel, tech, period, onPick }: PanelProps) {
  const lineOn = (lid: LineId) => line === 'all' || line === lid;
  const stationOn = (id: StationId) => line === 'all' || stationLines[id].includes(line);
  const items: RankItem[] = [
    ...STATIONS.filter(stationOn).map((id): RankItem => ({ type: 'station', id, name: id, kind: '역사', v: data.st[id].load, lines: stationLines[id] })),
    ...SEGS.filter((s) => lineOn(s.line) && data.seg[s.id].load != null).map((s): RankItem => ({ type: 'segment', id: s.id, name: segName(s), kind: '터널', v: data.seg[s.id].load as number, lines: [s.line] })),
  ].sort((a, b) => b.v - a.v).slice(0, 5);

  const target = sel || (items[0] && { type: items[0].type, id: items[0].id });
  let chart: ReactNode = null;
  if (target) {
    const isSt = target.type === 'station';
    chart = (
      <LoadTimeseriesChart
        targetId={target.id}
        name={isSt ? target.id : segName(SEG_BY_ID[target.id])}
        kind={isSt ? '역사' : '터널'}
        peak={isSt ? data.st[target.id].load : data.seg[target.id].load}
        tech={tech}
        period={period}
      />
    );
  }

  return (
    <>
      <section>
        <h2>부하 높은 구간 TOP 5</h2>
        <div className="rows">
          {items.map((it, i) => (
            <button key={it.type + it.id} type="button" className="row" aria-current={!!(sel && sel.type === it.type && sel.id === it.id)} onClick={() => onPick(it.type, it.id, true)}>
              <span className="name">
                <span className="rank">{i + 1}</span>{it.name}{' '}
                <span className="sub">{it.kind} · {it.lines.map((l) => LINE_BY_ID[l].name).join('·')}</span>
              </span>
              <span className="val num">{it.v}%</span>
              <span className="bar">
                <i style={{ width: `${it.v}%`, background: cssv(loadTok(it.v)) }} />
                <span className="tick" style={{ left: `${LOAD_WARN}%` }} />
                <span className="tick" style={{ left: `${LOAD_CRIT}%` }} />
              </span>
            </button>
          ))}
        </div>
      </section>
      {chart}
    </>
  );
}

function VocPanel({ data, line, sel, onPick }: PanelProps) {
  const stationOn = (id: StationId) => line === 'all' || stationLines[id].includes(line);
  const top = STATIONS.filter(stationOn).map((id) => data.st[id]).sort((a, b) => b.voc - a.voc).slice(0, 5);
  const maxV = (top[0] && top[0].voc) || 1;
  const sum = [0, 0, 0, 0];
  STATIONS.filter(stationOn).forEach((id) => data.st[id].types.forEach((v, k) => { sum[k] += v; }));
  const tot = sum.reduce((a, b) => a + b, 0) || 1;

  return (
    <>
      <section>
        <h2>VOC 많은 역 TOP 5</h2>
        <div className="rows">
          {top.map((s, i) => {
            const mi = s.types.indexOf(Math.max(...s.types));
            return (
              <button key={s.id} type="button" className="row" aria-current={!!(sel && sel.type === 'station' && sel.id === s.id)} onClick={() => onPick('station', s.id, true)}>
                <span className="name"><span className="rank">{i + 1}</span>{s.id} <span className="sub">주요 유형 {VOC_TYPES[mi]}</span></span>
                <span className="val num">{s.voc.toLocaleString('ko-KR')}건</span>
                <span className="bar"><i style={{ width: `${((s.voc / maxV) * 100).toFixed(1)}%`, background: 'var(--accent)' }} /></span>
              </button>
            );
          })}
        </div>
      </section>
      <section>
        <h2>유형별 비율</h2>
        <div className="stack" role="img" aria-label={`VOC 유형별 비율: ${VOC_TYPES.map((t, k) => `${t} ${Math.round((sum[k] / tot) * 100)}%`).join(', ')}`}>
          {sum.map((v, k) => {
            const p = (v / tot) * 100;
            return <div key={k} style={{ width: `${p.toFixed(1)}%`, background: cssv(TYPE_TOK[k]) }}>{p >= 9 ? `${Math.round(p)}%` : ''}</div>;
          })}
        </div>
        <div className="legend" style={{ marginTop: 10 }}>
          {VOC_TYPES.map((t, k) => (
            <span key={t} className="it"><span className="dot sq" style={{ background: cssv(TYPE_TOK[k]) }} />{t} <span className="num">{sum[k].toLocaleString('ko-KR')}</span></span>
          ))}
        </div>
      </section>
    </>
  );
}

function AlarmPanel({ data, line, sel, onAlarm }: PanelProps) {
  const lineOn = (lid: LineId) => line === 'all' || line === lid;
  const stationOn = (id: StationId) => line === 'all' || stationLines[id].includes(line);
  const list = data.alarms.filter((x) => (x.seg ? lineOn(SEG_BY_ID[x.seg].line) : x.st != null && stationOn(x.st)));
  return (
    <>
      <section>
        <h2>미해제 알람 {list.length}건</h2>
        <div className="rows">
          {list.length === 0 && <p className="note">선택한 호선에 미해제 알람이 없습니다.</p>}
          {list.map((x) => (
            <button key={x.id} type="button" className="row" aria-current={!!(sel && sel.alarm === x.id)} onClick={() => onAlarm(x)}>
              <span className="name"><span className={`sev ${x.sev}`}>{x.sev}</span>{x.where}</span>
              <span className="val num">11-10 {x.at}</span>
              <span className="sub full">{x.eq}{x.seg ? ' · 터널 중계기' : ''} · 발생 후 미해제</span>
            </button>
          ))}
        </div>
      </section>
      <p className="note">알람을 누르면 해당 역으로 지도가 이동하고, 같은 시간대의 VOC·부하율이 함께 표시됩니다.</p>
    </>
  );
}

// PRD 6.3~6.5: 지표에 따라 오른쪽 패널 내용이 바뀐다.
export default function SidePanel({ metric, ...props }: SidePanelProps) {
  if (metric === 'load') return <LoadPanel {...props} />;
  if (metric === 'voc') return <VocPanel {...props} />;
  return <AlarmPanel {...props} />;
}
