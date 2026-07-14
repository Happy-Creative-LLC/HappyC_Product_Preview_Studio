import React from 'react';
import { Search, ShoppingCart, Menu, Heart } from 'lucide-react';

// Mobile Etsy header — 2 rows like the real Etsy app:
// [logo · Sign in · ♥ · cart] / [☰ · full-width search].
const EtsyHeaderMobile = () => {
  return (
    <header className="bg-white border-b border-gray-200">
      {/* Row 1 */}
      <div className="flex items-center px-4 pt-3 pb-1.5">
        <div className="text-[26px] leading-none font-black tracking-tight" style={{ color: '#f1641e' }}>
          Etsy
        </div>
        <div className="ml-auto flex items-center gap-0.5">
          <button className="min-h-[44px] px-2 text-sm font-medium text-gray-800 rounded active:bg-gray-100">
            Sign in
          </button>
          <button className="w-11 h-11 flex items-center justify-center text-gray-800 rounded-full active:bg-gray-100" aria-label="Favorites">
            <Heart size={22} />
          </button>
          <button className="w-11 h-11 flex items-center justify-center text-gray-800 rounded-full active:bg-gray-100" aria-label="Cart">
            <ShoppingCart size={22} />
          </button>
        </div>
      </div>

      {/* Row 2 */}
      <div className="flex items-center gap-2 px-4 pb-3">
        <button className="w-11 h-11 -ml-2 flex items-center justify-center text-gray-800 rounded-full active:bg-gray-100 flex-shrink-0" aria-label="Menu">
          <Menu size={24} />
        </button>
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search for anything"
            className="w-full border border-gray-800 rounded-full py-2.5 pl-4 pr-12 text-[15px] focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          <button
            className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center text-white bg-[#f1641e] rounded-full active:bg-orange-600"
            aria-label="Search"
          >
            <Search size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default EtsyHeaderMobile;
