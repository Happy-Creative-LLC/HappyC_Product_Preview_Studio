import { useState } from 'react';
import { Play, Heart, ChevronLeft, ChevronRight } from 'lucide-react';

const PLACEHOLDER = 'https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg';

// EtsyGallery — vertical thumbnail rail + large main image.
// Real Etsy keeps the vertical rail on mobile too, so this stays one
// responsive component (rail narrows, arrows stay visible for touch).
const EtsyGallery = ({ images = [], videos = [] }) => {
  const [first, ...restImages] = images;
  const allMedia = [
    ...(first ? [{ src: first, type: 'image' }] : []),
    ...(videos || []).map((src) => ({ src, type: 'video' })),
    ...restImages.map((src) => ({ src, type: 'image' })),
  ].slice(0, 21);

  const [activeIdx, setActiveIdx] = useState(0);
  const total = allMedia.length;
  const active = allMedia[activeIdx] || { src: PLACEHOLDER, type: 'image' };
  const go = (dir) => setActiveIdx((i) => (i + dir + total) % total);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg aspect-square text-gray-400 text-sm">
        Chưa có ảnh / video
      </div>
    );
  }

  return (
    <div className="flex gap-2 sm:gap-3">
      {/* Vertical thumbnail rail */}
      <div className="flex flex-col gap-1.5 sm:gap-2 flex-shrink-0 w-12 sm:w-16">
        {allMedia.map((media, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIdx(idx)}
            aria-label={media.type === 'video' ? `Video ${idx + 1}` : `Ảnh ${idx + 1}`}
            aria-pressed={activeIdx === idx}
            className={`relative rounded-lg overflow-hidden border transition-all aspect-square
              ${activeIdx === idx ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-200 hover:border-gray-400'}`}
          >
            {media.type === 'video' ? (
              <div className="w-full h-full bg-gray-900/80 flex items-center justify-center">
                <Play size={14} className="text-white fill-white" />
              </div>
            ) : (
              <img
                src={media.src}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = PLACEHOLDER; }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Main viewer */}
      <div className="flex-grow min-w-0">
        <div className="relative rounded-lg overflow-hidden bg-gray-50 aspect-square group">
          {active.type === 'video' ? (
            <video key={active.src} src={active.src} controls className="w-full h-full object-cover" />
          ) : (
            <img
              src={active.src}
              alt="Main product view"
              loading="lazy"
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = PLACEHOLDER; }}
            />
          )}

          {/* Bestseller badge — top left */}
          <span className="absolute top-3 left-3 bg-white text-gray-900 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm">
            Bestseller
          </span>

          {/* Favorite — top right */}
          <button
            className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow text-gray-700 hover:text-red-500 active:text-red-500 transition-colors"
            aria-label="Add to favorites"
          >
            <Heart size={18} />
          </button>

          {/* Prev / Next — always visible on mobile, hover on desktop */}
          {total > 1 && (
            <>
              <button
                onClick={() => go(-1)}
                className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 shadow text-gray-800 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity active:bg-white"
                aria-label="Previous"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => go(1)}
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 shadow text-gray-800 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity active:bg-white"
                aria-label="Next"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {/* Counter — bottom right */}
          {total > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm select-none">
              {activeIdx + 1} / {total}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EtsyGallery;
