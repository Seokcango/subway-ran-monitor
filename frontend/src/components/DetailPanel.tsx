import { forwardRef, useState, type ReactNode } from 'react';
import { SEGS, SEG_BY_ID, stationLines, segName } from '../lib/network';
import { SEV_TOK, cssv, loadTok } from '../lib/constants';
import { stationAlarms } from '../lib/selectors';
import LineBadge from './LineBadge';
import type { MetricsData, Period, PickHandler, Selection } from '../types';

interface EqRowProps {
  data: MetricsData;
  id: string;
  loc: string;
  load: number | null;
}

interface FactProps {
  k: string;
  v: string;
  color?: string;
  small?: boolean;
}

interface DetailPanelProps {
  data: MetricsData;
  sel: Selection | null;
  period: Period;
  onClose: () => void;
  onPick: PickHandler;
}

function EqRow({ data, id, loc, load }: EqRowProps) {
  const sev = data.eqSev[id];
  const tok = sev ? SEV_TOK[sev] : '--ok';
  return (
    <tr>
      <td className="num">{id}</td>
      <td>{loc}</td>
      <td className="r num" style={{ color: cssv(loadTok(load)) }}>{load == null ? '—' : `${load}%`}</td>
      <td><span className="st-badge" style={{ color: cssv(tok) }}><span className="dot" style={{ background: cssv(tok) }} />{sev || '정상'}</span></td>
    </tr>
  );
}

function Fact({ k, v, color, small }: FactProps) {
  return (
    <div className="fact">
      <div className="k">{k}</div>
      <div className="v num" style={{ color, fontSize: small ? 15 : undefined }}>{v}</div>
    </div>
  );
}

// 선택한 역 또는 터널 구간의 장비 현황 (역 상세 화면 ⑤로 가기 전 미리보기)
const DetailPanel = forwardRef<HTMLElement, DetailPanelProps>(function DetailPanel({ data, sel, period, onClose, onPick }, ref) {
  const [notice, setNotice] = useState(false);
  if (!sel) return null;

  if (sel.type === 'segment') {
    const s = SEG_BY_ID[sel.id];
    const sg = data.seg[s.id];
    const sal = data.alarms.filter((a) => a.seg === s.id);
    return (
      <section className="detail" ref={ref} aria-live="polite">
        <div className="detail-head">
          <div>
            <div className="lines"><LineBadge lineId={s.line} /><span className="h2-sub">터널 구간</span></div>
            <h2>{segName(s)}</h2>
          </div>
          <button type="button" className="x" onClick={onClose} aria-label="상세 닫기">×</button>
        </div>
        <div className="facts">
          <Fact k="부하율" v={sg.load == null ? '—' : `${sg.load}%`} color={cssv(loadTok(sg.load))} />
          <Fact k="중계기" v={sg.rep} small />
          <Fact k="미해제 알람" v={`${sal.length}건`} color={sal.length ? 'var(--crit)' : undefined} />
        </div>
        {sg.load == null && <div className="insight"><b>측정값 없음</b> — 집계에서 제외됨. 중계기 {sg.rep} 상태를 확인하세요.</div>}
        <div className="chips">
          <button type="button" className="chip" onClick={() => onPick('station', s.a, true)}>{s.a} 보기</button>
          <button type="button" className="chip" onClick={() => onPick('station', s.b, true)}>{s.b} 보기</button>
        </div>
      </section>
    );
  }

  const id = sel.id;
  const sd = data.st[id];
  const adj = SEGS.filter((s) => s.a === id || s.b === id);
  const al = stationAlarms(data, id);
  let insight: ReactNode = null;
  if (al.length && sd.voc > 0) {
    const first = al.map((a) => a.at).sort()[0];
    let n = Math.max(1, Math.min(sd.voc, Math.round(sd.voc * 0.35)));
    if (period !== '24h') n = Math.max(1, Math.round(n / 6));
    insight = (
      <div className="insight">
        <b>{first} 이후 VOC {n}건 집중</b> → {al.map((a) => a.eq).join(' · ')} 알람과 시간대 일치
      </div>
    );
  }

  return (
    <section className="detail" ref={ref} aria-live="polite">
      <div className="detail-head">
        <div>
          <div className="lines">{stationLines[id].map((l) => <LineBadge key={l} lineId={l} />)}</div>
          <h2>{id}</h2>
        </div>
        <button type="button" className="x" onClick={onClose} aria-label="상세 닫기">×</button>
      </div>
      <div className="facts">
        <Fact k="부하율 (최대)" v={`${sd.load}%`} color={cssv(loadTok(sd.load))} />
        <Fact k="VOC" v={`${sd.voc}건`} />
        <Fact k="미해제 알람" v={`${al.length}건`} color={al.length ? 'var(--crit)' : undefined} />
      </div>
      {insight}
      <div className="tbl">
        <table>
          <thead><tr><th>장비ID</th><th>위치</th><th className="r">부하율</th><th>상태</th></tr></thead>
          <tbody>
            {sd.equip.map((e) => <EqRow key={e.id} data={data} id={e.id} loc={e.loc} load={e.load} />)}
            {adj.map((s) => {
              const sg = data.seg[s.id];
              return <EqRow key={sg.rep} data={data} id={sg.rep} loc={`터널 ${segName(s)} · ${sg.dist}km`} load={sg.load} />;
            })}
          </tbody>
        </table>
      </div>
      <button type="button" className="linkbtn" onClick={() => setNotice(true)}>
        {notice ? '역 상세 화면(⑤)은 다음 단계에서 연결됩니다' : '역 상세 화면으로 (역사 구조도)'}
      </button>
    </section>
  );
});

export default DetailPanel;
