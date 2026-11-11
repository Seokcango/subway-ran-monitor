import { LINES } from '../lib/network';
import type { LineId } from '../types';

interface LineFilterProps {
  /** 'all' 또는 호선 id */
  value: LineId;
  onChange: (value: LineId) => void;
}

export default function LineFilter({ value, onChange }: LineFilterProps) {
  const items: { id: LineId; name: string; color?: string }[] = [{ id: 'all', name: '전체' }, ...LINES];
  return (
    <div className="chips" role="group" aria-label="호선 필터">
      {items.map((l) => (
        <button key={l.id} type="button" className="chip" aria-pressed={value === l.id} onClick={() => onChange(l.id)}>
          {l.color && <span className="dot" style={{ background: l.color }} />}
          {l.name}
        </button>
      ))}
    </div>
  );
}
