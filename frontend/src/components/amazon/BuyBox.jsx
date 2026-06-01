import React from 'react';
import { MapPin, Lock } from 'lucide-react';

const BuyBox = ({ price, brand }) => {
  const currentPrice = Number(price) || 0;
  
  return (
    <div className="border border-gray-300 rounded-lg p-4 w-full max-w-[320px] mb-4 text-sm font-sans text-gray-900 shadow-sm">
      
      {/* Subscribe & Save Mock */}
      <div className="flex items-center space-x-2 font-bold text-gray-900 border-b pb-3 mb-3 cursor-pointer hover:bg-gray-50 -mx-4 px-4">
        <input type="radio" className="w-4 h-4 text-orange-500 accent-orange-500" readOnly />
        <span>Subscribe & Save: <span className="text-orange-700 font-bold ml-1">$17.08</span></span>
      </div>

      {/* One-time purchase */}
      <div className="flex items-start space-x-2 font-bold text-gray-900 mb-2 bg-gray-50 -mx-4 px-4 py-2 border-l-4 border-l-orange-500">
        <input type="radio" checked readOnly className="w-4 h-4 mt-1 accent-orange-500" />
        <div className="flex flex-col">
          <span>One-time purchase</span>
          <div className="flex items-baseline space-x-1 text-red-700 mt-1">
            <span className="text-sm font-medium align-top mt-1">$</span>
            <span className="text-xl font-medium">{Math.floor(currentPrice)}</span>
            <span className="text-sm font-medium align-top mt-1">{(currentPrice % 1).toFixed(2).substring(2)}</span>
          </div>
        </div>
      </div>

      <div className="text-sm mb-3">
        <span>Get <b>Fast, Free Shipping</b> with <br/><span className="text-blue-500 hover:underline cursor-pointer">Amazon Prime</span></span>
      </div>

      <div className="text-sm text-gray-900 mb-2">
        <span className="font-bold">FREE delivery</span> <span className="font-bold">Thursday, June 4</span> on orders shipped by Amazon over $35
      </div>

      <div className="text-sm text-gray-900 mb-4">
        Or <span className="text-blue-500 hover:underline cursor-pointer">Prime members</span> get FREE delivery <b>Today 1 PM - 6 PM</b> on eligible orders. Order within <span className="text-green-700">3 hrs 22 mins</span>. <span className="text-blue-500 hover:underline cursor-pointer">Join Prime</span>
      </div>

      <div className="flex items-start text-blue-600 hover:text-orange-500 hover:underline cursor-pointer mb-4 text-sm font-bold">
        <MapPin size={16} className="mr-1 mt-0.5 text-black" />
        <span>Deliver to New York 10001</span>
      </div>

      <h2 className="text-lg text-green-700 font-medium mb-3">In Stock</h2>

      {/* Quantity */}
      <div className="bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg px-3 py-1 mb-4 flex items-center justify-between cursor-pointer shadow-sm w-max min-w-[100px]">
        <span>Quantity: 1</span>
        <span className="text-xs ml-2">˅</span>
      </div>

      {/* Buttons */}
      <button className="w-full bg-amazon-yellow hover:bg-yellow-500 text-black py-2 rounded-full mb-2 shadow-sm font-medium text-sm">
        Add to cart
      </button>
      <button className="w-full bg-orange-400 hover:bg-orange-500 text-black py-2 rounded-full mb-4 shadow-sm font-medium text-sm">
        Buy Now
      </button>

      {/* Security */}
      <div className="flex items-center text-sm text-gray-500 mb-3 hover:text-orange-500 cursor-pointer w-max">
        <Lock size={14} className="mr-2" />
        <span>Secure transaction</span>
      </div>

      {/* Seller Info */}
      <div className="grid grid-cols-[1fr_2fr] gap-x-2 gap-y-1 text-xs text-gray-500 mb-4">
        <span>Ships from</span>
        <span className="text-gray-900">Amazon.com</span>
        <span>Sold by</span>
        <span className="text-blue-500 hover:underline cursor-pointer truncate">{brand || 'Amazon.com'}</span>
        <span>Returns</span>
        <span className="text-blue-500 hover:underline cursor-pointer">Eligible for Return, Refund or Replacement within 30 days of receipt</span>
      </div>

    </div>
  );
};

export default BuyBox;
