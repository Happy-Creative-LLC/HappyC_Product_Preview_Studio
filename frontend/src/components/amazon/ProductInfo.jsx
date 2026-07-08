import React, { useState } from 'react';
import { Shirt, Droplets, Globe, Scissors, Ruler, Wind } from 'lucide-react';
import Stars from '../shared/Stars';

const ProductInfo = ({
  title, brand, price, oldPrice, discountPercent, rating, reviewsCount,
  boughtRecently, salesStat, badges, bulletPoints, colors, sizes,
  fabricType, careInstructions, origin, caseType, variationLabel = 'Color',
}) => {
  const isClothing = Number(caseType) === 1;
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState(0);

  const currentPrice = Number(price) || 0;
  const listPrice = Number(oldPrice) || 0;
  const pctOff = discountPercent
    ? Number(discountPercent)
    : listPrice > 0 ? Math.round((1 - currentPrice / listPrice) * 100) : 0;

  const colorName = (c) => (typeof c === 'object' ? c.name : c);

  // Top Highlights icon grid (Amazon attribute cards)
  const highlights = [
    { icon: Shirt,    label: 'Fabric type', value: fabricType },
    { icon: Droplets, label: 'Care',        value: careInstructions },
    { icon: Globe,    label: 'Origin',      value: origin },
    { icon: Scissors, label: 'Closure',     value: 'Button' },
    { icon: Ruler,    label: 'Fit type',    value: 'Regular fit' },
    { icon: Wind,     label: 'Sleeve',      value: 'Short sleeve' },
  ].filter(h => h.value);

  return (
    <div className="flex flex-col px-4">
      {/* Brand */}
      <a href="#" className="text-sm text-teal-700 hover:text-orange-600 hover:underline mb-1 block">
        Visit the {brand || 'Brand'} Store
      </a>

      {/* Title */}
      <h1 className="text-xl leading-tight font-medium text-gray-900 mb-2">{title}</h1>

      {/* Rating row */}
      {rating && (
        <div className="flex items-center gap-2 mb-2 text-sm">
          <span className="font-medium text-gray-800">{rating}</span>
          <Stars value={rating} size={15} />
          <a href="#" className="text-teal-700 hover:text-orange-600 hover:underline">
            {Number(reviewsCount || 0).toLocaleString()} ratings
          </a>
        </div>
      )}

      {/* Bought recently / sales stat */}
      {(boughtRecently || salesStat) && (
        <div className="text-xs text-gray-600 mb-2">{boughtRecently || salesStat}</div>
      )}

      {/* Badges (Overall Pick etc.) */}
      {badges && badges.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {badges.map((b, i) => (
            <span key={i} className="text-xs bg-blue-50 border border-blue-200 text-blue-800 px-2 py-0.5 rounded font-medium">
              {b}
            </span>
          ))}
        </div>
      )}

      <div className="border-b border-gray-300 w-full mb-3 mt-1" />

      {/* Price */}
      <div className="flex flex-col mb-2 mt-2">
        <div className="flex items-end gap-2">
          {pctOff > 0 && (
            <span className="text-2xl text-red-700 font-medium">-{pctOff}%</span>
          )}
          <div className="flex items-start">
            <span className="text-[14px] text-gray-900 font-medium relative top-1 mr-[1px]">$</span>
            <span className="text-[28px] text-gray-900 font-medium leading-none">{Math.floor(currentPrice)}</span>
            <span className="text-[14px] text-gray-900 font-medium relative top-1 ml-[1px]">
              {(currentPrice % 1).toFixed(2).substring(2)}
            </span>
          </div>
        </div>
        {listPrice > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            List Price: <span className="line-through">${listPrice.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="text-sm mb-2">
        <span>Get <b>Fast, Free Shipping</b> with <span className="text-blue-500 font-bold">Amazon Prime</span></span>
        <br />
        <span className="text-teal-700 hover:text-orange-600 hover:underline cursor-pointer">FREE Returns ˅</span>
      </div>

      {/* Variations: Pattern / Color */}
      {colors && colors.length > 0 && (
        <div className="mb-4 mt-2">
          <div className="text-sm mb-2">
            <span className="text-gray-500">{variationLabel}: </span>
            <span className="font-medium">{colorName(colors[selectedColor])}</span>
          </div>

          {/* Image swatches when patterns carry images (Amazon-style grid) */}
          {colors.some(c => typeof c === 'object' && c.image) ? (
            <div className="flex flex-wrap gap-2">
              {colors.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedColor(i)}
                  title={colorName(c)}
                  className={`w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                    selectedColor === i
                      ? 'border-orange-500 ring-2 ring-orange-300'
                      : 'border-gray-300 hover:border-gray-500'
                  }`}
                >
                  {c.image
                    ? <img src={c.image} alt={colorName(c)} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gray-200" />}
                </button>
              ))}
            </div>
          ) : (
            /* Text-button swatches fallback */
            <div className="flex flex-wrap gap-2">
              {colors.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedColor(i)}
                  className={`rounded border px-2 py-1 text-xs transition-colors ${
                    selectedColor === i
                      ? 'border-orange-400 ring-1 ring-orange-300 bg-orange-50'
                      : 'border-gray-300 hover:border-gray-500'
                  }`}
                >
                  {colorName(c)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Size — only Case 1 (Clothing) */}
      {isClothing && sizes && sizes.length > 0 && (
        <div className="mb-4">
          <div className="text-sm mb-2">
            <span className="text-gray-500">Size: </span>
            <span className="font-medium">{sizes[selectedSize]}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s, i) => (
              <button
                key={i}
                onClick={() => setSelectedSize(i)}
                className={`rounded border px-3 py-1 text-xs transition-colors ${
                  selectedSize === i
                    ? 'border-orange-400 ring-1 ring-orange-300 bg-orange-50'
                    : 'border-gray-300 hover:border-gray-500'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Top Highlights — attribute icon grid */}
      {highlights.length > 0 && (
        <div className="mt-2 mb-4 border-t border-gray-300 pt-4">
          <h3 className="font-bold text-base text-gray-900 mb-3">Top Highlights</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {highlights.map(({ icon: Icon, label, value }, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-9 h-9 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-gray-500 leading-tight">{label}</div>
                  <div className="text-[13px] font-medium text-gray-900 leading-tight truncate" title={value}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* About this item */}
      {bulletPoints && bulletPoints.length > 0 && (
        <div className="mt-2 border-t border-gray-300 pt-4">
          <h3 className="font-bold text-base mb-2">About this item</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-900 font-medium">
            {bulletPoints.map((point, idx) => (
              <li key={idx} className="leading-snug">{point}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProductInfo;
