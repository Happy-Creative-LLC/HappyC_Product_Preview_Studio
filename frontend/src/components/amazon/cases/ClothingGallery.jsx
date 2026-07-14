import React, { useState } from 'react';
import { Play, Share2 } from 'lucide-react';
import EditableZone from '../../shared/EditableZone';
import UploadPlaceholder from '../UploadPlaceholder';

// Case 1 desktop gallery — a "ready to upload" scaffold: 6 image slots + 1 video
// slot (real Amazon Case 1 media max). Empty slots render an upload placeholder
// at the exact measured size so swapping in real media never shifts layout.
const MAX_IMAGES = 6;
const MAIN_W = 369;          // measured main image box
const THUMB_W = 38, THUMB_H = 50, THUMB_R = 11;   // measured thumbnail

const ClothingGallery = ({ images = [], videos = [], onCommentClick }) => {
  const imageSlots = Array.from({ length: MAX_IMAGES }, (_, i) => images[i] || null);
  const videoSlot = videos[0] || null;

  const [activeIdx, setActiveIdx] = useState(0); // 0..5 = images, 6 = video

  const isVideoActive = activeIdx === MAX_IMAGES;
  const activeSrc = isVideoActive ? videoSlot : imageSlots[activeIdx];

  const thumbStyle = { width: THUMB_W, height: THUMB_H };

  return (
    <div className="flex gap-2.5">
      {/* ── Thumbnail rail ── */}
      <div className="flex flex-col gap-1.5 flex-shrink-0">
        {/* 6 image slots (IMAGE zone comes from the page wrapper) */}
        {imageSlots.map((src, i) => {
          const sel = activeIdx === i;
          return (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              onMouseEnter={() => setActiveIdx(i)}
              aria-label={`Ảnh ${i + 1}`}
              aria-pressed={sel}
              className={`overflow-hidden border transition-colors ${sel ? 'border-[#E77600] ring-1 ring-[#E77600]' : 'border-[#D5D9D9] hover:border-[#E77600]'}`}
              style={{ ...thumbStyle, borderRadius: THUMB_R }}
            >
              {src
                ? <img src={src} alt="" className="w-full h-full" style={{ objectFit: 'fill' }} />
                : <UploadPlaceholder zone="IMAGE" compact radius={THUMB_R} />}
            </button>
          );
        })}

        {/* Video slot — its own VIDEO zone (purple), separated from image slots */}
        <EditableZone zone="VIDEO" onCommentClick={onCommentClick}>
          <button
            onClick={() => setActiveIdx(MAX_IMAGES)}
            onMouseEnter={() => setActiveIdx(MAX_IMAGES)}
            aria-label="Video sản phẩm"
            aria-pressed={isVideoActive}
            className={`relative block overflow-hidden border transition-colors ${isVideoActive ? 'border-[#A855F7] ring-1 ring-[#A855F7]' : 'border-[#D5B8F5] hover:border-[#A855F7]'}`}
            style={{ ...thumbStyle, borderRadius: THUMB_R }}
          >
            {videoSlot
              ? <video src={videoSlot} muted className="w-full h-full" style={{ objectFit: 'fill' }} />
              : <UploadPlaceholder zone="VIDEO" compact radius={THUMB_R} />}
            {/* Play overlay */}
            <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="w-5 h-5 rounded-full bg-black/55 flex items-center justify-center">
                <Play size={10} className="text-white fill-white ml-[1px]" />
              </span>
            </span>
          </button>
        </EditableZone>
      </div>

      {/* ── Main viewer ── */}
      <div className="flex-grow min-w-0">
        {/* Video active → nested VIDEO zone; image active → covered by page IMAGE zone */}
        {isVideoActive ? (
          <EditableZone zone="VIDEO" onCommentClick={onCommentClick}>
            <MainFrame>
              {activeSrc
                ? <video src={activeSrc} controls className="w-full h-full" style={{ objectFit: 'fill' }} />
                : <UploadPlaceholder zone="VIDEO" radius={8} label={`Upload video (${MAIN_W}×362)`} />}
              <ShareBtn />
            </MainFrame>
          </EditableZone>
        ) : (
          <MainFrame>
            {activeSrc ? (
              <img
                src={activeSrc}
                alt="Main product view"
                className="w-full h-full"
                style={{ objectFit: 'fill' }}
              />
            ) : (
              <UploadPlaceholder zone="IMAGE" radius={8} label={`Upload ảnh chính (${MAIN_W}×362)`} />
            )}
            <ShareBtn />
          </MainFrame>
        )}
      </div>
    </div>
  );
};

// Fixed measured main-image box (369×362) — keeps aspect so upload doesn't jump.
const MainFrame = ({ children }) => (
  <div
    className="relative overflow-hidden bg-white rounded"
    style={{ width: MAIN_W, maxWidth: '100%', aspectRatio: `${MAIN_W} / 362` }}
  >
    {children}
  </div>
);

const ShareBtn = () => (
  <button
    className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white border border-[#D5D9D9] shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-800 hover:shadow-md transition-all z-10"
    aria-label="Share product"
  >
    <Share2 size={15} />
  </button>
);

export default ClothingGallery;
