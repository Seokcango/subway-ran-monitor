import { STATIONS } from '../lib/network';
import { PERIOD_LABEL, LOAD_CRIT } from '../lib/constants';
import type { MetricsData, Period } from '../types';

interface KpiProps {
  k: string;
  v: string;
  s: string;
  crit?: boolean;
}

function Kpi({ k, v, s, crit }: KpiProps) {
  return (
    <div className="kpi">
      <span className="k">{k}</span>
      <span className={`v num${crit ? ' crit' : ''}`}>{v}</span>
      <span className="s">{s}</span>
    </div>
  );
}

// PRD 6.2 오른쪽 요약 패널 수치: VOC 건수, 부하율 85% 이상 역 수, 미해제 알람, 관리 장비 수
export default function SummaryBar({ data, period }: { data: MetricsData; period: Period }) {
  const voc = STATIONS.reduce((a, id) => a + data.st[id].voc, 0);
  const hot = STATIONS.filter((id) => data.st[id].load >= LOAD_CRIT).length;
  const crit = data.alarms.filter((a) => a.sev === 'Critical').length;
  let ru = 0, du = 0, rep = 0;
  data.eq.forEach((e) => {
    if (e.id.startsWith('RU')) ru++;
    else if (e.id.startsWith('DU')) du++;
    else rep++;
  });
  return (
    <section className="kpis" aria-label="전체 요약">
      <Kpi k="VOC 건수" v={`${voc.toLocaleString('ko-KR')}건`} s={PERIOD_LABEL[period]} />
      <Kpi k="부하율 85% 이상 역" v={`${hot}개`} s={`전체 ${STATIONS.length}개 역 중`} />
      <Kpi k="미해제 알람" v={`${data.alarms.length}건`} s={`Critical ${crit}건`} crit={crit > 0} />
      <Kpi k="관리 장비" v={`${(ru + du + rep).toLocaleString('ko-KR')}대`} s={`RU ${ru} · DU ${du} · 중계기 ${rep}`} />
    </section>
  );
}
