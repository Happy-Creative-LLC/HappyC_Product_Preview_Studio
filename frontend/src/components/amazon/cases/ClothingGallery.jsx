import React, { useState } from 'react';

const PLACEHOLDER = 'https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg';

const ClothingGallery = ({ images = [], videos = [] }) => {
  const allMedia = [
    ...images.map(src => ({ src, type: 'image' })),
    ...(videos || []).map(src => ({ src, type: 'video' })),
  ].slice(0, 7);

  const [activeIdx, setActiveIdx] = useState(0);
  const active = allMedia[activeIdx] || { src: PLACEHOLDER, type: 'image' };

  if (allMedia.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded text-gray-400 text-sm">
        Chưa có ảnh / video
      </div>
    );
  }

  return (
    <div className="flex flex-row sticky top-5">
      {/* Vertical thumbnails */}
      <div className="flex flex-col space-y-2 mr-3 flex-shrink-0" style={{ width: 60 }}>
        {allMedia.map((media, idx) => (
          <div
            key={idx}
            onMouseEnter={() => setActiveIdx(idx)}
            onClick={() => setActiveIdx(idx)}
            className={`cursor-pointer rounded overflow-hidden flex items-center justify-center border
              ${activeIdx === idx
                ? 'border-[#007185] ring-[1.5px] ring-[#007185]'
                : 'border-gray-300 hover:border-[#007185]'}`}
            style={{ width: 52, height: 52 }}
          >
            {media.type === 'video' ? (
              <div className="w-full h-full bg-black flex items-center justify-center">
                <span className="text-white text-[9px] font-bold">▶ VIDEO</span>
              </div>
            ) : (
              <img
                src={media.src}
                alt=""
                className="w-full h-full object-cover p-0.5"
                onError={e => { e.target.src = PLACEHOLDER; }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Main view */}
      <div className="flex-grow flex items-start justify-center" style={{ minHeight: 400 }}>
        {active.type === 'video' ? (
          <video
            src={active.src}
            controls
            className="max-h-[600px] w-full object-contain"
          />
        ) : (
          <img
            src={active.src}
            alt="Main product view"
            className="max-h-[600px] w-full object-contain"
            onError={e => { e.target.src = PLACEHOLDER; }}
          />
        )}
      </div>
    </div>
  );
};

export default ClothingGallery;
