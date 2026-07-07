import React, { useState } from 'react';
import { MapPin } from 'lucide-react';

const BuyBox = ({ price, brand }) => {
  const currentPrice = Number(price) || 0;
  const [qty, setQty] = useState(1);

  return (
    <div className="flex flex-col w-full max-w-[280px]">
      <div className="border border-gray-300 rounded-lg p-4 mb-4 text-sm font-sans text-gray-900 shadow-sm bg-white">
        
        {/* Price */}
        <div className="flex items-start mb-2">
          <span className="text-[14px] text-gray-900 font-medium relative top-1 mr-[1px]">$</span>
          <span className="text-[28px] text-gray-900 font-medium leading-none">{Math.floor(currentPrice)}</span>
          <span className="text-[14px] text-gray-900 font-medium relative top-1 ml-[1px]">{(currentPrice % 1).toFixed(2).substring(2)}</span>
        </div>

        {/* Delivery */}
        <div className="text-[14px] text-gray-900 mb-1">
          $7.99 delivery <span className="font-bold">June 16 - 25</span>.
        </div>
        <div className="text-[14px] text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer mb-3">
          Details
        </div>

        {/* Deliver To */}
        <div className="flex items-start text-[#007185] hover:text-[#C7511F] cursor-pointer mb-4 text-[13px] leading-tight">
          <MapPin size={16} className="mr-1 flex-shrink-0 text-black" />
          <span className="hover:underline">Deliver to New York<br/>10001</span>
        </div>

        {/* In Stock */}
        <div className="text-[18px] text-[#007600] mb-1">
          In stock
        </div>
        <div className="text-[14px] text-gray-900 mb-4">
          Usually ships within 4 to 5 days.
        </div>

        {/* Quantity */}
        <div className="mb-4 flex items-center gap-2">
          <label className="text-[13px] text-gray-700">Quantity:</label>
          <select
            value={qty}
            onChange={e => setQty(Number(e.target.value))}
            className="bg-[#F0F2F2] border border-[#D5D9D9] hover:bg-[#E3E6E6] rounded-md px-2 py-1 text-[13px] shadow-[0_1px_2px_rgba(15,17,17,0.15)] cursor-pointer outline-none"
          >
            {[1, 2, 3, 4, 5].map(n => <option key={n}>{n}</option>)}
          </select>
        </div>

        {/* Buttons */}
        <button className="w-full bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] hover:border-[#F2C200] text-[#0F1111] py-2 rounded-full mb-2 shadow-[0_1px_2px_rgba(15,17,17,0.15)] text-[14px]">
          Add to cart
        </button>
        <button className="w-full bg-[#FFA41C] hover:bg-[#FA8900] border border-[#FF8F00] hover:border-[#F28200] text-[#0F1111] py-2 rounded-full mb-4 shadow-[0_1px_2px_rgba(15,17,17,0.15)] text-[14px]">
          Buy Now
        </button>

        {/* Seller Info */}
        <div className="grid grid-cols-[3fr_4fr] gap-x-2 gap-y-1 text-[13px] text-gray-500 mb-4 items-start">
          <span>Shipper / Seller</span>
          <span className="text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer truncate">{brand || 'Amazon'}</span>
          
          <span>Returns</span>
          <span className="text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer leading-tight">FREE 30-day<br/>refund/replacement</span>
          
          <span className="mt-1">Payment</span>
          <span className="text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer mt-1">Secure transaction</span>
        </div>

        <div className="border-t border-[#D5D9D9] my-4"></div>

        {/* Add to List */}
        <button className="w-full bg-white hover:bg-[#F7FAFA] border border-[#D5D9D9] text-[#0F1111] py-1.5 rounded-md shadow-[0_1px_2px_rgba(15,17,17,0.15)] text-[13px] text-left px-3">
          Add to List
        </button>

      </div>

      {/* Other Sellers */}
      <div className="border border-gray-300 rounded-lg text-sm font-sans text-gray-900 shadow-sm bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-300 font-bold text-[16px]">
          Other sellers on Amazon
        </div>
        <div className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 text-[14px]">
          <div>
            New (3) from <span className="text-[13px] relative top-[-4px] ml-1">$</span><span className="text-[14px]">27</span><span className="text-[13px] relative top-[-4px]">99</span> + $7.99 shipping
          </div>
          <span className="font-bold text-lg text-gray-600">›</span>
        </div>
      </div>
    </div>
  );
};

export default BuyBox;
