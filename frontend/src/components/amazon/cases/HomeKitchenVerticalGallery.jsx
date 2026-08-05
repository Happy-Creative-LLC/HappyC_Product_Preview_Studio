import React, { useState } from 'react';
import EditableZone from '../../shared/EditableZone';
import UploadPlaceholder from '../UploadPlaceholder';
import ZoomLens from '../ZoomLens';
import amazonCase2Tokens from '../amazonCase2Tokens';

const { thumbRail, videoSlot, moreBadge } = amazonCase2Tokens;

// How many image thumbnails the rail shows before collapsing the rest behind
// a "+N" badge on the last visible one. This is a LAYOUT constant (how many
// slots fit visually) — NOT the seller-facing upload limit for Case 2, which
// is Open Issue #1 in CLAUDE.md and still unresolved. images/videos below are
// rendered fully dynamically from productData; nothing about the actual
// allowed upload count is hardcoded here.
const VISIBLE_THUMB_LIMIT = 6;

// Case 2 (Home & Kitchen) desktop gallery — vertical thumbnail rail + hover
// zoom lens. Thumbnail/video counts are 100% data-driven (productData.images /
// productData.videos): 0 images renders 0 thumbs (just an upload prompt in
// the main viewer), N images renders N thumbs (collapsing into "+N" past
// VISIBLE_THUMB_LIMIT). No fixed image/video count is assumed anywhere.
const HomeKitchenVerticalGallery = ({ images = [], videos = [], onCommentClick }) => {
  // activeIdx: 0..images.length-1 = image thumbs, images.length = video slot
  const [activeIdx, setActiveIdx] = useState(0);
  // Video nào đang phát trong slot video. Rail giữ MỘT ô gộp "N VIDEOS" đúng như
  // Amazon thật; chọn giữa các video diễn ra ở khung chính bên dưới player.
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);

  const hasVideo = videos.length > 0;
  const safeVideoIdx = Math.min(activeVideoIdx, Math.max(videos.length - 1, 0));
  const activeVideoSrc = videos[safeVideoIdx] ?? null;
  const videoIdx = images.length; // video slot's virtual index, if present
  const isVideoActive = hasVideo && activeIdx === videoIdx;
  const activeImageSrc = !isVideoActive ? images[activeIdx] ?? null : null;

  const visibleThumbs = images.slice(0, VISIBLE_THUMB_LIMIT);
  const hiddenCount = Math.max(0, images.length - VISIBLE_THUMB_LIMIT);

  const thumbBtnStyle = {
    width: thumbRail.buttonSize,
    height: thumbRail.buttonSize,
    borderRadius: thumbRail.buttonRadius,
  };
  const thumbImgStyle = {
    width: thumbRail.imageSize,
    height: thumbRail.imageSize,
    borderRadius: thumbRail.imageRadius,
  };

  return (
    <div className="flex flex-row gap-3">
      {/* ── Vertical thumbnail rail — width = thumbRail.containerWidth ── */}
      <div className="flex flex-col flex-shrink-0" style={{ width: thumbRail.containerWidth }}>
        {visibleThumbs.map((src, i) => {
          const isLastVisible = i === visibleThumbs.length - 1;
          const showMoreBadge = isLastVisible && hiddenCount > 0;
          const selected = !isVideoActive && activeIdx === i;
          const isLastRailItem = isLastVisible && !hasVideo;

          return (
            // marginBottom lives on this OUTER div (not passed as a `style`
            // prop to EditableZone — EditableZone's contract only forwards
            // zone/onCommentClick/className/children/id/group, no `style`).
            <div key={i} style={{ marginBottom: isLastRailItem ? 0 : thumbRail.gapBottom }}>
              <EditableZone zone="IMAGE" onCommentClick={onCommentClick} className="rounded-none">
                <button
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  onMouseEnter={() => setActiveIdx(i)}
                  aria-label={`Ảnh ${i + 1}${showMoreBadge ? ` (+${hiddenCount} ảnh khác)` : ''}`}
                  aria-pressed={selected}
                  className="relative flex items-center justify-center border transition-colors"
                  style={{
                    ...thumbBtnStyle,
                    borderColor: selected ? thumbRail.borderSelected : thumbRail.borderIdle,
                    borderWidth: 1,
                  }}
                >
                  <img
                    src={src}
                    alt=""
                    style={{ ...thumbImgStyle, objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                  />
                  {showMoreBadge && (
                    <span
                      className="absolute inset-0 flex items-center justify-center font-bold"
                      style={{
                        width: moreBadge.size,
                        height: moreBadge.size,
                        margin: 'auto',
                        background: moreBadge.bg,
                        color: moreBadge.textColor,
                        fontSize: moreBadge.textSize,
                        borderRadius: thumbRail.imageRadius,
                      }}
                    >
                      +{hiddenCount}
                    </span>
                  )}
                </button>
              </EditableZone>
            </div>
          );
        })}

        {/* Video slot — ONE aggregated slot for all videos, dynamic count label.
            Play/overlay badge is expected baked into the uploaded thumbnail
            itself (no extra CSS overlay layer drawn here). */}
        {hasVideo && (
          <EditableZone zone="VIDEO" onCommentClick={onCommentClick} className="rounded-none">
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => setActiveIdx(videoIdx)}
                onMouseEnter={() => setActiveIdx(videoIdx)}
                aria-label={`${videos.length} video sản phẩm`}
                aria-pressed={isVideoActive}
                className="flex items-center justify-center border overflow-hidden transition-colors"
                style={{
                  width: thumbRail.buttonSize,
                  height: videoSlot.height,
                  borderRadius: thumbRail.buttonRadius,
                  borderColor: isVideoActive ? thumbRail.borderSelected : thumbRail.borderIdle,
                  borderWidth: 1,
                }}
              >
                <video
                  src={videos[safeVideoIdx]}
                  muted
                  style={{ width: thumbRail.imageSize, height: videoSlot.height - 2, borderRadius: thumbRail.imageRadius, objectFit: 'cover' }}
                />
              </button>
              <span
                className="mt-1 text-center leading-tight"
                style={{
                  fontSize: videoSlot.labelFontSize,
                  fontWeight: videoSlot.labelFontWeight,
                  color: videoSlot.labelColor,
                }}
              >
                {videos.length} VIDEO{videos.length !== 1 ? 'S' : ''}
              </span>
            </div>
          </EditableZone>
        )}
      </div>

      {/* ── Main viewer ──
          Case 2's main-image box size isn't in the measured token set — kept
          fluid (square) here; ZoomLens self-measures the real rendered size
          at hover time, so the 2.5× mapping stays accurate regardless. */}
      <div className="flex-grow min-w-0" style={{ maxWidth: 480 }}>
        {isVideoActive ? (
          <EditableZone zone="VIDEO" onCommentClick={onCommentClick}>
            <div className="w-full overflow-hidden rounded bg-black" style={{ aspectRatio: '1 / 1' }}>
              <video
                key={activeVideoSrc}
                src={activeVideoSrc}
                controls
                className="w-full h-full"
                style={{ objectFit: 'contain' }}
              />
            </div>

            {/* Chọn video khi có nhiều hơn 1 — rail chỉ có một ô gộp nên
                việc chuyển video phải nằm ở đây, nếu không các video sau
                sẽ không có cách nào xem được. */}
            {videos.length > 1 && (
              <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Chọn video">
                {videos.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveVideoIdx(idx)}
                    aria-pressed={safeVideoIdx === idx}
                    className={`rounded border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      safeVideoIdx === idx
                        ? 'border-[#007185] bg-[#e7f3f5] text-[#007185]'
                        : 'border-[#D5D9D9] text-gray-600 hover:border-[#007185]'
                    }`}
                  >
                    Video {idx + 1}
                  </button>
                ))}
              </div>
            )}
          </EditableZone>
        ) : (
          <EditableZone zone="IMAGE" onCommentClick={onCommentClick}>
            <div className="relative w-full overflow-hidden rounded bg-white" style={{ aspectRatio: '1 / 1' }}>
              <ZoomLens src={activeImageSrc}>
                {activeImageSrc ? (
                  <img
                    src={activeImageSrc}
                    alt="Main product view"
                    className="w-full h-full select-none"
                    style={{ objectFit: 'cover' }}
                    draggable={false}
                  />
                ) : (
                  <UploadPlaceholder zone="IMAGE" radius={8} label="Upload ảnh chính" />
                )}
              </ZoomLens>
            </div>
          </EditableZone>
        )}
      </div>
    </div>
  );
};

export default HomeKitchenVerticalGallery;
