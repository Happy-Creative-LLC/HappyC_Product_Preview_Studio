import { useEffect, useRef, useState } from 'react';
import { Play, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import useIsMobile from '../../hooks/useIsMobile';

const PLACEHOLDER = 'https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg';

// Etsy mobile uses a full-width swipe carousel; desktop keeps the thumbnail rail.
const EtsyGallery = ({ images = [], videos = [] }) => {
  const mobile = useIsMobile();
  const trackRef = useRef(null);
  const allMedia = [
    ...images.map((src) => ({ src, type: 'image' })),
    ...(videos || []).map((src) => ({ src, type: 'video' })),
  ].slice(0, 21);
  const [activeIdx, setActiveIdx] = useState(0);
  const total = allMedia.length;
  const activeIndex = total ? activeIdx % total : 0;
  const active = allMedia[activeIndex] || { src: PLACEHOLDER, type: 'image' };
  const go = (dir) => setActiveIdx((i) => (i + dir + total) % total);

  const handleScroll = () => {
    const track = trackRef.current;
    if (track?.clientWidth) setActiveIdx(Math.round(track.scrollLeft / track.clientWidth));
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!mobile || !track) return;
    track.scrollTo({ left: activeIndex * track.clientWidth });
  }, [activeIndex, mobile]);

  if (total === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-400">
        Chưa có ảnh hoặc video
      </div>
    );
  }

  if (mobile) {
    return (
      <div className="relative w-full overflow-hidden rounded-lg bg-gray-50">
        <div
          ref={trackRef}
          onScroll={handleScroll}
          className="flex aspect-square snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
          style={{ scrollbarWidth: 'none' }}
          aria-label="Ảnh và video sản phẩm"
        >
          {allMedia.map((media, idx) => (
            <div key={idx} className="h-full w-full shrink-0 snap-center">
              {media.type === 'video' ? (
                <video
                  src={media.src}
                  controls
                  preload="metadata"
                  playsInline
                  aria-label={`Video sản phẩm ${idx + 1}`}
                  className="h-full w-full bg-black object-contain"
                />
              ) : (
                <img
                  src={media.src}
                  alt={`Ảnh sản phẩm ${idx + 1}`}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  className="h-full w-full object-cover"
                  onError={(event) => { event.currentTarget.src = PLACEHOLDER; }}
                />
              )}
            </div>
          ))}
        </div>
        <div className="absolute bottom-3 right-3 rounded-full bg-black/65 px-2.5 py-1 text-xs font-semibold text-white" aria-live="polite">
          {activeIndex + 1} / {total}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 sm:gap-3">
      <div className="flex w-12 shrink-0 flex-col gap-1.5 sm:w-16 sm:gap-2">
        {allMedia.map((media, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIdx(idx)}
            aria-label={media.type === 'video' ? `Video ${idx + 1}` : `Ảnh ${idx + 1}`}
            aria-pressed={activeIndex === idx}
            className={`relative aspect-square overflow-hidden rounded-lg border transition-all
              ${activeIndex === idx ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-200 hover:border-gray-400'}`}
          >
            {media.type === 'video' ? (
              <div className="flex h-full w-full items-center justify-center bg-gray-900/80">
                <Play size={14} className="fill-white text-white" />
              </div>
            ) : (
              <img
                src={media.src}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
                onError={(event) => { event.currentTarget.src = PLACEHOLDER; }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="group min-w-0 grow">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-50">
          {active.type === 'video' ? (
            <video key={active.src} src={active.src} controls preload="metadata" playsInline className="h-full w-full object-cover" />
          ) : (
            <img
              src={active.src}
              alt="Main product view"
              loading="lazy"
              className="h-full w-full object-cover"
              onError={(event) => { event.currentTarget.src = PLACEHOLDER; }}
            />
          )}
          <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-900 shadow-xs">
            Bestseller
          </span>
          <button
            className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm transition-colors hover:text-red-500 active:text-red-500"
            aria-label="Add to favorites"
          >
            <Heart size={18} />
          </button>
          {total > 1 && (
            <>
              <button
                onClick={() => go(-1)}
                className="absolute left-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 opacity-100 shadow-sm transition-opacity active:bg-white sm:left-3 sm:opacity-0 sm:group-hover:opacity-100"
                aria-label="Previous"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => go(1)}
                className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 opacity-100 shadow-sm transition-opacity active:bg-white sm:right-3 sm:opacity-0 sm:group-hover:opacity-100"
                aria-label="Next"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
          {total > 1 && (
            <div className="absolute bottom-3 right-3 select-none rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {activeIndex + 1} / {total}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EtsyGallery;
