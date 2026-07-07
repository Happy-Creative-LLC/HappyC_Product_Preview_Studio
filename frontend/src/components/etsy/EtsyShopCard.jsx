import React from 'react';
import { Zap, Star, MessageCircle } from 'lucide-react';
import Stars from '../shared/Stars';

const SHOP_REVIEWS = [
  { name: 'Ashley', date: 'Mar 21, 2025', text: 'Love it, so pretty and can sit year decor. I got it for a friend and she immediately hung it asked for the link to make more.', item: 'Personalized Pet Memorial' },
  { name: 'Brianna', date: 'Mar 21, 2025', text: 'The design came out fantastic! This is my fiances new favorite gift that I got done for her. Highly recommend.', item: 'Custom Pet Golf Towel' },
  { name: 'Jennifer', date: 'Mar 20, 2025', text: 'Absolutely perfect! The staple gift I give every year - turned out amazing as always.', item: 'Custom Portrait Shirt' },
];

const EtsyShopCard = ({ shopName = 'HappyCreative', products = [] }) => {
  return (
    <section className="border border-gray-200 rounded-lg p-6 mt-10">
      {/* Shop header */}
      <div className="flex flex-wrap items-start gap-4">
        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-black text-xl flex-shrink-0">
          {shopName.charAt(0)}
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-semibold text-gray-900">{shopName}</h3>
            <span className="text-sm text-gray-500">New York, United States</span>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-gray-600 mt-1 flex-wrap">
            <span className="flex items-center gap-1">
              <Stars value={4.8} size={13} /> 4.8 <span className="text-gray-400">(70.6k)</span>
            </span>
            <span className="text-gray-300">·</span>
            <span>357.5k sales</span>
            <span className="text-gray-300">·</span>
            <span>5 years on Etsy</span>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button className="border border-gray-900 text-gray-900 font-semibold px-4 py-2 rounded-full hover:bg-gray-50 text-sm">
            Follow shop
          </button>
          <button className="border border-gray-300 text-gray-800 font-semibold px-4 py-2 rounded-full hover:bg-gray-50 text-sm">
            Message seller
          </button>
        </div>
      </div>

      {/* Signals */}
      <div className="grid sm:grid-cols-2 gap-4 mt-5 pt-5 border-t border-gray-100">
        <div className="flex items-start gap-2.5">
          <Zap size={18} className="text-gray-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-800">Speedy replies</p>
            <p className="text-[13px] text-gray-500">Has a history of replying to messages quickly.</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Star size={18} className="text-gray-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-800">Rave reviews</p>
            <p className="text-[13px] text-gray-500">Average review rating is 4.8 or higher.</p>
          </div>
        </div>
      </div>

      {/* Shop reviews */}
      <div className="mt-6 pt-5 border-t border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-base font-semibold text-gray-900">All reviews from this shop <span className="text-gray-500 font-normal">(70.6k)</span></h4>
          <button className="text-sm font-semibold text-gray-700 hover:underline">Show all</button>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {SHOP_REVIEWS.map((r, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-3.5">
              <Stars value={5} size={12} />
              <p className="text-[13px] text-gray-600 mt-1.5 leading-relaxed line-clamp-4">{r.text}</p>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                <MessageCircle size={12} />
                <span className="font-medium text-gray-600">{r.name}</span>
                <span>·</span>
                <span>{r.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* More from this shop */}
      {products.length > 0 && (
        <div className="mt-6 pt-5 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-base font-semibold text-gray-900">More from this shop</h4>
            <button className="text-sm font-semibold text-gray-700 hover:underline">Visit shop</button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {products.slice(0, 4).map((src, i) => (
              <div key={i}>
                <img src={src} alt="" loading="lazy" className="w-full aspect-square rounded-lg object-cover border border-gray-200" />
                <p className="text-[13px] text-[#c1441e] font-semibold mt-1">${[7.2, 21.6, 10.8, 15.2][i].toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default EtsyShopCard;
