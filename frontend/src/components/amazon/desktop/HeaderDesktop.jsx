import React from 'react';
import { Search, ShoppingCart, MapPin, Menu, ChevronDown } from 'lucide-react';
import AmazonLogo from '../AmazonLogo';

/* ── Sub-nav items in exact real-Amazon order ── */
const NAV_ITEMS = [
  { label: 'Health AI' },
  { label: 'Amazon Haul' },
  { label: 'Medical Care', hasChevron: true },
  { label: 'Whole Foods' },
  { label: 'Amazon Basics' },
  { label: 'Best Sellers' },
  { label: 'Prime', hasChevron: true },
  { label: "Today's Deals" },
  { label: 'New Releases' },
  { label: 'Books' },
  { label: 'Groceries' },
  { label: 'Gift Cards' },
  { label: 'Sell' },
  { label: 'Music' },
  { label: 'Registry' },
  { label: 'Fashion' },
  { label: 'Amazon Home' },
  { label: 'Automotive' },
  { label: 'Toys & Games', hasChevron: true },
];

/* ── Fashion bar categories (real Amazon order) ── */
const FASHION_CATS = [
  'Women', 'Men', 'Kids', 'Luggage', 'Sales & Deals',
  'New Arrivals', 'Amazon Brands', 'Amazon Luxury',
];

const HeaderDesktop = ({ caseType = 1 }) => {
  const showFashionBar = Number(caseType) === 1;

  return (
    <header className="w-full sticky top-0 z-30 shadow-md">
      {/* Top Bar */}
      <div className="bg-[#131921] text-white flex items-center px-3 gap-1 h-[60px]">
        {/* Logo */}
        <div className="flex-shrink-0 border border-transparent hover:border-white rounded-sm p-1 cursor-pointer">
          <AmazonLogo className="h-[30px] w-auto" />
        </div>

        {/* Deliver to */}
        <div className="flex flex-col ml-1 border border-transparent hover:border-white rounded-sm px-1 py-0.5 cursor-pointer flex-shrink-0">
          <span className="text-[11px] text-[#CCCCCC] leading-none ml-4">Deliver to</span>
          <span className="text-[13px] font-bold leading-tight flex items-center gap-0.5">
            <MapPin size={13} className="text-white" /> New York 10001
          </span>
        </div>

        {/* Search */}
        <div className="flex-1 flex items-center bg-white rounded h-[38px] mx-2 overflow-hidden">
          <select
            className="h-full bg-[#F3F3F3] border-r border-[#CDCDCD] text-[#111] text-xs px-2 outline-none cursor-pointer"
            style={{ minWidth: 52, maxWidth: 56 }}
          >
            <option>All</option>
            <option>Clothing</option>
            <option>Home &amp; Kitchen</option>
          </select>
          <input
            type="text"
            placeholder="Search Amazon"
            className="flex-1 h-full px-3 text-[#111] text-sm outline-none min-w-0"
          />
          <button className="h-full w-[46px] flex items-center justify-center bg-[#FF9900] hover:bg-[#E47911] transition-colors flex-shrink-0">
            <Search size={20} className="text-[#111]" />
          </button>
        </div>

        {/* Language */}
        <div className="hidden xl:flex items-center gap-0.5 border border-transparent hover:border-white rounded-sm px-1.5 py-1 cursor-pointer flex-shrink-0 select-none">
          <span className="text-[12px]">🇺🇸</span>
          <span className="font-bold text-[13px] ml-0.5">EN</span>
          <ChevronDown size={11} className="text-[#CCCCCC]" />
        </div>

        {/* Account & Lists */}
        <div className="hidden lg:flex flex-col border border-transparent hover:border-white rounded-sm px-1.5 py-0.5 cursor-pointer flex-shrink-0 select-none">
          <span className="text-[11px] text-[#CCCCCC] leading-none">Hello, sign in</span>
          <span className="text-[13px] font-bold leading-tight flex items-center gap-0.5">
            Account &amp; Lists <ChevronDown size={11} />
          </span>
        </div>

        {/* Returns & Orders */}
        <div className="hidden lg:flex flex-col border border-transparent hover:border-white rounded-sm px-1.5 py-0.5 cursor-pointer flex-shrink-0 select-none">
          <span className="text-[11px] text-[#CCCCCC] leading-none">Returns</span>
          <span className="text-[13px] font-bold leading-tight">&amp; Orders</span>
        </div>

        {/* Cart */}
        <div className="flex items-end border border-transparent hover:border-white rounded-sm px-1 cursor-pointer flex-shrink-0 select-none">
          <div className="relative">
            <ShoppingCart size={34} />
            <span className="absolute -top-1 left-[14px] text-[#FF9900] font-bold text-[14px] leading-none">0</span>
          </div>
          <span className="font-bold text-[13px] mb-0.5 ml-0.5">Cart</span>
        </div>
      </div>

      {/* Sub Nav */}
      <div
        className="bg-[#232F3E] text-white text-[13px] px-2 h-[38px] flex items-center overflow-x-auto whitespace-nowrap gap-0"
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="flex items-center font-bold cursor-pointer border border-transparent hover:border-white rounded-sm px-2 py-1 flex-shrink-0 gap-1">
          <Menu size={18} /> All
        </div>
        {NAV_ITEMS.map(item => (
          <span
            key={item.label}
            className="cursor-pointer border border-transparent hover:border-white rounded-sm px-2 py-1 flex-shrink-0 flex items-center gap-0.5"
          >
            {item.label}
            {item.hasChevron && <ChevronDown size={11} className="text-[#CCCCCC] ml-0.5" />}
          </span>
        ))}
      </div>

      {/* Fashion Sub-Nav (Case 1 only) */}
      {showFashionBar && (
        <div
          className="bg-white border-b border-gray-200 px-4 h-[36px] flex items-center shadow-sm overflow-x-auto gap-0"
          style={{ scrollbarWidth: 'none' }}
        >
          <span className="font-bold text-[15px] text-gray-900 whitespace-nowrap mr-6 flex-shrink-0">
            Amazon Fashion
          </span>
          <div className="flex flex-1 items-center justify-between">
            {FASHION_CATS.map(cat => (
              <span
                key={cat}
                className="cursor-pointer hover:underline hover:text-orange-500 whitespace-nowrap text-[13px] text-gray-700"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default HeaderDesktop;
