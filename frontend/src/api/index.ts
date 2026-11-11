// 화면이 쓰는 데이터 함수. 지금은 가상 데이터(mock)를 돌려주고,
// 백엔드(PRD 6.8)가 생기면 USE_MOCK을 false로 바꿔 실제 API를 호출한다.
import { mockMetrics, mockTimeseries } from '../data/mock';
import type { MetricsData, Period, Tech, TimeseriesPoint } from '../types';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
const delay = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

async function http<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

/**
 * 지표 화면 데이터 한 묶음.
 * 실제 API: GET /api/summary, /api/voc, /api/load, /api/alarms?status=open (tech, period)
 * 응답 형태: { st: {역: {load, voc, types, equip}}, seg: {구간id: {load, rep, dist}}, eq: [...], alarms: [...], eqSev: {} }
 */
export async function getMetrics(tech: Tech, period: Period): Promise<MetricsData> {
  if (USE_MOCK) {
    await delay(120);
    return mockMetrics(tech, period);
  }
  const q = `tech=${encodeURIComponent(tech)}&period=${encodeURIComponent(period)}`;
  return http<MetricsData>(`/api/metrics?${q}`);
}

/**
 * 시간대별 부하율.
 * 실제 API: GET /api/load/timeseries?target_id&tech&period
 */
export async function getLoadTimeseries(
  targetId: string,
  peak: number | null,
  tech: Tech,
  period: Period,
): Promise<TimeseriesPoint[] | null> {
  if (USE_MOCK) return mockTimeseries(targetId, peak, tech, period);
  const q = `target_id=${encodeURIComponent(targetId)}&tech=${encodeURIComponent(tech)}&period=${encodeURIComponent(period)}`;
  return http<TimeseriesPoint[]>(`/api/load/timeseries?${q}`);
}
