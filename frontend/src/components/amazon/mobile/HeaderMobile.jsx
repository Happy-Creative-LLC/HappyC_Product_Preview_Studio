import React from 'react';
import { Search, ShoppingCart, MapPin, Menu, ChevronDown, ChevronRight, User } from 'lucide-react';
import AmazonLogo from '../AmazonLogo';

// Mobile header — stacked like the real Amazon app:
// [menu · logo · sign in · cart] / [full-width search] / [deliver-to].
const HeaderMobile = () => {
  return (
    <header className="w-full shadow-md bg-[#131921] text-white">
      {/* Row 1: menu · logo · sign in · cart */}
      <div className="flex items-center gap-2 px-3 h-12">
        <button
          className="w-11 h-11 -ml-2 flex items-center justify-center rounded active:bg-white/10"
          aria-label="Open menu"
        >
          <Menu size={26} />
        </button>
        <AmazonLogo className="h-[26px] w-auto" />

        <div className="ml-auto flex items-center gap-1">
          <button className="flex items-center h-11 px-1.5 rounded active:bg-white/10" aria-label="Sign in">
            <span className="text-[13px]">Sign in</span>
            <ChevronRight size={13} className="mx-0.5 text-[#CCCCCC]" />
            <User size={20} />
          </button>
          <button className="relative w-11 h-11 flex items-center justify-center rounded active:bg-white/10" aria-label="Cart, 0 items">
            <ShoppingCart size={26} />
            <span className="absolute top-1 right-1.5 text-[#FF9900] font-bold text-[12px] leading-none">0</span>
          </button>
        </div>
      </div>

      {/* Row 2: full-width search */}
      <div className="px-3 pb-2">
        <div className="flex items-center bg-white rounded-md h-10 overflow-hidden">
          <input
            type="text"
            placeholder="Search Amazon"
            className="flex-1 h-full px-3 text-[#111] text-[15px] outline-none min-w-0"
          />
          <button
            className="w-12 h-full flex items-center justify-center bg-[#FEBD69] active:bg-[#F3A847]"
            aria-label="Search"
          >
            <Search size={22} className="text-[#111]" />
          </button>
        </div>
      </div>

      {/* Row 3: deliver-to */}
      <div className="bg-[#232F3E] px-3 h-9 flex items-center gap-1 text-[13px] font-bold cursor-pointer active:bg-[#2d3d50]">
        <MapPin size={15} className="text-white" />
        <span>Deliver to New York 10001</span>
        <ChevronDown size={13} className="text-[#CCCCCC]" />
      </div>
    </header>
  );
};

export default HeaderMobile;
