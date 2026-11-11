import { SEG_BY_ID } from './network';
import type { Alarm, MetricsData, StationId } from '../types';

// 역 자체 장비 알람 + 역에 붙은 앞뒤 터널 구간 알람
export function stationAlarms(data: MetricsData, id: StationId): Alarm[] {
  return data.alarms.filter((a) => a.st === id || (a.seg && (SEG_BY_ID[a.seg].a === id || SEG_BY_ID[a.seg].b === id)));
}
