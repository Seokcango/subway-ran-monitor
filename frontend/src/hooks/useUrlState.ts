import { useCallback, useEffect, useState } from 'react';
import { TECHS, METRICS, PERIODS } from '../lib/constants';
import type { ViewParams } from '../types';

// PRD 6.1: 선택 상태를 URL 쿼리에 반영 (?tech=5G&metric=load&period=24h)
const DEFAULTS: ViewParams = { tech: '5G', metric: 'load', period: '24h' };
const ALLOWED: { [K in keyof ViewParams]: readonly ViewParams[K][] } = { tech: TECHS, metric: METRICS, period: PERIODS };

export type SetViewParam = <K extends keyof ViewParams>(key: K, value: ViewParams[K]) => void;

function isAllowed<K extends keyof ViewParams>(key: K, v: string): v is ViewParams[K] {
  return (ALLOWED[key] as readonly string[]).includes(v);
}

function read(): ViewParams {
  const q = new URLSearchParams(window.location.search);
  const out = { ...DEFAULTS };
  (Object.keys(ALLOWED) as (keyof ViewParams)[]).forEach((k) => {
    const v = q.get(k);
    if (v && isAllowed(k, v)) (out as Record<keyof ViewParams, string>)[k] = v;
  });
  return out;
}

export function useUrlState(): [ViewParams, SetViewParam] {
  const [state, setState] = useState<ViewParams>(read);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    Object.entries(state).forEach(([k, v]) => q.set(k, v));
    const url = `${window.location.pathname}?${q.toString()}${window.location.hash}`;
    window.history.replaceState(null, '', url);
  }, [state]);

  useEffect(() => {
    const onPop = () => setState(read());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const set = useCallback<SetViewParam>((key, value) => setState((s) => ({ ...s, [key]: value })), []);
  return [state, set];
}
