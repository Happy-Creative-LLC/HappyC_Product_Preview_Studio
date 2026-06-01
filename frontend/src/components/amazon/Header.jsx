import React, { useState } from 'react';
import { Search, ShoppingCart, MapPin, Menu } from 'lucide-react';
import { useProductStore } from '../../stores/productStore';

const Header = () => {
  return (
    <header className="w-full">
      {/* Top Nav */}
      <div className="bg-amazon-light_blue text-white flex items-center px-4 py-2 space-x-4 h-16">
        {/* Logo */}
        <div className="flex flex-col justify-center mt-1">
          <div className="cursor-pointer border border-transparent hover:border-white p-1 rounded-sm flex items-center justify-center">
            <img src="/logo.webp" alt="Amazon Logo" className="h-8 object-contain mt-1" />
          </div>
        </div>
        
        {/* Deliver to */}
        <div className="hidden sm:flex flex-col border border-transparent hover:border-white p-1 cursor-pointer rounded-sm">
          <span className="text-xs text-gray-300 ml-4">Deliver to</span>
          <span className="text-sm font-bold flex items-center"><MapPin size={16} className="mr-1" /> New York 10001</span>
        </div>

        {/* Search */}
        <div className="flex-grow hidden md:flex items-center bg-white rounded overflow-hidden h-10 mx-4">
          <select className="bg-gray-100 border-r border-gray-300 text-black px-2 h-full text-sm outline-none cursor-pointer">
            <option>All</option>
          </select>
          <input type="text" className="flex-grow h-full px-3 text-black outline-none" placeholder="shirt" />
          <div className="bg-amazon-yellow w-12 h-full flex items-center justify-center cursor-pointer hover:bg-yellow-500">
            <Search size={20} className="text-black" />
          </div>
        </div>

        {/* Right side items */}
        <div className="hidden lg:flex flex-col border border-transparent hover:border-white p-1 cursor-pointer rounded-sm">
          <div className="text-xs text-gray-300 flex items-center"><img src="https://upload.wikimedia.org/wikipedia/en/thumb/a/a4/Flag_of_the_United_States.svg/1200px-Flag_of_the_United_States.svg.png" className="w-5 h-3 mr-1" /> EN</div>
        </div>

        <div className="hidden lg:flex flex-col border border-transparent hover:border-white p-1 cursor-pointer rounded-sm">
          <span className="text-xs text-gray-300">Hello, sign in</span>
          <span className="text-sm font-bold">Account & Lists</span>
        </div>
        
        <div className="hidden lg:flex flex-col border border-transparent hover:border-white p-1 cursor-pointer rounded-sm">
          <span className="text-xs text-gray-300">Returns</span>
          <span className="text-sm font-bold">& Orders</span>
        </div>

        <div className="flex items-center border border-transparent hover:border-white p-1 cursor-pointer rounded-sm">
          <div className="relative flex items-center">
            <ShoppingCart size={32} />
            <span className="absolute top-1 left-[14px] text-amazon-yellow font-bold text-sm">0</span>
          </div>
          <span className="hidden sm:block font-bold mt-3 ml-1 text-sm">Cart</span>
        </div>
      </div>

      {/* Sub Nav */}
      <div className="bg-amazon-dark_blue text-white text-sm px-4 h-10 flex items-center space-x-4 overflow-x-auto whitespace-nowrap hide-scrollbar">
        <div className="flex items-center font-bold cursor-pointer border border-transparent hover:border-white p-1 rounded-sm"><Menu size={20} className="mr-1" /> All</div>
        <span className="cursor-pointer border border-transparent hover:border-white p-1 rounded-sm">Health AI</span>
        <span className="cursor-pointer border border-transparent hover:border-white p-1 rounded-sm">Amazon Haul</span>
        <span className="cursor-pointer border border-transparent hover:border-white p-1 rounded-sm">Medical Care</span>
        <span className="cursor-pointer border border-transparent hover:border-white p-1 rounded-sm">Amazon Basics</span>
        <span className="cursor-pointer border border-transparent hover:border-white p-1 rounded-sm">Best Sellers</span>
        <span className="cursor-pointer border border-transparent hover:border-white p-1 rounded-sm">Prime</span>
        <span className="cursor-pointer border border-transparent hover:border-white p-1 rounded-sm">Today's Deals</span>
        <span className="cursor-pointer border border-transparent hover:border-white p-1 rounded-sm">Books</span>
        <span className="cursor-pointer border border-transparent hover:border-white p-1 rounded-sm">New Releases</span>
      </div>

      {/* Fashion Sub-Nav (Case 1 Specific) */}
      <div className="bg-white border-b border-gray-200 text-sm px-4 py-2 flex items-center justify-between text-gray-800 shadow-sm">
        <div className="font-bold text-lg mr-8 whitespace-nowrap">Amazon Fashion</div>
        <div className="flex space-x-6 text-sm font-medium flex-grow overflow-x-auto hide-scrollbar justify-center">
          <span className="cursor-pointer hover:text-orange-500 hover:underline">Women</span>
          <span className="cursor-pointer hover:text-orange-500 hover:underline">Men</span>
          <span className="cursor-pointer hover:text-orange-500 hover:underline">Kids</span>
          <span className="cursor-pointer hover:text-orange-500 hover:underline">Luggage</span>
          <span className="cursor-pointer hover:text-orange-500 hover:underline">Sales & Deals</span>
          <span className="cursor-pointer hover:text-orange-500 hover:underline">New Arrivals</span>
          <span className="cursor-pointer hover:text-orange-500 hover:underline">Amazon Brands</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
