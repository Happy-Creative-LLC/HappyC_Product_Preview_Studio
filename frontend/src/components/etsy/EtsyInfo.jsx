import React from 'react';

const EtsyInfo = ({ title, shopName, sales, rating, price }) => {
  return (
    <div className="flex flex-col pr-0 md:pr-4">
      {/* Shop Info */}
      <div className="flex items-center space-x-2 text-sm mb-3">
        <a href="#" className="text-gray-900 font-semibold hover:underline">{shopName}</a>
        <span className="text-gray-500">|</span>
        <span className="text-gray-600">{sales} sales</span>
        <span className="text-gray-500">|</span>
        <span className="text-gray-900 flex items-center">
          ★★★★★
        </span>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-light text-gray-900 leading-tight mb-4">{title}</h1>

      {/* Price */}
      <div className="mb-6">
        <span className="text-3xl font-medium text-green-700">${price.toFixed(2)}</span>
      </div>

      {/* Variations / Options (Mock) */}
      <div className="mb-4">
        <label className="block text-sm font-bold text-gray-900 mb-1">Size</label>
        <select className="w-full border border-gray-300 rounded-lg p-3 text-base shadow-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900">
          <option>Select a size</option>
          <option>Small</option>
          <option>Medium</option>
          <option>Large</option>
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-bold text-gray-900 mb-1">Color</label>
        <select className="w-full border border-gray-300 rounded-lg p-3 text-base shadow-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900">
          <option>Select an option</option>
          <option>Red</option>
          <option>Blue</option>
          <option>Black</option>
        </select>
      </div>

      {/* Add to cart / Buy */}
      <div className="flex flex-col space-y-3 mb-6">
        <button className="w-full bg-gray-900 text-white font-bold py-3 px-4 rounded-full hover:bg-gray-800 transition-colors">
          Add to cart
        </button>
      </div>
      
      {/* Description Snippet */}
      <div className="border-t border-gray-200 pt-6 mt-4">
        <h3 className="font-bold text-lg mb-2">Item details</h3>
        <ul className="list-disc pl-5 text-gray-700 space-y-2 mb-4">
          <li>Handmade item</li>
          <li>Materials: Stainless steel, BPA free lid</li>
          <li>Made to order</li>
        </ul>
        <p className="text-gray-700 text-sm">
          This personalized tumbler is the perfect gift for any occasion...
        </p>
      </div>
    </div>
  );
};

export default EtsyInfo;
