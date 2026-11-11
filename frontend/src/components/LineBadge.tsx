import { LINE_BY_ID } from '../lib/network';
import type { LineId } from '../types';

export default function LineBadge({ lineId }: { lineId: LineId }) {
  const l = LINE_BY_ID[lineId];
  return <span className="lb" style={{ background: l.color }}>{l.name}</span>;
}
