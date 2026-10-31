import { useState, useRef, useCallback } from 'react';
import { Share2, ZoomIn, X } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

// MobileGallery — full-width swipe carousel + dot indicators, shared by every
// Amazon case on mobile (real Amazon shows a single swipeable image carousel).
const MobileGallery = ({ images = [], videos = [] }) => {
  const [broken, setBroken] = useState(new Set());
  const [idx, setIdx] = useState(0);
  const [zoomSrc, setZoomSrc] = useState(null);
  const trackRef = useRef(null);

  const allMedia = [
    ...images.map(src => ({ src, type: 'image' })),
    ...(videos || []).map(src => ({ src, type: 'video' })),
  ].slice(0, 7);
  const validMedia = allMedia.filter((_, i) => !broken.has(i));

  const handleError = useCallback((media) => {
    setBroken(prev => new Set([...prev, allMedia.indexOf(media)]));
    setIdx(0);
  }, [allMedia]);

  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (el) setIdx(Math.round(el.scrollLeft / el.clientWidth));
  }, []);

  const scrollToIdx = (i) => {
    const el = trackRef.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  if (validMedia.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 bg-gray-100 rounded text-gray-400 text-sm">
        No images / video yet
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="flex overflow-x-auto snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none' }}
        >
          {validMedia.map((media, i) => (
            <div key={i} className="snap-center flex-shrink-0 w-full aspect-square flex items-center justify-center bg-white">
              {media.type === 'video' ? (
                <video src={media.src} controls className="max-h-full w-full object-contain" />
              ) : (
                <img
                  src={media.src}
                  alt="Product view"
                  onClick={() => setZoomSrc(media.src)}
                  className="max-h-full w-full object-contain cursor-zoom-in"
                  onError={() => handleError(media)}
                />
              )}
            </div>
          ))}
        </div>

        {/* Share — top right */}
        <button
          className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white border border-[#D5D9D9] shadow-sm flex items-center justify-center text-gray-600 active:bg-gray-100"
          aria-label="Share product"
        >
          <Share2 size={16} />
        </button>

        {/* Zoom affordance — bottom left */}
        <div className="absolute bottom-2 left-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/45 text-white pointer-events-none">
          <ZoomIn size={16} />
        </div>

        {/* Counter — bottom right */}
        {validMedia.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[11px] font-medium px-2 py-0.5 rounded-full">
            {idx + 1}/{validMedia.length}
          </div>
        )}
      </div>

      {/* Dots */}
      {validMedia.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {validMedia.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIdx(i)}
              aria-label={`Go to image ${i + 1}`}
              className={`h-2 rounded-full transition-all ${idx === i ? 'w-5 bg-[#E77600]' : 'w-2 bg-gray-300'}`}
            />
          ))}
        </div>
      )}

      {/* Full-screen pinch / double-tap zoom viewer */}
      {zoomSrc && (
        <div className="fixed inset-0 z-[60] bg-black">
          <button
            onClick={() => setZoomSrc(null)}
            aria-label="Close zoom"
            className="absolute top-3 right-3 z-10 w-11 h-11 flex items-center justify-center rounded-full bg-white/15 text-white active:bg-white/25"
          >
            <X size={22} />
          </button>
          <TransformWrapper doubleClick={{ mode: 'toggle', step: 1.4 }} pinch={{ step: 6 }} wheel={{ disabled: true }}>
            <TransformComponent
              wrapperStyle={{ width: '100vw', height: '100dvh' }}
              contentStyle={{ width: '100vw', height: '100dvh' }}
            >
              <div className="w-screen flex items-center justify-center" style={{ height: '100dvh' }}>
                <img src={zoomSrc} alt="Zoomed product view" className="max-w-full max-h-full object-contain" />
              </div>
            </TransformComponent>
          </TransformWrapper>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/85 text-xs bg-black/40 px-3 py-1.5 rounded-full pointer-events-none">
            Pinch or double-tap to zoom
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileGallery;
