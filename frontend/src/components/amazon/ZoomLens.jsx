import { useRef, useState } from 'react';
import amazonCase2Tokens from './amazonCase2Tokens';

const { lensWidth, lensHeight, panelWidth, panelHeight, panelGap, magnification } =
  amazonCase2Tokens.zoomLens;

// ZoomLens — wraps the main product image with a hover lens + magnified side
// panel. Case-agnostic (only the caller's thumbnail-rail direction differs
// between Case 2 and Case 3), so this is shared under components/amazon/
// alongside ProductGallery.jsx rather than living inside cases/.
//
// Mapping (đã kiểm chứng): zoomImg.left = -(lens.x * magnification),
//                           zoomImg.top  = -(lens.y * magnification)
// where lens.x/lens.y are the lens box's TOP-LEFT corner, clamped so the lens
// never leaves the base image bounds.
//
// Props:
//   src        — displayed (low-res) image, also what the lens hovers over
//   hiResSrc   — optional high-res source for the magnified panel (falls back to src)
//   imgWidth   — optional explicit displayed width of the base image (px)
//   imgHeight  — optional explicit displayed height of the base image (px)
//   children   — the base <img> (or placeholder) being wrapped
// If imgWidth/imgHeight are omitted, ZoomLens self-measures the container's
// live rendered size on each mouse move (always accurate, never fabricated).
const ZoomLens = ({ src, hiResSrc, imgWidth, imgHeight, alt = 'Product image', children }) => {
  const containerRef = useRef(null);
  const [hover, setHover] = useState(false);
  const [lens, setLens] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [visiblePanelWidth, setVisiblePanelWidth] = useState(panelWidth);

  const zoomSrc = hiResSrc || src;

  const handleMouseEnter = () => {
    setHover(true);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const availableWidth = window.innerWidth - rect.right - panelGap - 16;
      setVisiblePanelWidth(Math.min(panelWidth, Math.max(280, availableWidth)));
    }
    const galleryColumn = containerRef.current?.closest('[data-amazon-gallery-column]');
    if (galleryColumn) galleryColumn.style.zIndex = '40';
  };

  const handleMouseLeave = () => {
    setHover(false);
    const galleryColumn = containerRef.current?.closest('[data-amazon-gallery-column]');
    if (galleryColumn) galleryColumn.style.zIndex = '';
  };

  const handleMouseMove = (e) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const availableWidth = window.innerWidth - rect.right - panelGap - 16;
    setVisiblePanelWidth(Math.min(panelWidth, Math.max(280, availableWidth)));

    const w = imgWidth || rect.width;
    const h = imgHeight || rect.height;

    // Cursor position relative to the container, lens centered on cursor,
    // then clamped so it never leaves the image bounds (no error at edges).
    let x = e.clientX - rect.left - lensWidth / 2;
    let y = e.clientY - rect.top - lensHeight / 2;
    x = Math.max(0, Math.min(x, Math.max(0, rect.width - lensWidth)));
    y = Math.max(0, Math.min(y, Math.max(0, rect.height - lensHeight)));

    setLens({ x, y, w, h });
  };

  // No real image yet (upload placeholder) — no zoom interaction, just render children.
  if (!src) {
    return <div ref={containerRef} className="relative w-full h-full">{children}</div>;
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      style={{ cursor: 'crosshair', zIndex: hover ? 40 : 'auto' }}
    >
      {children}

      {hover && (
        <>
          {/* Lens — vùng trong suốt bám theo cursor, như Amazon product zoom. */}
          <div
            data-testid="zoom-lens"
            className="absolute pointer-events-none border border-dotted shadow-md"
            style={{
              left: lens.x,
              top: lens.y,
              width: lensWidth,
              height: lensHeight,
              zIndex: 20,
              backgroundColor: 'rgba(0,113,133,0.14)',
              borderColor: 'rgba(0,113,133,0.8)',
            }}
          />

          {/* Panel phóng đại nằm cạnh ảnh; tự co theo chiều rộng viewport. */}
          <div
            data-testid="zoom-panel"
            className="absolute top-0 border border-gray-200 bg-white shadow-xl overflow-hidden"
            style={{
              left: `calc(100% + ${panelGap}px)`,
              width: visiblePanelWidth,
              height: panelHeight,
              zIndex: 30,
            }}
          >
            <img
              src={zoomSrc}
              alt={alt}
              draggable={false}
              style={{
                position: 'absolute',
                left: -(lens.x * magnification),
                top: -(lens.y * magnification),
                width: lens.w * magnification,
                height: lens.h * magnification,
                maxWidth: 'none',
                objectFit: 'cover',
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ZoomLens;
