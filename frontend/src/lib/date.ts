const DOW = ['일', '월', '화', '수', '목', '금', '토'];
const pad = (n: number) => String(n).padStart(2, '0');

/** Date → '2026.11.14 (토)' */
export const fmtDate = (d: Date): string => `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} (${DOW[d.getDay()]})`;
/** Date → '23:20' */
export const fmtTime = (d: Date): string => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
/** Date → '2026-11-14T23:20' (time 요소 dateTime 속성용) */
export const isoMinute = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${fmtTime(d)}`;
/** '2026-11-10 22:00' → Date */
export const parseYmdHm = (s: string): Date => {
  const [d, t = '00:00'] = s.split(' ');
  const [y, m, day] = d.split('-').map(Number);
  const [h, mi] = t.split(':').map(Number);
  return new Date(y, m - 1, day, h, mi);
};
