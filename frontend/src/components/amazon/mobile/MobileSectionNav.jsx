import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

// In-page section tabs (real Amazon app pattern): hidden at the very top, then
// slides down and stays FIXED at the top once the user scrolls past the gallery.
// Content scrolls underneath it. Scroll-spy highlights the section in view.
const SECTIONS = [
  { id: 'top',         label: 'Top', isTop: true },
  { id: 'amz-details', label: 'Details' },
  { id: 'amz-explore', label: 'Explore' },
  { id: 'amz-reviews', label: 'Reviews' },
];

const SHOW_AFTER = 300; // px scrolled before the bar appears

const MobileSectionNav = () => {
  const [active, setActive] = useState('top');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const ids = SECTIONS.filter(s => !s.isTop).map(s => s.id);
    const els = ids.map(id => document.getElementById(id)).filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        const inView = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (inView[0] && window.scrollY >= SHOW_AFTER) setActive(inView[0].target.id);
      },
      { rootMargin: '-52px 0px -55% 0px', threshold: 0 }
    );
    els.forEach(el => observer.observe(el));

    const onScroll = () => {
      const y = window.scrollY;
      setVisible(y > SHOW_AFTER);
      if (y < SHOW_AFTER) setActive('top');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => { observer.disconnect(); window.removeEventListener('scroll', onScroll); };
  }, []);

  const go = (s) => {
    if (s.isTop) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav
      className={`md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-md transition-transform duration-200 ease-out ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
      aria-hidden={!visible}
    >
      <div className="flex items-stretch">
        {SECTIONS.map((s) => {
          const isActive = active === s.id;
          return (
            <button
              key={s.id}
              onClick={() => go(s)}
              tabIndex={visible ? 0 : -1}
              aria-current={isActive ? 'true' : undefined}
              className={`flex-1 min-h-[48px] flex flex-col items-center justify-center leading-none text-[15px] border-b-2 transition-colors active:bg-gray-50 ${
                isActive ? 'border-[#E77600] text-[#C45500] font-medium' : 'border-transparent text-gray-800'
              }`}
            >
              {s.isTop && <ChevronUp size={16} className="mb-0.5" />}
              {s.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileSectionNav;
