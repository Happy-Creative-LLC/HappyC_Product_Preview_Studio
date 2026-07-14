import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import EditableZone from '../shared/EditableZone';
import UploadPlaceholder from './UploadPlaceholder';

// A+ "Featured content" carousel — structure measured from the real Amazon page.
// Viewport 1293×530 (100% + aspect-ratio), overflow hidden. Track width is
// total*100% (no fixed px width, no centering on the track itself) so each
// slide is an exact 1/total column and translateX(0%) always aligns slide[0]
// to the viewport's left edge. 300ms ease transition — no fade, no
// display:none. currentSlide is the single source of truth for both the
// transform and the active dot. Circular via modulo. No autoplay.
//
// Slides are DATA-DRIVEN (productData.aPlusSlides). Empty → one default upload
// slot. Each slide is its own IMAGE (red) EditableZone with id `aplus-slide-N`.
const AplusCarousel = ({ slides = [], onCommentClick }) => {
  const items = slides.length > 0 ? slides : [null]; // empty → 1 default placeholder slide
  const total = items.length;

  // SINGLE source of truth for BOTH the transform and the active dot.
  const [currentSlide, setCurrentSlide] = useState(0);

  const go = (n) => setCurrentSlide((c) => (c + n + total) % total);   // circular
  const goTo = (i) => setCurrentSlide(((i % total) + total) % total);

  return (
    <section
      role="region"
      aria-label="Featured content carousel"
      className="relative w-full max-w-[1293px] mx-auto"
    >
      {/* Viewport — clips the track; no width/centering here either */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: '1293 / 530' }}>
        {/* Track — width scales with slide count (total*100%), no fixed px
            width, no centering (mx-auto/justify-center/margin). Each slide is
            an exact 100/total % column, so translateX(0%) always puts
            slide[0] flush against the viewport's left edge. */}
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{
            width: `${total * 100}%`,
            transform: `translateX(-${(currentSlide * 100) / total}%)`,
          }}
        >
          {items.map((src, i) => (
            <div
              key={i}
              className="h-full flex-shrink-0"
              style={{ width: `${100 / total}%` }}
              aria-hidden={i !== currentSlide}
            >
              <EditableZone
                zone="IMAGE"
                group="red"
                id={`aplus-slide-${i + 1}`}
                onCommentClick={onCommentClick}
                className="w-full h-full"
              >
                <div className="w-full h-full overflow-hidden" style={{ borderRadius: 0 }}>
                  {src
                    ? <img src={src} alt={`A+ slide ${i + 1}`} loading="lazy" className="w-full h-full" style={{ objectFit: 'fill', borderRadius: 0 }} />
                    : <UploadPlaceholder zone="IMAGE" radius={0} label={`Upload slide A+ #${i + 1}`} />}
                </div>
              </EditableZone>
            </div>
          ))}
        </div>

        {/* Prev / Next arrows — full height, 84px, transparent, always visible */}
        <button
          onClick={() => go(-1)}
          aria-label="Previous slide"
          className="absolute left-0 top-0 h-full flex items-center justify-center text-gray-800 hover:bg-black/5 transition-colors z-20"
          style={{ width: 84, background: 'transparent' }}
        >
          <ChevronLeft size={40} strokeWidth={1.5} />
        </button>
        <button
          onClick={() => go(1)}
          aria-label="Next slide"
          className="absolute right-0 top-0 h-full flex items-center justify-center text-gray-800 hover:bg-black/5 transition-colors z-20"
          style={{ width: 84, background: 'transparent' }}
        >
          <ChevronRight size={40} strokeWidth={1.5} />
        </button>
      </div>

      {/* Dots — isActive is computed ONCE per dot from currentSlide and reused
          for aria-current AND background AND border. There is no second
          "activeDot"/"displayIndex" variable anywhere — this is the only
          place that decides dot color, and it reads the same currentSlide
          that drives the transform above. 15×15, active #DE7921, inactive
          white. No debounce/setTimeout guards on click — go()/goTo() always
          use the functional setState form so rapid clicks never get dropped. */}
      <div className="flex items-center justify-center gap-2 mt-3">
        {items.map((_, i) => {
          const isActive = i === currentSlide;
          return (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={isActive}
              className="rounded-full transition-colors"
              style={{
                width: 15,
                height: 15,
                background: isActive ? '#DE7921' : '#FFFFFF',
                border: isActive ? '1px solid #DE7921' : '1px solid #C7C7C7',
              }}
            />
          );
        })}
      </div>
    </section>
  );
};

export default AplusCarousel;
