import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useIsMobile from './useIsMobile';

// matchMedia giả: cho phép đổi kết quả và bắn sự kiện change như trình duyệt.
function mockMatchMedia(initialMatches) {
  let matches = initialMatches;
  const listeners = new Set();
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    get matches() { return matches; },
    media: query,
    addEventListener: (_event, listener) => listeners.add(listener),
    removeEventListener: (_event, listener) => listeners.delete(listener),
  }));
  return {
    set(next) {
      matches = next;
      listeners.forEach((listener) => listener({ matches }));
    },
    listenerCount: () => listeners.size,
  };
}

describe('useIsMobile', () => {
  let original;

  beforeEach(() => {
    original = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = original;
  });

  it('queries below the breakpoint (default 768px)', () => {
    mockMatchMedia(false);

    renderHook(() => useIsMobile());

    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 767px)');
  });

  it('returns the current match and follows viewport changes', () => {
    const media = mockMatchMedia(true);

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);

    act(() => media.set(false));
    expect(result.current).toBe(false);
  });

  it('stops listening on unmount', () => {
    const media = mockMatchMedia(false);

    const { unmount } = renderHook(() => useIsMobile());
    expect(media.listenerCount()).toBe(1);

    unmount();
    expect(media.listenerCount()).toBe(0);
  });
});
