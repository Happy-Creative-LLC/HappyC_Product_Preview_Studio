import { Star } from 'lucide-react';

// Build a product grid card list by cycling the available gallery images.
const buildProducts = (images, count, productTitle = 'Handmade gift') => {
  const titles = [
    `${productTitle} · handmade gift`, `Personalized ${productTitle.toLowerCase()}`,
    `Custom ${productTitle.toLowerCase()} for family`, `${productTitle} · unique design`,
    `Personalized gift inspired by ${productTitle.toLowerCase()}`,
  ];
  const prices = [13.99, 9.8, 9.07, 6.9, 10.0];
  const list = [27.98, 19.6, 18.14, 13.8, 20.0];
  const src = images.length ? images : [''];
  return Array.from({ length: count }).map((_, i) => ({
    src: src[i % src.length],
    title: titles[i % titles.length],
    price: prices[i % prices.length],
    listPrice: list[i % list.length],
    rating: (4.6 + (i % 4) * 0.1).toFixed(1),
    reviews: [1234, 892, 445, 2103, 678][i % 5],
    ad: i % 5 === 0,
  }));
};

const ProductCard = ({ p }) => (
  <div className="group cursor-pointer">
    <div className="relative rounded-lg overflow-hidden aspect-square bg-gray-100 border border-gray-200">
      {p.src ? (
        <img src={p.src} alt={p.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No image</div>
      )}
    </div>
    <div className="flex items-center gap-1 mt-1.5">
      <Star size={11} className="fill-gray-800 text-gray-800" />
      <span className="text-xs font-medium text-gray-700">{p.rating}</span>
      <span className="text-xs text-gray-400">({p.reviews.toLocaleString()})</span>
    </div>
    <p className="text-[13px] text-gray-800 leading-snug mt-0.5 line-clamp-1">{p.title}</p>
    <div className="flex items-center gap-1.5 mt-0.5">
      <span className="text-[13px] font-semibold text-[#c1441e]">${p.price.toFixed(2)}</span>
      <span className="text-xs text-gray-400 line-through">${p.listPrice.toFixed(2)}</span>
    </div>
    {p.ad && <p className="text-[11px] text-gray-400 mt-0.5">Ad by Etsy seller</p>}
  </div>
);

const INTEREST_CARDS = [
  { label: 'Handmade gifts', bg: 'from-emerald-100 to-emerald-200' },
  { label: 'Personalized finds', bg: 'from-amber-100 to-amber-200' },
  { label: 'Gifts for family', bg: 'from-rose-100 to-rose-200' },
  { label: 'Home favorites', bg: 'from-sky-100 to-sky-200' },
  { label: 'Everyday keepsakes', bg: 'from-violet-100 to-violet-200' },
];

const EtsyRecommendations = ({ images = [], tags = [], productTitle = '' }) => {
  const recommendationTitle = productTitle?.trim() || 'Handmade gift';
  const alsoLike = buildProducts(images, 12, recommendationTitle);
  const similar = buildProducts([...images].reverse(), 12, recommendationTitle);
  const searchChips = tags.slice(0, 12);

  return (
    <div className="space-y-12 mt-12">
      {/* You may also like */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          You may also like <span className="text-sm font-normal text-gray-400">Including ads</span>
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-6">
          {alsoLike.map((p, i) => <ProductCard key={i} p={p} />)}
        </div>
      </section>

      {/* Browse by interest */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-1">Gifts</p>
            <h2 className="text-xl font-semibold text-gray-900">Browse by interest for the best gifts</h2>
          </div>
          <button className="bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-black">Shop now</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {INTEREST_CARDS.map((c) => (
            <div key={c.label} className={`rounded-xl bg-linear-to-br ${c.bg} aspect-square flex items-end p-4 cursor-pointer hover:opacity-90 transition-opacity`}>
              <span className="text-sm font-bold text-gray-800">{c.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Shoppers with similar taste */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Shoppers with similar taste loved these</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-6">
          {similar.map((p, i) => <ProductCard key={i} p={p} />)}
        </div>
      </section>

      {/* Explore related searches */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Explore related searches</h2>
        <div className="flex flex-wrap gap-2.5">
          {searchChips.map((s, i) => (
            <span key={i} className="rounded-full border border-gray-300 px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 cursor-pointer">
              {s}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
};

export default EtsyRecommendations;
