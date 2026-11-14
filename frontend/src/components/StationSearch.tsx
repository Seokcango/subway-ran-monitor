import { useId, useMemo, useState, type KeyboardEvent } from 'react';
import { STATIONS, stationLines, LINE_BY_ID } from '../lib/network';
import type { StationId } from '../types';

interface StationSearchProps {
  onSelect: (id: StationId) => void;
}

const norm = (s: string) => s.replace(/\s+/g, '').replace(/역$/, '').toLowerCase();

// 역 이름 검색 (콤보박스): 입력 → 목록에서 고르면 지도가 그 역으로 이동
export default function StationSearch({ onSelect }: StationSearchProps) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();

  const results = useMemo(() => {
    const k = norm(q);
    if (!k) return [];
    const starts = STATIONS.filter((id) => norm(id).startsWith(k));
    const has = STATIONS.filter((id) => !norm(id).startsWith(k) && norm(id).includes(k));
    return [...starts, ...has].slice(0, 8);
  }, [q]);

  const choose = (id: StationId) => {
    onSelect(id);
    setQ(id);
    setOpen(false);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { if (results[active]) { e.preventDefault(); choose(results[active]); } }
    else if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); }
  };

  const showList = open && q.trim() !== '';

  return (
    <div className="search">
      <label className="ctl-label" htmlFor={`${listId}-in`}>역 검색</label>
      <div className="search-box">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-4-4" />
        </svg>
        <input
          id={`${listId}-in`}
          type="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && results[active] ? `${listId}-${active}` : undefined}
          placeholder="역 이름 (예: 강남, 홍대)"
          autoComplete="off"
          value={q}
          onChange={(e) => { setQ(e.target.value); setActive(0); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKey}
        />
      </div>
      {showList && (
        <ul className="search-list" id={listId} role="listbox">
          {results.length === 0 && <li className="search-empty">일치하는 역이 없습니다</li>}
          {results.map((id, i) => (
            <li
              key={id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); choose(id); }}
              onMouseEnter={() => setActive(i)}
            >
              <span className="search-name">{id}</span>
              <span className="search-lines">
                {stationLines[id].map((l) => (
                  <span key={l} className="dot" title={LINE_BY_ID[l].name} style={{ background: LINE_BY_ID[l].color }} />
                ))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
