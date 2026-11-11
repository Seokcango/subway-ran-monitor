// 노선 마스터에서 지도 렌더링에 필요한 구조를 만든다.
import { COORDS, LINES, CODE } from '../data/network';
import type { Line, LineId, Point, Segment, SegmentId, StationId, ViewBox } from '../types';

export const LINE_BY_ID: Record<LineId, Line> = {};
export const stationLines: Record<StationId, LineId[]> = {}; // 역 이름 → 지나는 호선 id 목록
export const SEGS: Segment[] = []; // 역간 터널 구간
export const SEG_BY_ID: Record<SegmentId, Segment> = {};

LINES.forEach((l) => {
  LINE_BY_ID[l.id] = l;
  l.br.forEach((b) => {
    b.forEach((s) => {
      if (!COORDS[s]) throw new Error(`좌표 없음: ${s}`);
      const arr = (stationLines[s] = stationLines[s] || []);
      if (!arr.includes(l.id)) arr.push(l.id);
    });
    for (let i = 0; i < b.length - 1; i++) {
      const id = `${l.id}:${b[i]}-${b[i + 1]}`;
      if (SEG_BY_ID[id]) continue;
      const sg: Segment = {
        id,
        line: l.id,
        a: b[i],
        b: b[i + 1],
        rep: `REP-T-${String(SEGS.length + 1).padStart(3, '0')}`,
        par: 0,
        flip: false,
      };
      SEGS.push(sg);
      SEG_BY_ID[id] = sg;
    }
  });
});

export const STATIONS: StationId[] = Object.keys(stationLines);
export const STATION_CODE: Record<StationId, string> = { ...CODE };
STATIONS.forEach((s, i) => {
  if (!STATION_CODE[s]) STATION_CODE[s] = `S${String(i + 1).padStart(3, '0')}`;
});

// 같은 두 역을 지나는 다른 노선은 나란히 그리기 위해 순번을 매긴다.
const pairCount: Record<string, number> = {};
const pairIdx: Record<string, number> = {};
const pairKey = (s: Segment) => [s.a, s.b].sort().join('|');
SEGS.forEach((s) => { pairCount[pairKey(s)] = (pairCount[pairKey(s)] || 0) + 1; });
SEGS.forEach((s) => {
  const k = pairKey(s);
  pairIdx[k] = pairIdx[k] || 0;
  s.par = pairIdx[k] - (pairCount[k] - 1) / 2;
  s.flip = s.a > s.b;
  pairIdx[k]++;
});

// 투영: 경도·위도 → 지도 좌표 (위도 방향 1.26배 보정, 서울 위도 기준)
let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
STATIONS.forEach((s) => {
  const [lat, lon] = COORDS[s];
  minLon = Math.min(minLon, lon); maxLon = Math.max(maxLon, lon);
  minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
});
const PAD = 40;
export const MAP_W = 1000;
const K = (MAP_W - PAD * 2) / (maxLon - minLon);
export const MAP_H = Math.round((maxLat - minLat) * K * 1.26 + PAD * 2);
export const BASE_VB: ViewBox = { x: 0, y: 0, w: MAP_W, h: MAP_H };

export const POS: Record<StationId, Point> = {};
STATIONS.forEach((s) => {
  const [lat, lon] = COORDS[s];
  POS[s] = [PAD + (lon - minLon) * K, PAD + (maxLat - lat) * K * 1.26];
});

export const segName = (s: Pick<Segment, 'a' | 'b'>): string => `${s.a}–${s.b}`;
export { LINES };
