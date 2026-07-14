import React from 'react';
import { Search, ShoppingCart, Menu, Gift, ChevronDown } from 'lucide-react';

const SUB_NAV = [
  'Gifts', 'Best of Easter', 'Home Favorites', 'Fashion Finds',
  'Vintage', 'Registry', 'Gift Cards',
];

const EtsyHeaderDesktop = () => {
  return (
    <header className="bg-white">
      {/* Row 1: logo + search + account */}
      <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center gap-3">
        <div className="text-[28px] leading-none font-black tracking-tight mr-1" style={{ color: '#f1641e' }}>
          Etsy
        </div>

        <button className="flex items-center gap-1.5 text-sm text-gray-800 hover:bg-gray-100 px-2.5 py-2 rounded-full">
          <Menu size={18} />
          <span>Categories</span>
        </button>

        <div className="flex-grow max-w-3xl">
          <div className="relative">
            <input
              type="text"
              className="w-full border border-gray-800 rounded-full py-2.5 pl-4 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition"
              placeholder="Search for anything"
            />
            <button className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center text-white bg-[#f1641e] rounded-full hover:bg-orange-600 transition-colors">
              <Search size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-gray-800">
          <button className="text-sm font-medium hover:bg-gray-100 px-3 py-2 rounded-full whitespace-nowrap">Sign in</button>
          <button className="p-2 hover:bg-gray-100 rounded-full"><Gift size={22} /></button>
          <button className="p-2 hover:bg-gray-100 rounded-full relative"><ShoppingCart size={22} /></button>
        </div>
      </div>

      {/* Row 2: sub-nav */}
      <div className="border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-4 flex items-center justify-center gap-7 text-[13px] text-gray-700 py-2.5">
          {SUB_NAV.map((item) => (
            <span key={item} className="hover:text-gray-900 hover:underline underline-offset-4 cursor-pointer whitespace-nowrap flex items-center gap-1">
              {item}
              {item === 'Gifts' && <ChevronDown size={13} className="text-gray-500" />}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
};

export default EtsyHeaderDesktop;
