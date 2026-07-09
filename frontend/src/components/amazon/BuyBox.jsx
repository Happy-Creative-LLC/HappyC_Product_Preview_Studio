import React from 'react';
import { MapPin } from 'lucide-react';

// Right-hand purchase column — matches the real Amazon "Customize now" flow
// for made-to-order / personalized products (reference: image 2).
const BuyBox = ({ price, brand }) => {
  const currentPrice = Number(price) || 0;
  const whole = Math.floor(currentPrice);
  const cents = (currentPrice % 1).toFixed(2).substring(2); // "95"

  // Delivery window ≈ 12–14 days out, formatted like "July 20 - 22"
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const start = new Date(); start.setDate(start.getDate() + 12);
  const end = new Date(); end.setDate(end.getDate() + 14);
  const deliveryRange = `${fmt(start)} - ${end.getDate()}`;

  return (
    <div className="w-full max-w-[300px] text-[13px] text-[#0F1111]">
      {/* ── Main purchase box ── */}
      <div className="border border-[#D5D9D9] rounded-lg p-4 bg-white">

        {/* Price (black) */}
        <div className="flex items-start mb-2">
          <span className="text-[13px] relative top-0.5 mr-px">$</span>
          <span className="text-[28px] leading-none font-medium tracking-tight">{whole}</span>
          <span className="text-[13px] relative top-0.5 ml-px">{cents}</span>
        </div>

        {/* Delivery */}
        <div className="leading-snug">
          ${(6.95).toFixed(2)} delivery <strong>{deliveryRange}</strong>.
        </div>
        <a href="#" className="text-[#007185] hover:text-[#C45500] hover:underline">Details</a>

        {/* Deliver to */}
        <div className="flex items-start gap-1 text-[#007185] mt-3 mb-3 text-[12px] cursor-pointer leading-tight">
          <MapPin size={14} className="text-black flex-shrink-0 mt-px" />
          <span className="hover:underline">Deliver to New York<br />10001</span>
        </div>

        {/* Ships within (red) */}
        <div className="text-[#B12704] font-bold text-[15px] mb-2 leading-snug">
          Usually ships within 6 to 7 days
        </div>
        <div className="mb-3 leading-snug">
          This product needs to be customized before adding to cart.
        </div>

        {/* Customize now */}
        <button className="w-full min-h-[44px] py-2.5 bg-[#FFD814] hover:bg-[#F7CA00] active:bg-[#DDB100] border border-[#FCD200] rounded-full text-[13px] shadow-[0_1px_2px_rgba(15,17,17,0.15)] transition-colors cursor-pointer mb-2">
          Customize now
        </button>
        <div className="text-[12px] text-[#565959] leading-snug mb-4">
          By clicking "Customize now", you agree to these{' '}
          <a href="#" className="text-[#007185] hover:text-[#C45500] hover:underline">Terms and Conditions.</a>
        </div>

        {/* Seller info grid */}
        <div className="grid grid-cols-[86px_1fr] gap-y-2 text-[12px] text-[#565959]">
          <span>Shipper / Seller</span>
          <a href="#" className="text-[#007185] hover:text-[#C45500] hover:underline">{brand || 'HappyCreative'}</a>
          <span>Returns</span>
          <a href="#" className="text-[#007185] hover:text-[#C45500] hover:underline">This item is non-returnable</a>
          <span>Payment</span>
          <a href="#" className="text-[#007185] hover:text-[#C45500] hover:underline">Secure transaction</a>
        </div>

        {/* Divider + Add to List */}
        <div className="border-t border-[#E7E7E7] mt-4 pt-4">
          <button className="w-full min-h-[40px] bg-white hover:bg-[#F7FAFA] border border-[#D5D9D9] py-2 rounded-lg shadow-sm text-[13px] transition-colors cursor-pointer">
            Add to List
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuyBox;
