import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';

export interface QueryState<T> {
  data: T;
  loading: boolean;
  /** Re-runs the fetcher. Never rejects — errors are reported via `onError`. */
  refresh: () => Promise<void>;
}

export interface QueryOptions {
  /**
   * Called when the fetcher rejects. The previous `data` is kept and `loading`
   * is cleared either way, so a transient failure shows stale data rather than
   * an empty screen.
   */
  onError?: (error: unknown) => void;
}

/**
 * The shared read-only query primitive: fetch on mount / dep change, expose
 * `loading`, and offer an explicit `refresh` for focus effects.
 *
 * Every data hook in `hooks/` used to re-implement this by hand, including the
 * stale-response guard (`active`). Keeping one copy means the guard can't be
 * forgotten in the next hook.
 *
 * `deps` follows the `useEffect` contract: the query re-runs when — and only
 * when — those values change. `fetcher` is read through a ref so it may be an
 * inline arrow without re-triggering the query on every render.
 *
 * IMPORTANT: pass referentially stable deps. An object or array literal built
 * during render (`useTransactions({ limit: 5 })`) has a new identity every
 * render, which re-runs the query every render and refetches in a loop. Hoist
 * such literals to a module constant or wrap them in `useMemo`.
 */
export function useQuery<T>(
  fetcher: () => Promise<T>,
  deps: DependencyList,
  initialData: T,
  { onError }: QueryOptions = {}
): QueryState<T> {
  const [state, setState] = useState<{ data: T; loading: boolean }>({
    data: initialData,
    loading: true,
  });

  const fetcherRef = useRef(fetcher);
  const onErrorRef = useRef(onError);

  // Synced in an effect (not during render) so the compiler's ref rules hold.
  // Declared before the query effect so a dep change refreshes the ref first.
  useEffect(() => {
    fetcherRef.current = fetcher;
    onErrorRef.current = onError;
  }, [fetcher, onError]);

  const run = useCallback(async (isActive: () => boolean) => {
    try {
      const data = await fetcherRef.current();
      if (isActive()) {
        setState({ data, loading: false });
      }
    } catch (error) {
      onErrorRef.current?.(error);
      if (isActive()) {
        setState((prev) => ({ data: prev.data, loading: false }));
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    void run(() => active);
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller owns the dep list, like useEffect
  }, deps);

  const refresh = useCallback(async () => {
    await run(() => true);
  }, [run]);

  return { data: state.data, loading: state.loading, refresh };
}
