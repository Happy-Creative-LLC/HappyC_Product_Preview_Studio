import { Star } from 'lucide-react';

// Build a product grid card list by cycling the available gallery images.
const buildProducts = (images, count) => {
  const titles = [
    'Comfort Colors Custom Dog Shirt', 'Custom Vintage Bootleg Pet Tee',
    'Custom Bootleg Pet Co Shirt', 'Comfort Colors Custom Vintage Tee',
    'Custom Pet Portrait Bootleg Shirt', 'Comfort Colors Custom Bootleg Tee',
    'Custom Dog Photo Bootleg Shirt', 'Personalized Pet Retro Graphic Tee',
    'Custom Cat Portrait Bootleg Shirt', 'Vintage Custom Pet Comfort Colors',
    'Custom Pet Memorial Shirt Gift', 'Retro Bootleg Dog Lover Tee',
  ];
  const prices = [13.99, 9.8, 9.07, 6.9, 6.4, 10.0, 5.25, 13.99, 21.6, 8.35, 8.99, 10.99];
  const list = [27.98, 19.6, 18.14, 13.8, 12.8, 20.0];
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
  { label: 'The Pet Parent', bg: 'from-emerald-200 to-emerald-300' },
  { label: 'The Pet', bg: 'from-amber-200 to-amber-300' },
  { label: 'The Dog Lover', bg: 'from-rose-200 to-rose-300' },
  { label: 'The Cat Lover', bg: 'from-sky-200 to-sky-300' },
  { label: 'The 90s Kid', bg: 'from-violet-200 to-violet-300' },
];

const RELATED_SEARCHES = [
  'Custom Gift With Cat Photo', 'Put Your Dogs Face On', 'Pet Custom for Men',
  'Custom Animal Lover Gift', 'Custom Dog Gift Birthday', 'Personalized Pet Gifts',
  'Gifts for Dog Owner Personalized', 'Custom Two Cat Crew Neck', 'Dog Memorial Gift Tshirt',
  'My Dog Shirt', 'Men Custom Dog',
];

const EtsyRecommendations = ({ images = [], tags = [] }) => {
  const alsoLike = buildProducts(images, 12);
  const similar = buildProducts([...images].reverse(), 12);
  const searchChips = (tags.length ? tags : RELATED_SEARCHES).slice(0, 12);

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
            <div key={c.label} className={`rounded-xl bg-gradient-to-br ${c.bg} aspect-square flex items-end p-4 cursor-pointer hover:opacity-90 transition-opacity`}>
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
