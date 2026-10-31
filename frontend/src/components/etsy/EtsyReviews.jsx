import { ChevronRight, Sparkles } from 'lucide-react';
import Stars from '../shared/Stars';

const RATING_CIRCLES = [
  { label: 'Item quality', value: '4.9' },
  { label: 'Shipping', value: '4.9' },
  { label: 'Customer service', value: '4.9' },
  { label: 'Buyers recommend', value: '98%' },
];

const AI_HIGHLIGHTS = [
  'Love it', 'Great product', 'Great quality', 'Gift worthy',
  'Fast shipping', 'Would recommend', 'Helpful seller',
];

const FILTER_TAGS = [
  { label: 'Seller service', count: '2,593' },
  { label: 'Quality', count: '2,498' },
  { label: 'Shipping & Packaging', count: '1,334' },
  { label: 'Appearance', count: '1,763' },
];

const REVIEWS = [
  { name: 'Sarah', date: 'Mar 20, 2025', text: 'My friend loved it so much', initial: 'S', color: 'bg-rose-100 text-rose-600' },
  { name: 'Sabrina', date: 'Mar 20, 2025', text: 'My best friend absolutely loved my gift', initial: 'S', color: 'bg-sky-100 text-sky-600' },
  { name: 'Kelanna', date: 'Mar 19, 2025', text: "Absolutely perfect! I can't wait to toss these in lieu of a garter for my wedding! I'll definitely purchase another in the future!", initial: 'K', color: 'bg-amber-100 text-amber-600' },
  { name: 'Hanna', date: 'Mar 19, 2025', text: '10/10 was just like it was described', initial: 'H', color: 'bg-emerald-100 text-emerald-600' },
];

const EtsyReviews = ({ rating = '4.9', reviewCount = '8,512', photos = [] }) => {
  return (
    <section id="reviews" className="border-t border-gray-200 pt-8 mt-10">
      <h2 className="text-[22px] font-semibold text-gray-900 mb-5">
        Reviews for this item <span className="text-gray-500 font-normal">({reviewCount})</span>
      </h2>

      {/* Rating summary + breakdown circles */}
      <div className="flex flex-wrap items-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-[26px] font-semibold text-gray-900">{rating}</span>
          <div>
            <Stars value={rating} size={16} />
            <p className="text-xs text-gray-500 mt-0.5">Item average</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-6">
          {RATING_CIRCLES.map((c) => (
            <div key={c.label} className="flex items-center gap-2">
              <div className="w-11 h-11 rounded-full border-2 border-gray-800 flex items-center justify-center text-[13px] font-semibold text-gray-900">
                {c.value}
              </div>
              <span className="text-[13px] text-gray-600 max-w-[70px] leading-tight">{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI highlights */}
      <div className="mb-5">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 mb-2">
          <Sparkles size={15} className="text-purple-500" />
          Buyer highlights, summarized by AI
        </p>
        <div className="flex flex-wrap gap-2">
          {AI_HIGHLIGHTS.map((h) => (
            <span key={h} className="rounded-full bg-gray-100 px-3 py-1.5 text-[13px] text-gray-700">
              {h}
            </span>
          ))}
        </div>
      </div>

      {/* Filter tags */}
      <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-gray-100">
        {FILTER_TAGS.map((t) => (
          <span key={t.label} className="rounded-full border border-gray-300 px-3 py-1.5 text-[13px] text-gray-700 hover:bg-gray-50 cursor-pointer">
            {t.label} <span className="text-gray-400">({t.count})</span>
          </span>
        ))}
        <span className="rounded-full border border-gray-300 px-3 py-1.5 text-[13px] text-gray-700 hover:bg-gray-50 cursor-pointer flex items-center gap-1">
          Suggested <ChevronRight size={13} className="rotate-90" />
        </span>
      </div>

      {/* Review list */}
      <div className="space-y-6">
        {REVIEWS.map((r, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${r.color}`}>
              {r.initial}
            </div>
            <div className="min-w-0">
              <Stars value={5} size={13} />
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-semibold text-gray-800">{r.name}</span>
                <span className="text-xs text-gray-400">{r.date}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">{r.text}</p>
            </div>
          </div>
        ))}
      </div>

      <button className="mt-6 border border-gray-900 text-gray-900 font-semibold px-6 py-2.5 rounded-full hover:bg-gray-50 transition-colors text-sm">
        View all reviews for this item
      </button>

      {/* Photos from reviews */}
      {photos.length > 0 && (
        <div className="mt-10">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Photos from reviews</h3>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {photos.slice(0, 6).map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Review photo ${i + 1}`}
                loading="lazy"
                className="w-32 h-32 rounded-lg object-cover flex-shrink-0 border border-gray-200"
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default EtsyReviews;
