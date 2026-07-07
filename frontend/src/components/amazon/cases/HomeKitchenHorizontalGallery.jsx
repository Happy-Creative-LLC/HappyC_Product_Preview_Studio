import React, { useState, useRef } from 'react';

const PLACEHOLDER = 'https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg';
const ZOOM = 2.6;
const PANEL_W = 520;
const PANEL_H = 420;

const HomeKitchenHorizontalGallery = ({ images = [], videos = [] }) => {
  const allMedia = [
    ...images.map(src => ({ src, type: 'image' })),
    ...(videos || []).map(src => ({ src, type: 'video' })),
  ].slice(0, 7);

  const [activeIdx, setActiveIdx] = useState(0);
  const [lens, setLens] = useState(null);
  const [bg, setBg] = useState(null);
  const mainRef = useRef(null);

  const active = allMedia[activeIdx] || { src: PLACEHOLDER, type: 'image' };
  const canZoom = active.type === 'image';

  function handleMouseMove(e) {
    if (!mainRef.current || !canZoom) return;
    const r = mainRef.current.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const lw = r.width / ZOOM;
    const lh = r.height / ZOOM;
    const lx = Math.max(0, Math.min(x - lw / 2, r.width - lw));
    const ly = Math.max(0, Math.min(y - lh / 2, r.height - lh));
    setLens({ l: lx, t: ly, w: lw, h: lh });
    setBg({
      size: `${r.width * ZOOM}px ${r.height * ZOOM}px`,
      pos: `-${lx * ZOOM}px -${ly * ZOOM}px`,
    });
  }

  function handleMouseLeave() {
    setLens(null);
    setBg(null);
  }

  if (allMedia.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded text-gray-400 text-sm">
        Chưa có ảnh / video
      </div>
    );
  }

  return (
    <div className="sticky top-5 relative" style={{ zIndex: 10 }}>
      {/* Main image — top */}
      <div
        ref={mainRef}
        className="flex items-center justify-center mb-3 bg-white relative overflow-hidden"
        style={{ minHeight: 480, cursor: canZoom ? 'crosshair' : 'default' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {active.type === 'video' ? (
          <video
            src={active.src}
            controls
            className="max-h-[480px] w-full object-contain"
          />
        ) : (
          <img
            src={active.src}
            alt="Main product view"
            className="max-h-[480px] w-full object-contain select-none"
            draggable={false}
            onError={e => { e.target.src = PLACEHOLDER; }}
          />
        )}

        {/* Lens overlay */}
        {lens && canZoom && (
          <div
            className="absolute pointer-events-none border border-gray-400"
            style={{
              left: lens.l,
              top: lens.t,
              width: lens.w,
              height: lens.h,
              background: 'rgba(90,140,200,0.2)',
            }}
          />
        )}
      </div>

      {/* Horizontal thumbnail strip — bottom */}
      <div className="flex flex-row space-x-2 overflow-x-auto pb-1">
        {allMedia.map((media, idx) => (
          <div
            key={idx}
            onMouseEnter={() => setActiveIdx(idx)}
            onClick={() => setActiveIdx(idx)}
            className={`flex-shrink-0 cursor-pointer rounded overflow-hidden flex items-center justify-center border
              ${activeIdx === idx
                ? 'border-[#007185] ring-[1.5px] ring-[#007185]'
                : 'border-gray-300 hover:border-[#007185]'}`}
            style={{ width: 64, height: 64 }}
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

      {/* Zoom panel — right of gallery, overlaps info column */}
      {bg && canZoom && (
        <div
          className="absolute top-0 border border-gray-200 bg-white shadow-xl rounded"
          style={{
            left: 'calc(100% + 8px)',
            width: PANEL_W,
            height: PANEL_H,
            backgroundImage: `url(${active.src})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: bg.size,
            backgroundPosition: bg.pos,
            zIndex: 50,
          }}
        />
      )}

      {canZoom && !bg && (
        <p className="mt-2 text-center text-xs text-gray-500">
          Di chuột lên ảnh để phóng to
        </p>
      )}
    </div>
  );
};

export default HomeKitchenHorizontalGallery;
