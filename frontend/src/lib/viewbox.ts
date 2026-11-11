import { MAP_W, MAP_H, POS } from './network';
import { clamp } from './constants';
import type { StationId, ViewBox } from '../types';

export function zoomViewBox(vb: ViewBox, factor: number, cx?: number, cy?: number): ViewBox {
  const nw = clamp(vb.w * factor, 140, MAP_W * 1.2);
  const nh = (nw * MAP_H) / MAP_W;
  const x = cx == null ? vb.x + vb.w / 2 : cx;
  const y = cy == null ? vb.y + vb.h / 2 : cy;
  const rx = (x - vb.x) / vb.w;
  const ry = (y - vb.y) / vb.h;
  return { x: x - rx * nw, y: y - ry * nh, w: nw, h: nh };
}

export function focusViewBox(vb: ViewBox, stationId: StationId, width?: number): ViewBox {
  const [px, py] = POS[stationId];
  const w = width || Math.min(vb.w, 420);
  const h = (w * MAP_H) / MAP_W;
  return { x: px - w / 2, y: py - h / 2, w, h };
}
