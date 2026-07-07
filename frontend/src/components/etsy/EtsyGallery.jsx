import React, { useState } from 'react';
import { Play, Heart, ChevronLeft, ChevronRight } from 'lucide-react';

const PLACEHOLDER = 'https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg';

// EtsyGallery — vertical thumbnail rail + large main image (Etsy listing layout)
const EtsyGallery = ({ images = [], videos = [] }) => {
  // Etsy shows the video as the 2nd media item after the primary image.
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
    <div className="flex gap-3">
      {/* Vertical thumbnail rail */}
      <div className="hidden sm:flex flex-col gap-2 flex-shrink-0" style={{ width: 64 }}>
        {allMedia.map((media, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIdx(idx)}
            className={`relative cursor-pointer rounded-lg overflow-hidden border transition-all flex-shrink-0
              ${activeIdx === idx ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-200 hover:border-gray-400'}`}
            style={{ width: 60, height: 60 }}
          >
            {media.type === 'video' ? (
              <div className="w-full h-full bg-gray-900/80 flex items-center justify-center">
                <Play size={16} className="text-white fill-white" />
              </div>
            ) : (
              <img
                src={media.src}
                alt={`Thumbnail ${idx + 1}`}
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
            className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow text-gray-700 hover:text-red-500 transition-colors"
            aria-label="Add to favorites"
          >
            <Heart size={18} />
          </button>

          {/* Prev / Next arrows */}
          {total > 1 && (
            <>
              <button
                onClick={() => go(-1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 shadow text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                aria-label="Previous"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => go(1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 shadow text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
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

        {/* Mobile horizontal strip */}
        <div className="flex sm:hidden gap-2 mt-3 overflow-x-auto pb-1">
          {allMedia.map((media, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all
                ${activeIdx === idx ? 'border-gray-900' : 'border-transparent'}`}
              style={{ width: 56, height: 56 }}
            >
              {media.type === 'video' ? (
                <div className="w-full h-full bg-gray-900/80 flex items-center justify-center">
                  <Play size={14} className="text-white fill-white" />
                </div>
              ) : (
                <img src={media.src} alt="" loading="lazy" className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = PLACEHOLDER; }} />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EtsyGallery;
