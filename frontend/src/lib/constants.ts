import type { CssToken, Metric, Period, Severity, Tech } from '../types';

export const TECHS: readonly Tech[] = ['5G', 'LTE'];
export const METRICS: readonly Metric[] = ['voc', 'load', 'alarm'];
export const PERIODS: readonly Period[] = ['24h', '7d', '30d'];

export const TECH_LABEL: Record<Tech, string> = { '5G': '5G', LTE: 'LTE' };
export const METRIC_LABEL: Record<Metric, string> = { voc: 'VOC', load: '부하율', alarm: '장비알람' };
export const PERIOD_LABEL: Record<Period, string> = { '24h': '최근 24시간', '7d': '최근 7일', '30d': '최근 30일' };
export const PERIOD_SHORT: Record<Period, string> = { '24h': '24시간', '7d': '7일', '30d': '30일' };

export const VOC_TYPES = ['속도저하', '끊김', '접속불가', '기타'] as const;
export const TYPE_TOK: readonly CssToken[] = ['--t1', '--t2', '--t3', '--t4'];

export const SEV_RANK: Record<Severity, number> = { Critical: 0, Major: 1, Minor: 2 };
export const SEV_TOK: Record<Severity, CssToken> = { Critical: '--crit', Major: '--major', Minor: '--warn' };

// PRD 7.2 기준: 70% 이상 주의, 85% 이상 위험
export const LOAD_WARN = 70;
export const LOAD_CRIT = 85;

export const cssv = (t: CssToken): string => `var(${t})`;
export const loadTok = (v: number | null | undefined): CssToken =>
  v == null ? '--nodata' : v >= LOAD_CRIT ? '--crit' : v >= LOAD_WARN ? '--warn' : '--ok';
export const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));

export function worstSev(list: readonly { sev: Severity }[]): Severity | null {
  let w: Severity | null = null;
  list.forEach((a) => { if (!w || SEV_RANK[a.sev] < SEV_RANK[w]) w = a.sev; });
  return w;
}
