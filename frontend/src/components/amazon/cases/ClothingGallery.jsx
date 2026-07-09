import React, { useState, useCallback } from 'react';
import { Play, Share2 } from 'lucide-react';

const THUMB_SIZE = 55;

const ClothingGallery = ({ images = [], videos = [] }) => {
  const [brokenSet, setBrokenSet] = useState(new Set());

  const allMedia = [
    ...images.map(src => ({ src, type: 'image' })),
    ...(videos || []).map(src => ({ src, type: 'video' })),
  ].slice(0, 7);

  // Filter out broken images
  const validMedia = allMedia.filter((m, idx) => !brokenSet.has(idx));

  const [activeIdx, setActiveIdx] = useState(0);

  // Keep activeIdx in range when items are filtered
  const safeActiveIdx = Math.min(activeIdx, Math.max(validMedia.length - 1, 0));
  const active = validMedia[safeActiveIdx];

  const handleError = useCallback((originalIdx) => {
    setBrokenSet(prev => new Set([...prev, originalIdx]));
    setActiveIdx(0);
  }, []);

  const handleKey = useCallback((e, idx) => {
    if (e.key === 'Enter' || e.key === ' ') setActiveIdx(idx);
  }, []);

  if (validMedia.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded text-gray-400 text-sm">
        No images / video yet
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-row gap-2">

        {/* ── Vertical thumbnail strip ── */}
        <div className="flex flex-col gap-1.5 flex-shrink-0" style={{ width: THUMB_SIZE }}>
          {validMedia.map((media, idx) => {
            const originalIdx = allMedia.indexOf(media);
            const isActive = safeActiveIdx === idx;
            const isVideo  = media.type === 'video';

            const borderCls = isActive
              ? (isVideo
                  ? 'border-[#A855F7] ring-[1.5px] ring-[#A855F7]'
                  : 'border-[#E77600] ring-[1.5px] ring-[#E77600]')
              : (isVideo
                  ? 'border-[#D5B8F5] hover:border-[#A855F7]'
                  : 'border-[#D5D9D9] hover:border-[#E77600]');

            return (
              <button
                key={idx}
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => setActiveIdx(idx)}
                onKeyDown={e => handleKey(e, idx)}
                aria-label={isVideo ? `Product video ${idx + 1}` : `Product image ${idx + 1}`}
                aria-pressed={isActive}
                className={`rounded overflow-hidden flex items-center justify-center border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E77600] ${borderCls}`}
                style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
              >
                {isVideo ? (
                  <div className="w-full h-full bg-[#F3E8FF] flex items-center justify-center">
                    <Play size={18} className="text-[#A855F7] fill-[#A855F7]" />
                  </div>
                ) : (
                  <img
                    src={media.src}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={() => handleError(originalIdx)}
                    loading="lazy"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Main view ── */}
        <div
          className="flex-grow relative flex items-start justify-center overflow-hidden rounded"
          style={{ minHeight: 420 }}
        >
          {active.type === 'video' ? (
            <video
              key={active.src}
              src={active.src}
              controls
              className="max-h-[600px] w-full object-contain"
            />
          ) : (
            <img
              key={active.src}
              src={active.src}
              alt="Main product view"
              className="max-h-[600px] w-full object-contain"
              onError={() => {
                const originalIdx = allMedia.indexOf(active);
                handleError(originalIdx);
              }}
            />
          )}

          {/* Share button */}
          <button
            className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white border border-[#D5D9D9] shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-800 hover:shadow-md transition-all"
            aria-label="Share product"
          >
            <Share2 size={15} />
          </button>
        </div>
      </div>

      <p className="text-[11px] text-[#565959] mt-2 text-center select-none">
        Roll over image to zoom in
      </p>
    </div>
  );
};

export default ClothingGallery;
