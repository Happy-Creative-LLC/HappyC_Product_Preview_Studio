import { useEffect, useState } from 'react';
import { Play, Share2 } from 'lucide-react';
import EditableZone from '../../shared/EditableZone';
import UploadPlaceholder from '../UploadPlaceholder';

// Case 1 desktop gallery — a "ready to upload" scaffold: 6 image slots + 1 video
// slot (real Amazon Case 1 media max). Empty slots render an upload placeholder
// at the exact measured size so swapping in real media never shifts layout.
const MAX_IMAGES = 6;
const MAIN_W = 369;          // measured main image box
const THUMB_SIZE = 48;    // square Amazon-style thumbnail
const THUMB_R = 8;

const ClothingGallery = ({ images = [], videos = [], showUploadSlots = true }) => {
  // Product API mode shows only the media that exists on the source listing.
  // Task mode keeps the upload scaffold so the gallery stays ready for editing.
  const imageSlots = showUploadSlots
    ? Array.from({ length: MAX_IMAGES }, (_, i) => images[i] || null)
    : images;
  const videoSlot = videos[0] || null;
  const hasVideoSlot = showUploadSlots || videos.length > 0;
  const videoIndex = imageSlots.length;
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const itemCount = imageSlots.length + (hasVideoSlot ? 1 : 0);
    if (activeIdx >= itemCount) setActiveIdx(0);
  }, [activeIdx, hasVideoSlot, imageSlots.length]);

  useEffect(() => {
    setActiveIdx(0);
  }, [images[0]]);

  const isVideoActive = hasVideoSlot && activeIdx === videoIndex;
  const activeSrc = isVideoActive ? videoSlot : imageSlots[activeIdx] || null;
  const thumbStyle = { width: THUMB_SIZE, height: THUMB_SIZE };

  return (
    <div className="flex items-start gap-2.5">
      <div className="flex max-h-[420px] shrink-0 flex-col gap-2 overflow-y-auto pr-1">
        {imageSlots.map((src, i) => {
          const selected = !isVideoActive && activeIdx === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIdx(i)}
              onMouseEnter={() => setActiveIdx(i)}
              aria-label={`Ảnh ${i + 1}`}
              aria-pressed={selected}
              className={`overflow-hidden rounded-lg border bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E77600] ${
                selected
                  ? 'border-[#2162A1] ring-1 ring-[#2162A1]'
                  : 'border-[#D5D9D9] hover:border-[#007185]'
              }`}
              style={thumbStyle}
            >
              {src
                ? <img src={src} alt="" className="h-full w-full object-cover" />
                : <UploadPlaceholder zone="IMAGE" compact radius={8} />}
            </button>
          );
        })}

        {hasVideoSlot && (
          <EditableZone zone="VIDEO">
            <button
              type="button"
              onClick={() => setActiveIdx(videoIndex)}
              onMouseEnter={() => setActiveIdx(videoIndex)}
              aria-label={videoSlot ? 'Video sản phẩm' : 'Thêm video sản phẩm'}
              aria-pressed={isVideoActive}
              className={`relative block shrink-0 overflow-hidden rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E77600] ${
                isVideoActive
                  ? 'border-[#2162A1] ring-1 ring-[#2162A1]'
                  : 'border-[#D5D9D9] hover:border-[#007185]'
              }`}
              style={thumbStyle}
            >
              {videoSlot
                ? <video src={videoSlot} muted className="h-full w-full object-cover" />
                : <UploadPlaceholder zone="VIDEO" compact radius={8} />}
              {videoSlot && (
                <span className="pointer-events-none absolute inset-0 grid place-items-center">
                  <span className="grid size-6 place-items-center rounded-full bg-black/60">
                    <Play size={11} className="ml-0.5 fill-white text-white" />
                  </span>
                </span>
              )}
            </button>
          </EditableZone>
        )}
      </div>

      <div className="min-w-0 grow">
        {isVideoActive ? (
          <EditableZone zone="VIDEO">
            <MainFrame>
              {activeSrc
                ? <video src={activeSrc} controls className="h-full w-full object-contain" />
                : <UploadPlaceholder zone="VIDEO" radius={8} label={`Upload video (${MAIN_W}×${MAIN_W})`} />}
              <ShareBtn />
            </MainFrame>
          </EditableZone>
        ) : (
          <MainFrame>
            {activeSrc ? (
              <img src={activeSrc} alt="Main product view" className="h-full w-full object-contain" />
            ) : (
              <UploadPlaceholder zone="IMAGE" radius={8} label={`Upload ảnh chính (${MAIN_W}×${MAIN_W})`} />
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
    className="relative overflow-hidden bg-white rounded-sm"
    style={{ width: MAIN_W, maxWidth: '100%', aspectRatio: '1 / 1' }}
  >
    {children}
  </div>
);

const ShareBtn = () => (
  <button
    className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white border border-[#D5D9D9] shadow-xs flex items-center justify-center text-gray-500 hover:text-gray-800 hover:shadow-md transition-all z-10"
    aria-label="Share product"
  >
    <Share2 size={15} />
  </button>
);

export default ClothingGallery;
