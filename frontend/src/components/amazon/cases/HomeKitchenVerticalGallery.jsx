import React, { useState, useRef, useCallback } from 'react';

const PLACEHOLDER = 'https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg';
const ZOOM_PANEL_SIZE = 430;
const ZOOM_SCALE = 2.5;

const HomeKitchenVerticalGallery = ({ images = [], videos = [] }) => {
  const allMedia = [
    ...images.map(src => ({ src, type: 'image' })),
    ...(videos || []).map(src => ({ src, type: 'video' })),
  ].slice(0, 7);

  const [activeIdx, setActiveIdx] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const mainRef = useRef(null);

  const active = allMedia[activeIdx] || { src: PLACEHOLDER, type: 'image' };
  const canZoom = active.type === 'image';

  const handleMouseMove = useCallback((e) => {
    if (!mainRef.current || !canZoom) return;
    const rect = mainRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomPos({ x, y });
  }, [canZoom]);

  if (allMedia.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded text-gray-400 text-sm">
        Chưa có ảnh / video
      </div>
    );
  }

  return (
    <div className="flex flex-row sticky top-5 relative" style={{ zIndex: 10 }}>
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
      <div
        ref={mainRef}
        className="flex-grow flex items-start justify-center overflow-hidden"
        style={{
          minHeight: 400,
          cursor: canZoom ? 'crosshair' : 'default',
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => canZoom && setIsZooming(true)}
        onMouseLeave={() => setIsZooming(false)}
      >
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
            className="max-h-[600px] w-full object-contain select-none"
            draggable={false}
            onError={e => { e.target.src = PLACEHOLDER; }}
          />
        )}
      </div>

      {/* Zoom panel — positioned to the right of the gallery */}
      {isZooming && canZoom && (
        <div
          className="absolute top-0 border border-gray-300 shadow-xl bg-white"
          style={{
            left: 'calc(100% + 8px)',
            width: ZOOM_PANEL_SIZE,
            height: ZOOM_PANEL_SIZE,
            backgroundImage: `url(${active.src})`,
            backgroundSize: `${ZOOM_SCALE * 100}%`,
            backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
            backgroundRepeat: 'no-repeat',
            zIndex: 50,
          }}
        />
      )}
    </div>
  );
};

export default HomeKitchenVerticalGallery;
