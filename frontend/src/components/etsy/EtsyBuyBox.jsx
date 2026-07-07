import React, { useState } from 'react';
import {
  Star, ChevronDown, ChevronUp, Heart, Truck, RotateCcw, MapPin,
  ShieldCheck, Package, Leaf,
} from 'lucide-react';

// EtsyBuyBox — the right-hand purchase column of an Etsy listing.
// The <title> and <item details> blocks are the TEXT-zone editable content.
const EtsyBuyBox = ({
  title = '',
  shopName = 'HappyCreative',
  rating = '4.9',
  reviewCount = '8,512',
  price = 0,
  listPrice = 0,
  demandCount = 43,
  bulletPoints = [],
  materials = [],
  images = [],
}) => {
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [qty, setQty] = useState(1);
  const [showItemDetails, setShowItemDetails] = useState(true);

  const cur = Number(price) || 0;
  const list = Number(listPrice) || 0;
  const pctOff = list > cur && list > 0 ? Math.round((1 - cur / list) * 100) : 0;

  const highlights = bulletPoints.filter((b) => b?.trim());
  const mats = materials.length ? materials : ['Cotton'];

  // Bundle mock items derived from gallery images
  const bundle = images.slice(0, 3).map((src, i) => ({
    src,
    price: [8.0, 14.39, 9.99][i] ?? 8.0,
  }));
  const bundlePrice = bundle.reduce((s, b) => s + b.price, 0);

  return (
    <div className="flex flex-col">
      {/* ── Price ── */}
      <div className="mb-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[22px] font-semibold text-[#c1441e]">${cur.toFixed(2)}+</span>
          {list > 0 && (
            <span className="text-sm text-gray-500 line-through">${list.toFixed(2)}</span>
          )}
        </div>
        {pctOff > 0 && (
          <p className="text-[13px] text-gray-700 mt-0.5">
            {pctOff}% off · <span className="text-gray-500">Limited time sale</span>
          </p>
        )}
      </div>

      {/* ── In-demand banner ── */}
      <div className="mt-3 mb-3 bg-[#eafaf0] border border-[#c7ecd4] rounded-md px-3 py-2">
        <p className="text-[13px] font-semibold text-[#1c6b3c]">
          In demand. {demandCount} people bought this in the last 24 hours.
        </p>
      </div>

      {/* ── Title (TEXT zone) ── */}
      <h1 className="text-[15px] leading-snug text-gray-900 mb-2">
        {title || 'Product title will appear here'}
      </h1>

      {/* ── Shop + rating ── */}
      <div className="flex items-center gap-1.5 mb-2 text-[13px]">
        <span className="font-semibold text-gray-900 hover:underline cursor-pointer">{shopName}</span>
        <Star size={12} className="fill-gray-800 text-gray-800" />
        <span className="font-medium text-gray-800">{rating}</span>
        <a href="#reviews" className="text-gray-500 hover:underline">({reviewCount})</a>
      </div>

      {/* ── Returns line ── */}
      <div className="flex items-center gap-1.5 text-[13px] text-gray-600 mb-4">
        <RotateCcw size={14} />
        <span>Returns & exchanges accepted</span>
      </div>

      {/* ── Size ── */}
      <div className="mb-3">
        <label className="text-[13px] font-semibold text-gray-800 block mb-1">Size</label>
        <select
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className="w-full border border-gray-400 rounded-md px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:border-gray-900"
        >
          <option value="">Select an option</option>
          {['S', 'M', 'L', 'XL', 'XXL'].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* ── Color ── */}
      <div className="mb-3">
        <label className="text-[13px] font-semibold text-gray-800 block mb-1">Color</label>
        <select
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-full border border-gray-400 rounded-md px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:border-gray-900"
        >
          <option value="">Select an option</option>
          {['Black', 'White', 'Sand', 'Navy'].map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <button className="text-[13px] text-gray-700 underline underline-offset-2 self-start mb-4 hover:text-gray-900">
        + Create your option
      </button>

      {/* ── Quantity ── */}
      <div className="mb-4">
        <label className="text-[13px] font-semibold text-gray-800 block mb-1">Quantity</label>
        <select
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          className="w-24 border border-gray-400 rounded-md px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-gray-900"
        >
          {[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}
        </select>
      </div>

      {/* ── Klarna note ── */}
      <p className="text-[12px] text-gray-500 mb-2">
        4 payments of ${(cur / 4).toFixed(2)} interest-free with <strong className="text-gray-700">Klarna</strong>.
      </p>

      {/* ── Add to cart ── */}
      <button className="w-full bg-[#1c1c1c] hover:bg-black text-white font-semibold py-3.5 rounded-full transition-colors text-[15px] mb-2">
        Add to cart
      </button>
      <button className="w-full border border-gray-400 text-gray-900 font-semibold py-3 rounded-full hover:bg-gray-50 transition-colors text-sm flex items-center justify-center gap-2 mb-5">
        <Heart size={16} /> Add to favorites
      </button>

      {/* ── Bundle ── */}
      {bundle.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4 mb-5">
          <p className="text-sm font-semibold text-gray-900 mb-3">{shopName} recommends this bundle</p>
          <div className="space-y-2.5 mb-3">
            {bundle.map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <img src={b.src} alt="" className="w-11 h-11 rounded object-cover border border-gray-200" />
                <span className="text-sm text-gray-800">${b.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-700 mb-2">Bundle price: <strong>${bundlePrice.toFixed(2)}</strong></p>
          <button className="w-full border border-gray-900 text-gray-900 font-semibold py-2.5 rounded-full hover:bg-gray-50 transition-colors text-sm">
            Add all to cart
          </button>
        </div>
      )}

      {/* ── Item details (TEXT zone) ── */}
      <div className="border-t border-gray-200 pt-4">
        <button
          className="flex items-center justify-between w-full text-left"
          onClick={() => setShowItemDetails((v) => !v)}
        >
          <span className="text-base font-semibold text-gray-900">Item details</span>
          {showItemDetails ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
        </button>

        {showItemDetails && (
          <div className="mt-3">
            <p className="text-sm font-semibold text-gray-900 mb-2">Highlights</p>
            <ul className="space-y-1.5 mb-3">
              <li className="flex items-start gap-2 text-[13px] text-gray-700">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-500 flex-shrink-0" />
                Designed by {shopName}
              </li>
              <li className="flex items-start gap-2 text-[13px] text-gray-700">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-500 flex-shrink-0" />
                Materials: {mats.join(', ')}
              </li>
              {highlights.slice(0, 4).map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-gray-700">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-500 flex-shrink-0" />
                  {h}
                </li>
              ))}
            </ul>
            <button className="text-[13px] text-gray-700 underline underline-offset-2 hover:text-gray-900">
              Learn more about this item
            </button>
          </div>
        )}
      </div>

      {/* ── Shipping & return policies ── */}
      <div className="border-t border-gray-200 pt-4 mt-4">
        <p className="text-base font-semibold text-gray-900 mb-3">Shipping and return policies</p>
        <ul className="space-y-2.5 text-[13px] text-gray-700">
          <li className="flex items-center gap-2.5">
            <Package size={16} className="text-gray-500 flex-shrink-0" />
            Order today to get by <strong className="font-semibold">Mar 30–Apr 10</strong>
          </li>
          <li className="flex items-center gap-2.5">
            <RotateCcw size={16} className="text-gray-500 flex-shrink-0" />
            Returns accepted within 14 days
          </li>
          <li className="flex items-center gap-2.5">
            <Truck size={16} className="text-gray-500 flex-shrink-0" />
            Cost to ship: <strong className="font-semibold">$7.00</strong>
          </li>
          <li className="flex items-center gap-2.5">
            <MapPin size={16} className="text-gray-500 flex-shrink-0" />
            Ships from United States
          </li>
        </ul>
      </div>

      {/* ── Did you know? ── */}
      <div className="border-t border-gray-200 pt-4 mt-4">
        <p className="text-base font-semibold text-gray-900 mb-3">Did you know?</p>
        <div className="flex items-start gap-2.5 mb-3">
          <ShieldCheck size={18} className="text-gray-500 flex-shrink-0 mt-0.5" />
          <p className="text-[13px] text-gray-700 leading-relaxed">
            <strong className="font-semibold">Etsy Purchase Protection:</strong> Shop confidently on Etsy
            knowing if something goes wrong with an order, we've got your back for all eligible purchases.
          </p>
        </div>
        <div className="flex items-start gap-2.5">
          <Leaf size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-[13px] text-gray-700 leading-relaxed bg-green-50 rounded-md px-3 py-2">
            Etsy invests in climate solutions like electric trucks and carbon offsets for every delivery.
          </p>
        </div>
        <button className="mt-3 w-full border border-gray-900 text-gray-900 font-semibold py-2.5 rounded-full hover:bg-gray-50 transition-colors text-sm">
          View additional shop policies
        </button>
      </div>

      {/* ── Footer accordions ── */}
      <div className="mt-4 divide-y divide-gray-200 border-t border-gray-200">
        {['FAQs', 'Meet your sellers'].map((label) => (
          <button key={label} className="flex items-center justify-between w-full py-3.5 text-sm font-semibold text-gray-900">
            {label}
            <ChevronDown size={18} className="text-gray-500" />
          </button>
        ))}
        <button className="text-[13px] text-gray-500 hover:underline py-3.5 text-left w-full">
          View shop registration details
        </button>
      </div>
    </div>
  );
};

export default EtsyBuyBox;
