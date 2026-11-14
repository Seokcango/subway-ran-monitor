// 사용자가 올린 CSV/JSON 파일을 지표 데이터 덮어쓰기(patch)로 바꾼다.
// 기술·기간을 바꿔도 같은 patch가 새 기본 데이터 위에 다시 적용된다.
import { SEG_BY_ID, stationLines } from './network';
import { clamp } from './constants';
import type { Alarm, MetricsData, SegmentId, StationId } from '../types';

export interface DataPatch {
  st: Record<StationId, { load?: number; voc?: number }>;
  seg: Record<SegmentId, { load: number | null }>;
  alarms?: Alarm[];
}

export interface UploadResult {
  patch: DataPatch;
  applied: number;
  skipped: string[];
}

export const SAMPLE_CSV = 'id,load,voc\n강남,92,140\n홍대입구,78,95\n2:역삼-강남,88,\n';

const toNum = (v: unknown): number | undefined => {
  if (v == null || v === '') return undefined;
  const n = Number(String(v).replace('%', '').trim());
  return Number.isFinite(n) ? n : undefined;
};

function addRow(r: UploadResult, id: string, load: unknown, voc: unknown) {
  const key = id.trim();
  if (!key) return;
  const l = toNum(load), v = toNum(voc);
  if (SEG_BY_ID[key]) {
    if (l === undefined) { r.skipped.push(key); return; }
    r.patch.seg[key] = { load: clamp(l, 0, 100) };
  } else if (stationLines[key]) {
    if (l === undefined && v === undefined) { r.skipped.push(key); return; }
    r.patch.st[key] = {
      ...(l !== undefined && { load: clamp(Math.round(l), 0, 100) }),
      ...(v !== undefined && { voc: Math.max(0, Math.round(v)) }),
    };
  } else { r.skipped.push(key); return; }
  r.applied++;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

const ID_COLS = ['id', 'station', '역', '역명', '구간'];
const LOAD_COLS = ['load', '부하율', '부하'];
const VOC_COLS = ['voc', '민원'];

function parseCsv(text: string): UploadResult {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) throw new Error('CSV에 머리글과 데이터 행이 필요합니다');
  const head = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const find = (names: string[]) => head.findIndex((h) => names.includes(h));
  const iId = find(ID_COLS), iLoad = find(LOAD_COLS), iVoc = find(VOC_COLS);
  if (iId < 0) throw new Error('CSV 머리글에 id(또는 역) 열이 없습니다');
  if (iLoad < 0 && iVoc < 0) throw new Error('CSV 머리글에 load 또는 voc 열이 없습니다');
  const r: UploadResult = { patch: { st: {}, seg: {} }, applied: 0, skipped: [] };
  lines.slice(1).forEach((l) => {
    const c = splitCsvLine(l);
    addRow(r, c[iId] ?? '', iLoad >= 0 ? c[iLoad] : undefined, iVoc >= 0 ? c[iVoc] : undefined);
  });
  return r;
}

function parseJson(text: string): UploadResult {
  let obj: unknown;
  try { obj = JSON.parse(text); } catch { throw new Error('JSON 형식이 올바르지 않습니다'); }
  const r: UploadResult = { patch: { st: {}, seg: {} }, applied: 0, skipped: [] };
  if (Array.isArray(obj)) {
    obj.forEach((o: Record<string, unknown>) => addRow(r, String(o.id ?? o.station ?? ''), o.load, o.voc));
    return r;
  }
  if (!obj || typeof obj !== 'object') throw new Error('JSON은 객체 또는 배열이어야 합니다');
  const o = obj as Partial<Record<'st' | 'seg' | 'alarms', unknown>>;
  if (o.st && typeof o.st === 'object') {
    Object.entries(o.st as Record<string, { load?: unknown; voc?: unknown }>).forEach(([id, v]) => addRow(r, id, v?.load, v?.voc));
  }
  if (o.seg && typeof o.seg === 'object') {
    Object.entries(o.seg as Record<string, { load?: unknown }>).forEach(([id, v]) => addRow(r, id, v?.load, undefined));
  }
  if (Array.isArray(o.alarms)) {
    r.patch.alarms = (o.alarms as Alarm[]).filter((a) => a && a.id && a.sev && a.focus && stationLines[a.focus]);
    r.applied += r.patch.alarms.length;
  }
  if (!o.st && !o.seg && !o.alarms) throw new Error('JSON에 st, seg, alarms 중 하나가 필요합니다');
  return r;
}

export async function parseUpload(file: File): Promise<UploadResult> {
  const text = await file.text();
  const isJson = /\.json$/i.test(file.name) || /^\s*[[{]/.test(text);
  const r = isJson ? parseJson(text) : parseCsv(text);
  if (r.applied === 0) throw new Error('노선도에 반영할 수 있는 행이 없습니다 (역 이름·구간 id를 확인하세요)');
  return r;
}

export function applyPatch(base: MetricsData, p: DataPatch): MetricsData {
  const st = { ...base.st };
  Object.entries(p.st).forEach(([id, v]) => { if (st[id]) st[id] = { ...st[id], ...v }; });
  const seg = { ...base.seg };
  Object.entries(p.seg).forEach(([id, v]) => { if (seg[id]) seg[id] = { ...seg[id], ...v }; });
  return { ...base, st, seg, alarms: p.alarms ?? base.alarms };
}
