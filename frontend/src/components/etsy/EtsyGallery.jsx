import React, { useState } from 'react';
import { Play } from 'lucide-react';

const PLACEHOLDER = 'https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg';

const EtsyGallery = ({ images = [], videos = [] }) => {
  const allMedia = [
    ...(videos || []).map(src => ({ src, type: 'video' })),
    ...images.map(src => ({ src, type: 'image' })),
  ].slice(0, 21);

  const [activeIdx, setActiveIdx] = useState(0);
  const active = allMedia[activeIdx] || { src: PLACEHOLDER, type: 'image' };
  const total = allMedia.length;

  if (total === 0) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-2xl aspect-square text-gray-400 text-sm">
        Chưa có ảnh / video
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row md:gap-3">
      {/* Vertical thumbnails — desktop only */}
      <div className="hidden md:flex flex-col gap-2 flex-shrink-0" style={{ width: 72 }}>
        {allMedia.map((media, idx) => (
          <div
            key={idx}
            onClick={() => setActiveIdx(idx)}
            className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all flex-shrink-0
              ${activeIdx === idx
                ? 'border-gray-800 shadow-sm'
                : 'border-transparent hover:border-gray-300'}`}
            style={{ width: 68, height: 68 }}
          >
            {media.type === 'video' ? (
              <div className="w-full h-full bg-gray-200 flex flex-col items-center justify-center gap-0.5">
                <Play size={18} className="text-gray-600" />
                <span className="text-[9px] text-gray-500 font-medium">VIDEO</span>
              </div>
            ) : (
              <img
                src={media.src}
                alt={`Thumbnail ${idx + 1}`}
                loading="lazy"
                className="w-full h-full object-cover"
                onError={e => { e.target.src = PLACEHOLDER; }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Main view */}
      <div className="flex-grow">
        {/* Main image / video */}
        <div className="relative rounded-2xl overflow-hidden bg-gray-50 aspect-square">
          {active.type === 'video' ? (
            <video
              key={active.src}
              src={active.src}
              controls
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={active.src}
              alt="Main product view"
              loading="lazy"
              className="w-full h-full object-contain"
              onError={e => { e.target.src = PLACEHOLDER; }}
            />
          )}

          {/* Counter badge */}
          {total > 1 && (
            <div className="absolute top-3 right-3 bg-black/50 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm select-none">
              {activeIdx + 1} / {total}
            </div>
          )}
        </div>

        {/* Mobile horizontal thumbnail strip */}
        <div className="flex md:hidden gap-2 mt-3 overflow-x-auto pb-1">
          {allMedia.map((media, idx) => (
            <div
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className={`flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition-all
                ${activeIdx === idx
                  ? 'border-gray-800'
                  : 'border-transparent hover:border-gray-300'}`}
              style={{ width: 58, height: 58 }}
            >
              {media.type === 'video' ? (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <Play size={14} className="text-gray-600" />
                </div>
              ) : (
                <img
                  src={media.src}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={e => { e.target.src = PLACEHOLDER; }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EtsyGallery;
