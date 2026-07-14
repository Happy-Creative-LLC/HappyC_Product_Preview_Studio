import { useState, useEffect } from 'react';

// useIsMobile — true when viewport is below the given breakpoint (default 768px).
// Uses matchMedia so it updates live on resize / orientation change.
// Safe for this CSR (Vite) app; guards window for any non-DOM environment.
export default function useIsMobile(breakpoint = 768) {
  const query = `(max-width: ${breakpoint - 1}px)`;

  const [isMobile, setIsMobile] = useState(
    () => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false)
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return isMobile;
}
