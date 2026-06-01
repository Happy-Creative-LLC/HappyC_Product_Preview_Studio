import React from 'react';

const ProductInfo = ({ title, brand, price, oldPrice, bulletPoints, colors, sizes, fabricType, careInstructions, origin }) => {
  return (
    <div className="flex flex-col px-4">
      {/* Brand */}
      <a href="#" className="text-sm text-blue-600 hover:text-orange-500 hover:underline mb-1 block tracking-wide">Visit the {brand || 'Brand'} Store</a>
      
      {/* Title */}
      <h1 className="text-xl leading-tight font-medium text-gray-900 mb-2">{title}</h1>
      
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

      {/* Product Details */}
      {(fabricType || careInstructions || origin) && (
        <div className="mt-4 mb-4">
          <h3 className="font-bold text-base text-gray-900 mb-2">Product details</h3>
          <div className="flex flex-col space-y-2 text-sm text-gray-900">
            {fabricType && (
              <div className="flex items-start">
                <span className="w-1/3 font-bold">Fabric type</span>
                <span className="w-2/3">{fabricType}</span>
              </div>
            )}
            {careInstructions && (
              <div className="flex items-start">
                <span className="w-1/3 font-bold">Care instructions</span>
                <span className="w-2/3">{careInstructions}</span>
              </div>
            )}
            {origin && (
              <div className="flex items-start">
                <span className="w-1/3 font-bold">Origin</span>
                <span className="w-2/3">{origin}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Highlights / Bullet points */}
      {bulletPoints && bulletPoints.length > 0 && (
        <div className="mt-4 border-t border-gray-300 pt-4">
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
