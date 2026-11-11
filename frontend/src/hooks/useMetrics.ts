import { useCallback, useEffect, useState } from 'react';
import { getMetrics } from '../api';
import type { MetricsData, Period, Tech } from '../types';

export interface UseMetricsResult {
  data: MetricsData | null;
  error: Error | null;
  loading: boolean;
  retry: () => void;
}

// 기술·기간이 바뀌면 데이터를 다시 불러온다. 불러오는 동안 이전 데이터는 그대로 보여준다.
export function useMetrics(tech: Tech, period: Period): UseMetricsResult {
  const [data, setData] = useState<MetricsData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    getMetrics(tech, period)
      .then((d) => { if (alive) setData(d); })
      .catch((e: unknown) => { if (alive) setError(e instanceof Error ? e : new Error(String(e))); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [tech, period, nonce]);

  const retry = useCallback(() => setNonce((n) => n + 1), []);
  return { data, error, loading, retry };
}
