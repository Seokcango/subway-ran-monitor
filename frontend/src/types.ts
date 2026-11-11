// 화면 전체에서 쓰는 도메인 타입. 백엔드 API 응답 형태도 이 타입을 따른다.

export type Tech = '5G' | 'LTE';
export type Metric = 'voc' | 'load' | 'alarm';
export type Period = '24h' | '7d' | '30d';
export type Severity = 'Critical' | 'Major' | 'Minor';

/** CSS 변수 이름 (예: '--crit') */
export type CssToken = `--${string}`;

/** 역 이름 (노선 마스터의 키) */
export type StationId = string;
/** 터널 구간 id: `${호선id}:${역A}-${역B}` */
export type SegmentId = string;
export type LineId = string;

/** 화면 상단 선택 상태 (URL 쿼리와 동기화) */
export interface ViewParams {
  tech: Tech;
  metric: Metric;
  period: Period;
}

// ---- 노선 마스터 ----

/** [위도, 경도] */
export type LatLon = [number, number];
/** 지도 좌표 [x, y] */
export type Point = [number, number];

export interface Line {
  id: LineId;
  name: string;
  color: string;
  /** 분기별 역 순서 */
  br: StationId[][];
}

export interface Segment {
  id: SegmentId;
  line: LineId;
  a: StationId;
  b: StationId;
  /** 터널 중계기 id */
  rep: string;
  /** 같은 두 역을 지나는 노선끼리 나란히 그릴 때의 오프셋 순번 */
  par: number;
  flip: boolean;
}

export interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

// ---- 지표 데이터 (GET /api/metrics) ----

export interface Equipment {
  id: string;
  loc: string;
  load: number;
}

export interface StationMetrics {
  id: StationId;
  load: number;
  voc: number;
  /** VOC_TYPES 순서의 유형별 건수 */
  types: number[];
  equip: Equipment[];
}

export interface SegmentMetrics {
  id: SegmentId;
  /** 측정값이 없으면 null (지도에 회색 표시, 집계 제외) */
  load: number | null;
  rep: string;
  /** 구간 거리(km), 소수 한 자리 문자열 */
  dist: string;
}

export interface EquipmentRow {
  id: string;
  loc: string;
  load: number | null;
  station?: StationId;
  seg?: SegmentId;
}

export interface Alarm {
  id: string;
  sev: Severity;
  /** 장비 id */
  eq: string;
  /** 발생 시각 HH:mm */
  at: string;
  /** 역 장비 알람이면 역 이름 */
  st?: StationId;
  /** 터널 장비 알람이면 구간 id */
  seg?: SegmentId;
  /** 사람이 읽는 위치 설명 */
  where: string;
  /** 알람 선택 시 지도를 이동할 역 */
  focus: StationId;
}

export interface MetricsData {
  st: Record<StationId, StationMetrics>;
  seg: Record<SegmentId, SegmentMetrics>;
  eq: EquipmentRow[];
  alarms: Alarm[];
  /** 장비 id → 가장 심각한 미해제 알람 등급 */
  eqSev: Record<string, Severity>;
}

export interface TimeseriesPoint {
  hour: number;
  load: number;
}

// ---- 선택 상태 ----

export type SelectionType = 'station' | 'segment';

export interface Selection {
  type: SelectionType;
  id: string;
  /** 알람 목록에서 선택한 경우 알람 id */
  alarm?: string;
}

export type PickHandler = (type: SelectionType, id: string, focus?: boolean) => void;
