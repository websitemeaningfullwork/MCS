import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a stable debounced wrapper around the latest `fn`. The timer is
 * cleared on unmount, and the returned `flush()` fires any pending call
 * immediately (used when switching the edited entity or clicking Save).
 */
export function useDebounced<A extends unknown[]>(
  fn: (...args: A) => void,
  delay = 700,
): { call: (...args: A) => void; flush: () => void } {
  const fnRef = useRef(fn);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastArgs = useRef<A | null>(null);

  useEffect(() => {
    fnRef.current = fn;
  });
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const flush = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (lastArgs.current) {
      const args = lastArgs.current;
      lastArgs.current = null;
      fnRef.current(...args);
    }
  }, []);

  const call = useCallback(
    (...args: A) => {
      lastArgs.current = args;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        timer.current = null;
        lastArgs.current = null;
        fnRef.current(...args);
      }, delay);
    },
    [delay],
  );

  return { call, flush };
}
