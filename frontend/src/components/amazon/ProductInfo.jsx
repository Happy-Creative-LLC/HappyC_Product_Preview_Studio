import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import Stars from '../shared/Stars';

const ProductInfo = ({
  title, brand, price, rating, reviewsCount,
  boughtRecently, salesStat, badges, colors, sizes,
  fabricType, careInstructions, origin, caseType,
  variationLabel = 'Color',
}) => {
  const isClothing     = Number(caseType) === 1;
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize,  setSelectedSize]  = useState(0);
  const [highlightsOpen, setHighlightsOpen] = useState(true);

  const currentPrice = Number(price) || 0;
  const cents        = (currentPrice % 1).toFixed(2).substring(1); // ".99"
  const colorName    = (c) => (typeof c === 'object' ? c.name : c);

  const parseCount = (v) => {
    const n = Number(String(v || 0).replace(/,/g, ''));
    return isNaN(n) ? 0 : n;
  };

  const detailRows = [
    ['Fabric type',        fabricType],
    ['Care instructions',  careInstructions],
    ['Country of origin',  origin],
    ['Closure type',       'Button'],
  ].filter(([, v]) => v);

  const savings = [
    { tag: 'Save 5%', text: 'on 2 select item(s)' },
    { tag: 'Save 7%', text: 'on 5 select item(s)' },
    { tag: 'Savings',  text: 'Buy any 10, Save 10%' },
    { tag: 'Savings',  text: 'Buy any 15, Save 12%' },
  ];

  return (
    <div className="flex flex-col px-1 text-[13px] text-gray-900">

      {/* Amazon's Choice badge */}
      <div className="mb-1.5">
        <span className="inline-flex items-center bg-[#232F3E] text-white text-[11px] font-bold px-2 py-0.5 rounded-sm">
          Amazon's <span className="text-[#FF9900] ml-1">Choice</span>
        </span>
        <span className="text-[12px] text-[#565959] ml-2">in Men's Casual Button-Down Shirts</span>
      </div>

      {/* Store link */}
      <a href="#" className="text-[13px] text-[#007185] hover:text-[#C45500] hover:underline mb-1.5 block">
        Visit the {brand || 'Brand'} Store
      </a>

      {/* Title */}
      <h1 className="text-[21px] leading-[1.3] font-medium text-gray-900 mb-1.5">
        {title}
      </h1>

      {/* Rating row */}
      {rating && (
        <div className="flex items-center flex-wrap gap-1 mb-1 text-[13px]">
          <span className="text-gray-800 font-medium">{Number(rating).toFixed(1)}</span>
          <Stars value={rating} size={14} />
          <a href="#" className="text-[#007185] hover:text-[#C45500] hover:underline">
            {parseCount(reviewsCount).toLocaleString()} ratings
          </a>
        </div>
      )}

      {/* Bought recently */}
      {(boughtRecently || salesStat) && (
        <div className="text-[12px] text-gray-600 mb-1">{boughtRecently || salesStat}</div>
      )}

      {/* Extra badges */}
      {badges && badges.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {badges.map((b, i) => (
            <span key={i} className="text-xs bg-blue-50 border border-blue-200 text-blue-800 px-2 py-0.5 rounded font-medium">
              {b}
            </span>
          ))}
        </div>
      )}

      <div className="border-t border-[#E7E7E7] my-2" />

      {/* Price */}
      <div className="flex items-start mb-1">
        <span className="text-[13px] text-[#B12704] relative top-1.5 mr-px">$</span>
        <span className="text-[28px] text-[#B12704] leading-none font-medium tracking-tight">{Math.floor(currentPrice)}</span>
        <span className="text-[13px] text-[#B12704] relative top-1.5 ml-px">{cents}</span>
      </div>

      {/* Coupon */}
      <div className="flex items-center gap-2 my-1.5 flex-wrap">
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input type="checkbox" className="w-[14px] h-[14px] accent-[#007185] cursor-pointer" />
          <span>
            Apply{' '}
            <span className="font-bold text-[#cc6600]">$1.00 coupon</span>
          </span>
        </label>
        <a href="#" className="text-[#007185] hover:text-[#C45500] hover:underline">Shop items</a>
        <span className="text-gray-300">|</span>
        <a href="#" className="text-[#007185] hover:text-[#C45500] hover:underline">Terms</a>
      </div>

      {/* Savings tiers */}
      <div className="flex flex-col gap-1 mb-2">
        {savings.map((s, i) => (
          <div key={i} className="leading-snug">
            <span className="inline-block bg-[#007600] text-white font-bold px-1.5 py-[1px] rounded-[3px] text-[11px] mr-1.5">{s.tag}</span>
            <span className="text-gray-800">{s.text}</span>
            {' '}<a href="#" className="text-[#007185] hover:text-[#C45500] hover:underline">Shop items ›</a>
          </div>
        ))}
      </div>

      <div className="border-t border-[#E7E7E7] my-2" />

      {/* Color grid */}
      {colors && colors.length > 0 && (
        <div className="mb-3">
          <div className="mb-1.5">
            <strong>{variationLabel}:</strong>{' '}
            <span>{colorName(colors[selectedColor])}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {colors.map((c, i) => (
              <button
                key={i}
                onClick={() => setSelectedColor(i)}
                title={colorName(c)}
                className={`rounded-md p-0.5 transition-all ${
                  selectedColor === i
                    ? 'border-2 border-[#E77600] ring-1 ring-[#E77600]'
                    : 'border-2 border-[#D5D9D9] hover:border-[#E77600]'
                }`}
                style={{ width: 50, height: 62 }}
              >
                <div className="w-full rounded overflow-hidden bg-gray-100" style={{ height: 44 }}>
                  {c.image
                    ? <img src={c.image} alt={colorName(c)} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gray-200" />
                  }
                </div>
                <div className="text-[9px] text-center mt-0.5 leading-none text-gray-600 truncate px-0.5">
                  ${currentPrice.toFixed(2)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size (clothing only) */}
      {isClothing && sizes && sizes.length > 0 && (
        <div className="mb-2">
          <div className="mb-1.5">
            <strong>Size:</strong>{' '}
            <span>{sizes[selectedSize]}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sizes.map((s, i) => (
              <button
                key={i}
                onClick={() => setSelectedSize(i)}
                className={`rounded border px-3 py-1.5 text-[12px] transition-colors min-w-[42px] ${
                  selectedSize === i
                    ? 'border-[#E77600] ring-1 ring-[#E77600] bg-orange-50 font-medium'
                    : 'border-[#D5D9D9] hover:border-[#999]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <a href="#" className="text-[#007185] hover:text-[#C45500] hover:underline text-[12px] mt-1.5 inline-block">
            Size Chart ›
          </a>
        </div>
      )}

      {/* Customizations count */}
      {colors && colors.length > 0 && (
        <div className="mb-2">
          <strong>Customizations:</strong> {colors.length} image{colors.length !== 1 ? 's' : ''} available
        </div>
      )}

      {/* Product details accordion */}
      {detailRows.length > 0 && (
        <div className="mt-4">
          <h2 className="text-[18px] font-bold text-gray-900 mb-1">Product details</h2>
          <button
            onClick={() => setHighlightsOpen(o => !o)}
            className="w-full border-t border-gray-200 py-3 flex items-center justify-between text-left hover:bg-gray-50 px-1 -mx-1 rounded"
          >
            <span className="font-bold text-[15px]">Top highlights</span>
            {highlightsOpen
              ? <ChevronUp size={18} className="text-gray-500 flex-shrink-0" />
              : <ChevronDown size={18} className="text-gray-500 flex-shrink-0" />
            }
          </button>
          {highlightsOpen && (
            <div className="flex flex-col gap-1.5 pb-3 text-[13px]">
              {detailRows.map(([k, v], i) => (
                <div key={i} className="flex gap-3">
                  <span className="w-40 flex-shrink-0 font-bold text-gray-700">{k}</span>
                  <span className="flex-1 text-gray-800">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductInfo;
