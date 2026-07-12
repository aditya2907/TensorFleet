import { useEffect, useRef } from 'react';

// Interval polling that pauses while the tab is hidden and fires an
// immediate refresh when it becomes visible again — cuts idle backend
// load from open-but-inactive dashboards to zero.
export function usePolling(callback, intervalMs, { enabled = true, immediate = true } = {}) {
  const saved = useRef(callback);

  useEffect(() => {
    saved.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || !intervalMs) return undefined;

    const tick = () => {
      if (!document.hidden) saved.current();
    };

    if (immediate) tick();
    const timer = setInterval(tick, intervalMs);
    const onVisibilityChange = () => {
      if (!document.hidden) saved.current();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [intervalMs, enabled, immediate]);
}

export default usePolling;
