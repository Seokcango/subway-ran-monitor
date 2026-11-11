// 가상 데이터 생성기 (백엔드가 생기기 전까지 API 응답 대신 사용).
// 같은 기술·기간이면 항상 같은 값이 나오도록 시드 고정 난수를 쓴다.
import { HOT } from './network';
import { STATIONS, SEGS, SEG_BY_ID, STATION_CODE, segName } from '../lib/network';
import { SEV_RANK, clamp } from '../lib/constants';
import type { Alarm, EquipmentRow, MetricsData, Period, SegmentId, SegmentMetrics, Severity, StationMetrics, Tech, TimeseriesPoint } from '../types';

type RawAlarm =
  | { id: string; sev: Severity; at: string; st: string; eq: string; seg?: undefined }
  | { id: string; sev: Severity; at: string; seg: SegmentId; st?: undefined; eq?: undefined };

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed: number): () => number {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ALARMS: Record<Tech, RawAlarm[]> = {
  '5G': [
    { id: 'A-0001', sev: 'Critical', st: '혜화', eq: 'RU-HH-03', at: '21:42' },
    { id: 'A-0002', sev: 'Critical', seg: '4:혜화-동대문', at: '21:40' },
    { id: 'A-0003', sev: 'Major', st: '동대문역사문화공원', eq: 'DU-DDP-01', at: '20:15' },
    { id: 'A-0006', sev: 'Major', st: '강남', eq: 'RU-GN-02', at: '20:55' },
    { id: 'A-0005', sev: 'Major', seg: '3:을지로3가-충무로', at: '18:30' },
    { id: 'A-0004', sev: 'Minor', st: '종로3가', eq: 'RU-JR3-01', at: '19:05' },
  ],
  LTE: [
    { id: 'A-0101', sev: 'Critical', st: '왕십리', eq: 'DU-WSR-01', at: '21:10' },
    { id: 'A-0105', sev: 'Critical', st: '신림', eq: 'RU-SLM-03', at: '21:25' },
    { id: 'A-0102', sev: 'Major', st: '서울역', eq: 'RU-SEO-02', at: '20:48' },
    { id: 'A-0104', sev: 'Minor', st: '시청', eq: 'RU-CHG-01', at: '16:05' },
    { id: 'A-0103', sev: 'Minor', seg: '2:을지로입구-을지로3가', at: '17:22' },
  ],
};
// 측정값이 빠진 구간 (PRD 5. 에러 처리: 지도에서 회색 표시, 집계 제외)
const MISSING: Record<Tech, Record<SegmentId, boolean>> = { '5G': { '4:혜화-동대문': true }, LTE: {} };
const PROFILE = [0.35, 0.25, 0.2, 0.18, 0.2, 0.35, 0.6, 0.9, 1, 0.75, 0.62, 0.6, 0.65, 0.62, 0.6, 0.66, 0.78, 0.92, 0.98, 1, 0.95, 0.86, 0.7, 0.5];

const cache: Record<string, MetricsData> = {};

export function mockMetrics(tech: Tech, period: Period): MetricsData {
  const key = tech + period;
  if (cache[key]) return cache[key];
  const r = rng(hashStr(key));
  const pAdj = { '24h': 0, '7d': -3, '30d': -5 }[period];
  const tAdj = tech === 'LTE' ? 4 : 0;
  const vScale = { '24h': 16, '7d': 84, '30d': 310 }[period] * (tech === 'LTE' ? 1.25 : 1);
  const st: Record<string, StationMetrics> = {};
  const seg: Record<SegmentId, SegmentMetrics> = {};
  const eq: EquipmentRow[] = [];

  STATIONS.forEach((id) => {
    let hot = HOT[id] != null ? HOT[id] : 0.22 + r() * 0.3;
    if (tech === 'LTE' && (id === '왕십리' || id === '신림')) hot += 0.2;
    const load = clamp(Math.round(40 + hot * 46 + (r() - 0.5) * 10 + pAdj + tAdj), 12, 99);
    const voc = Math.max(0, Math.round(hot * hot * vScale * (0.7 + r() * 0.6)));
    const w = [r() + 0.6, r() + 0.4, r() * 0.6 + 0.2, r() * 0.4 + 0.1];
    if (tech === '5G' && id === '혜화') w[1] += 1.4;
    const sw = w.reduce((a, b) => a + b, 0);
    const types = w.map((x) => Math.round((voc * x) / sw));
    types[3] = Math.max(0, voc - types[0] - types[1] - types[2]);
    const cd = STATION_CODE[id];
    const equip = [
      { id: `RU-${cd}-01`, loc: '대합실 B1', load: clamp(load - Math.round(4 + r() * 14), 5, 99) },
      { id: `RU-${cd}-02`, loc: '승강장 B2', load: clamp(load - Math.round(1 + r() * 9), 5, 99) },
      { id: `RU-${cd}-03`, loc: '승강장 B2', load },
      { id: `DU-${cd}-01`, loc: '통신실', load: clamp(load - Math.round(10 + r() * 15), 5, 99) },
    ];
    equip.forEach((e) => eq.push({ ...e, station: id }));
    // 역 부하율 = 소속 장비 부하율의 최대값 (PRD 7.3 초안)
    st[id] = { id, load, voc, types, equip };
  });

  SEGS.forEach((s) => {
    const v = MISSING[tech][s.id] ? null : clamp(Math.round((st[s.a].load + st[s.b].load) / 2 + (r() - 0.5) * 18), 10, 99);
    seg[s.id] = { id: s.id, load: v, rep: s.rep, dist: (0.4 + r() * 0.8).toFixed(1) };
    eq.push({ id: s.rep, loc: `터널 ${segName(s)}`, load: v, seg: s.id });
  });

  const alarms: Alarm[] = ALARMS[tech]
    .map((a): Alarm => {
      if (a.seg != null) {
        const s = SEG_BY_ID[a.seg];
        return { ...a, eq: s.rep, where: `${segName(s)} 터널`, focus: s.a };
      }
      return { ...a, where: a.st + (a.eq.startsWith('DU') ? ' 통신실' : ''), focus: a.st };
    })
    .sort((a, b) => SEV_RANK[a.sev] - SEV_RANK[b.sev] || (a.at < b.at ? 1 : -1));

  const eqSev: Record<string, Severity> = {};
  alarms.forEach((a) => { if (!eqSev[a.eq] || SEV_RANK[a.sev] < SEV_RANK[eqSev[a.eq]]) eqSev[a.eq] = a.sev; });

  return (cache[key] = { st, seg, eq, alarms, eqSev });
}

export function mockTimeseries(targetId: string, peak: number | null, tech: Tech, period: Period): TimeseriesPoint[] | null {
  if (peak == null) return null;
  const r = rng(hashStr(targetId + tech + period + 'h'));
  return PROFILE.map((p, hour) => ({ hour, load: clamp(Math.round(peak * p * (0.93 + r() * 0.07)), 0, 100) }));
}
