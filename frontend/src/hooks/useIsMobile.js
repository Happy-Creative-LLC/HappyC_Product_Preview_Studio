import { useCallback, useSyncExternalStore } from 'react';

// useIsMobile — true when viewport is below the given breakpoint (default 768px).
// Uses matchMedia so it updates live on resize / orientation change.
// Safe for this CSR (Vite) app; guards window for any non-DOM environment.
export default function useIsMobile(breakpoint = 768) {
  const query = `(max-width: ${breakpoint - 1}px)`;

  const subscribe = useCallback((onChange) => {
    const mql = window.matchMedia(query);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
}
