import React, { useState, useEffect } from 'react';

// Sticky bottom action bar (real Amazon app pattern): slides up once the user
// scrolls past the in-flow buy box, keeping the primary CTA always reachable.
const MobileStickyCTA = ({ price }) => {
  const [visible, setVisible] = useState(false);
  const cur = Number(price) || 0;

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] px-4 pt-2.5 flex items-center gap-3 transition-transform duration-200 ease-out ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{ paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom))' }}
      aria-hidden={!visible}
    >
      <div className="flex items-start leading-none text-gray-900">
        <span className="text-[12px] relative top-0.5">$</span>
        <span className="text-[20px] font-medium">{Math.floor(cur)}</span>
        <span className="text-[12px] relative top-0.5">{(cur % 1).toFixed(2).substring(2)}</span>
      </div>
      <button
        tabIndex={visible ? 0 : -1}
        className="flex-1 min-h-[44px] bg-[#FFD814] hover:bg-[#F7CA00] active:bg-[#DDB100] border border-[#FCD200] rounded-full text-[15px] font-medium shadow-[0_1px_2px_rgba(15,17,17,0.15)]"
      >
        Customize now
      </button>
    </div>
  );
};

export default MobileStickyCTA;
