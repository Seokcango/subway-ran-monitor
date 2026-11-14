import { useRef, useState, type ChangeEvent } from 'react';
import { parseUpload, SAMPLE_CSV, type UploadResult } from '../lib/upload';
import { fmtDate, fmtTime, isoMinute } from '../lib/date';

interface DataUploadProps {
  /** 지금 화면에 반영된 데이터의 최신 시각 (업로드 시각 또는 기본 데이터 기준 시각) */
  latest: Date;
  fileName: string | null;
  onLoad: (result: UploadResult, fileName: string) => void;
  onReset: () => void;
}

// 마스트헤드 오른쪽: 최신 데이터 날짜 + 업로드 버튼 (CSV/JSON)
export default function DataUpload({ latest, fileName, onLoad, onReset }: DataUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const r = await parseUpload(file);
      onLoad(r, file.name);
      setMsg({ ok: true, text: `${r.applied}건 반영${r.skipped.length ? ` · ${r.skipped.length}건 건너뜀` : ''}` });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(false);
    }
  };

  const downloadSample = () => {
    const url = URL.createObjectURL(new Blob(['﻿' + SAMPLE_CSV], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subway-signal-sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mast-upload">
      <div className="mast-meta right">
        <span className="mast-k">{fileName ? '최근 업로드' : '최신 데이터'}</span>
        <time className="num" dateTime={isoMinute(latest)}>{fmtDate(latest)} {fmtTime(latest)}</time>
      </div>
      <div className="upload-row">
        {fileName ? (
          <button type="button" className="upload-ghost" onClick={() => { onReset(); setMsg(null); }}>되돌리기</button>
        ) : (
          <button type="button" className="upload-ghost" onClick={downloadSample}>샘플 CSV</button>
        )}
        <button type="button" className="upload-btn" disabled={busy} onClick={() => inputRef.current?.click()}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 16V4M6 10l6-6 6 6M4 20h16" />
          </svg>
          {busy ? '불러오는 중…' : '데이터 업로드'}
        </button>
        <input ref={inputRef} type="file" accept=".csv,.json,text/csv,application/json" hidden onChange={onFile} />
      </div>
      <span className={`upload-msg${msg && !msg.ok ? ' bad' : ''}`} role="status">
        {msg ? msg.text : fileName ?? 'CSV · JSON'}
      </span>
    </div>
  );
}
