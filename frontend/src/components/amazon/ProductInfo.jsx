import React from 'react';

const ProductInfo = ({ title, brand, rating, reviewsCount, price, oldPrice, discountPercent, bulletPoints, badges, salesStat, sustainabilityFeature, colors, sizes }) => {
  return (
    <div className="flex flex-col px-4">
      {/* Brand */}
      <a href="#" className="text-sm text-blue-600 hover:text-orange-500 hover:underline mb-1 block tracking-wide">Visit the {brand || 'Brand'} Store</a>
      
      {/* Title */}
      <h1 className="text-xl leading-tight font-medium text-gray-900 mb-2">{title}</h1>

      {/* Ratings & Top Badge */}
      <div className="flex items-center space-x-2 mb-1">
        <span className="text-orange-500 text-lg">★★★★☆</span>
        <span className="text-sm text-blue-600 hover:text-orange-500 hover:underline cursor-pointer flex items-center">
          4.5 <span className="ml-1">({reviewsCount})</span>
        </span>
      </div>

      {/* Badges */}
      {badges && badges.length > 0 && (
        <div className="flex space-x-2 mt-1 mb-2 items-center">
          {badges.map((badge, idx) => (
            badge.toLowerCase().includes('overall pick') ? 
            <span key={idx} className="bg-gray-800 text-white text-xs font-bold px-2 py-1 flex items-center">
              Overall Pick
            </span> : 
            <span key={idx} className="bg-red-700 text-white text-xs font-bold px-2 py-1">
              {badge}
            </span>
          ))}
        </div>
      )}

      {/* Sustainability */}
      {sustainabilityFeature && (
        <div className="text-sm text-green-700 font-medium mb-1 mt-2 flex items-center">
          <span className="mr-1 border border-green-700 rounded-sm px-1">🌿</span> {sustainabilityFeature} ˅
        </div>
      )}

      {/* Sales Stats */}
      {salesStat && (
        <div className="text-sm text-gray-600 mb-2 mt-1">{salesStat}</div>
      )}
      
      <div className="border-b border-gray-300 w-full mb-3 mt-1"></div>

      {/* Price */}
      <div className="flex flex-col mb-2 mt-2">
        <div className="flex items-start">
          <span className="text-[14px] text-gray-900 font-medium relative top-1 mr-[1px]">$</span>
          <span className="text-[28px] text-gray-900 font-medium leading-none">{Math.floor(Number(price) || 27)}</span>
          <span className="text-[14px] text-gray-900 font-medium relative top-1 ml-[1px]">{((Number(price) || 27.99) % 1).toFixed(2).substring(2)}</span>
        </div>
        {(Number(oldPrice) > 0) && (
          <div className="text-xs text-gray-500 mt-1">
            List Price: <span className="line-through">${oldPrice}</span>
          </div>
        )}
      </div>

      <div className="text-sm mb-4">
        <span>Get <b>Fast, Free Shipping</b> with <span className="text-blue-500 font-bold hover:underline cursor-pointer text-sm">Amazon Prime</span></span><br/>
        <span className="text-blue-600 hover:text-orange-500 hover:underline cursor-pointer">FREE Returns ˅</span>
      </div>

      {/* Variations: Colors */}
      {colors && colors.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-bold text-gray-900 mb-2">
            Color: <span className="font-bold">{colors[0].name}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {colors.map((color, idx) => (
              <div key={idx} className={`border p-1 cursor-pointer flex flex-col items-center justify-center w-[70px] h-[86px] ${idx === 0 ? 'border-[#007185] shadow-[0_0_0_1px_#007185]' : 'border-gray-400 hover:border-[#007185]'}`}>
                <img src={color.image} alt={color.name} className="w-[50px] h-[50px] object-cover mb-1" />
                <span className="text-[11px] text-gray-800">${price || '27.99'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Variations: Sizes */}
      {sizes && sizes.length > 0 && (
        <div className="mb-4 mt-2">
          <div className="text-sm font-bold text-gray-900 mb-2">
            Size: <span className="font-bold">{sizes[0]}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size, idx) => (
              <div key={idx} className={`border rounded-sm px-3 py-1.5 text-sm cursor-pointer ${idx === 0 ? 'border-[#007185] shadow-[0_0_0_1px_#007185] bg-gray-50' : 'border-gray-400 hover:border-[#007185] hover:bg-gray-50'}`}>
                {size}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Details / Bullet points */}
      <div className="mt-4 border-t border-gray-300 pt-4">
        <h3 className="font-bold text-base mb-2">About this item</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-900 font-medium">
          {bulletPoints.map((point, idx) => (
            <li key={idx} className="leading-snug">{point}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ProductInfo;
