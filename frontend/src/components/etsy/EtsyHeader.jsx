import React from 'react';
import { Search, ShoppingCart, Menu, User, Heart } from 'lucide-react';

const EtsyHeader = () => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="text-orange-500 font-serif text-3xl font-bold tracking-tighter mr-4">
          Etsy
        </div>

        {/* Search Bar */}
        <div className="flex-grow max-w-2xl hidden md:block">
          <div className="relative">
            <input 
              type="text" 
              className="w-full border-2 border-gray-900 rounded-full py-2 pl-4 pr-12 focus:outline-none focus:bg-gray-100 transition-colors"
              placeholder="Search for anything"
            />
            <button className="absolute right-0 top-0 h-full px-4 text-white bg-orange-500 rounded-r-full hover:bg-orange-600 transition-colors">
              <Search size={20} />
            </button>
          </div>
        </div>

        {/* Right Nav */}
        <div className="flex items-center space-x-2 md:space-x-4 ml-4 text-gray-800">
          <button className="p-2 hover:bg-gray-100 rounded-full hidden sm:block">
            <span className="text-sm font-semibold">Sign in</span>
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Heart size={20} />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full flex items-center">
            <ShoppingCart size={20} />
          </button>
        </div>
      </div>
      
      {/* Categories */}
      <div className="max-w-[1400px] mx-auto px-8 hidden md:flex justify-between items-center text-sm font-medium text-gray-700 py-2">
        <span className="hover:bg-gray-100 px-3 py-1 rounded-full cursor-pointer">Gifts</span>
        <span className="hover:bg-gray-100 px-3 py-1 rounded-full cursor-pointer">Jewelry & Accessories</span>
        <span className="hover:bg-gray-100 px-3 py-1 rounded-full cursor-pointer">Clothing & Shoes</span>
        <span className="hover:bg-gray-100 px-3 py-1 rounded-full cursor-pointer">Home & Living</span>
        <span className="hover:bg-gray-100 px-3 py-1 rounded-full cursor-pointer">Wedding & Party</span>
        <span className="hover:bg-gray-100 px-3 py-1 rounded-full cursor-pointer">Toys & Entertainment</span>
        <span className="hover:bg-gray-100 px-3 py-1 rounded-full cursor-pointer">Art & Collectibles</span>
      </div>
    </header>
  );
};

export default EtsyHeader;
