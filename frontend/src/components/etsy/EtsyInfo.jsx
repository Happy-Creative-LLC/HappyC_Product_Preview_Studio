import { useState } from 'react';
import { Star, Truck, RotateCcw, ChevronDown, ChevronUp, Heart, ShieldCheck } from 'lucide-react';
import Stars from '../shared/Stars';

const EtsyInfo = ({
  title = '',
  shopName = 'HappyCreative',
  sales = '23,491',
  rating = '4.9',
  reviewCount = '4,128',
  price = 0,
  listPrice = 0,
  lowStock = '',
  starSeller = true,
  freeShipping = true,
  bestseller = false,
  colors = [],
  sizes = [],
  bulletPoints = [],
  highlights = [],
  materials = [],
  description = '',
  fabricType = '',
  careInstructions = '',
  origin = '',
  tags = [],
}) => {
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [qty, setQty] = useState(1);
  const [showReturnPolicy, setShowReturnPolicy] = useState(false);
  const [showShipping, setShowShipping] = useState(false);

  const currentPrice = Number(price) || 0;
  const listPriceNum = Number(listPrice) || 0;
  const pctOff = listPriceNum > 0 ? Math.round((1 - currentPrice / listPriceNum) * 100) : 0;

  const colorName = (c) => (typeof c === 'object' ? c.name : c);

  const displayHighlights = highlights.length > 0 ? highlights : bulletPoints;
  const displayMaterials = materials.length > 0 ? materials : (fabricType ? [fabricType] : []);

  const deliveryDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  })();

  return (
    <div className="flex flex-col">

      {/* ── Badges ── */}
      {(bestseller || starSeller || freeShipping) && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {bestseller && (
            <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-100">
              🏆 Bestseller
            </span>
          )}
          {starSeller && (
            <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-purple-100">
              <Star size={11} className="fill-purple-600 text-purple-600" />
              Star Seller
            </span>
          )}
          {freeShipping && (
            <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-100">
              <Truck size={11} />
              Free shipping on orders $35+
            </span>
          )}
        </div>
      )}

      {/* ── Price ── */}
      <div className="mb-3">
        <div className="flex items-end gap-2">
          <span className="text-3xl font-semibold text-gray-900">
            ${currentPrice.toFixed(2)}
          </span>
          {listPriceNum > 0 && (
            <>
              <span className="text-base text-gray-400 line-through mb-0.5">${listPriceNum.toFixed(2)}</span>
              {pctOff > 0 && (
                <span className="mb-0.5 rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-800">
                  {pctOff}% off
                </span>
              )}
            </>
          )}
        </div>
        <div className="text-xs text-gray-400 mt-0.5">+ applicable taxes</div>
      </div>

      {/* ── Title ── */}
      <h1 className="text-2xl font-normal text-gray-900 leading-snug mb-3">
        {title || 'Product title will appear here'}
      </h1>

      {/* ── Shop + Reviews row ── */}
      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-base font-bold text-gray-900 hover:underline cursor-pointer">{shopName}</span>
          <span className="text-gray-400 text-sm">|</span>
          <span className="text-sm text-gray-600">{sales} sales</span>
          <span className="text-gray-400 text-sm">|</span>
          <span className="flex items-center gap-1 text-sm">
            <Stars value={rating} size={13} />
            <span className="font-medium text-gray-800">{rating}</span>
            <a href="#reviews" className="text-xs text-gray-500 hover:underline">({reviewCount})</a>
          </span>
        </div>
      </div>

      {/* ── Low stock ── */}
      {lowStock && (
        <div className="mb-3 text-sm font-medium text-red-600">⚡ {lowStock}</div>
      )}

      {/* ── Color selector ── */}
      {colors.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-800 mb-2">
            Color: <span className="font-normal text-gray-600">{selectedColor ? colorName(selectedColor) : 'Select an option'}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((c, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedColor(c)}
                title={colorName(c)}
                className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${
                  selectedColor === c
                    ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-1'
                    : 'border-gray-300 hover:border-gray-500'}`}
              >
                {c.image ? (
                  <img src={c.image} alt={colorName(c)} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-200" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Size selector ── */}
      {sizes.length > 0 && (
        <div className="mb-4">
          <label className="text-sm font-semibold text-gray-800 block mb-2">Size</label>
          <select
            value={selectedSize}
            onChange={e => setSelectedSize(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-900 bg-white"
          >
            <option value="">Select a size</option>
            {sizes.map((s, idx) => <option key={idx} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      {/* ── Quantity ── */}
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm font-semibold text-gray-800">Quantity</label>
        <select
          value={qty}
          onChange={e => setQty(Number(e.target.value))}
          className="rounded-lg border border-gray-400 px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-gray-900"
        >
          {[1, 2, 3, 4, 5].map(n => <option key={n}>{n}</option>)}
        </select>
      </div>

      {/* ── Cart buttons ── */}
      <div className="flex flex-col gap-2 mb-4">
        <button className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-3 rounded-full transition-colors text-sm">
          Add to cart
        </button>
        <button className="w-full border-2 border-gray-900 text-gray-900 font-semibold py-2.5 rounded-full hover:bg-gray-50 transition-colors text-sm flex items-center justify-center gap-2">
          <Heart size={15} />
          Add to favorites
        </button>
      </div>

      <div className="border-t border-gray-100 mb-4" />

      {/* ── Shipping / Returns ── */}
      <div
        className="flex items-center justify-between cursor-pointer py-3"
        onClick={() => setShowShipping(v => !v)}
      >
        <div className="flex items-center gap-2.5">
          <Truck size={18} className="text-gray-600" />
          <div>
            <p className="text-sm font-semibold text-gray-800">Free shipping</p>
            <p className="text-xs text-gray-500">Estimated delivery: {deliveryDate}</p>
          </div>
        </div>
        {showShipping ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </div>
      {showShipping && (
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 mb-2 leading-relaxed">
          <p>Ships from: United States</p>
          <p className="mt-1">Standard shipping: 5–8 business days</p>
          <p className="mt-1">Express shipping available at checkout</p>
        </div>
      )}

      <div
        className="flex items-center justify-between cursor-pointer py-3 border-t border-gray-100"
        onClick={() => setShowReturnPolicy(v => !v)}
      >
        <div className="flex items-center gap-2.5">
          <RotateCcw size={18} className="text-gray-600" />
          <p className="text-sm font-semibold text-gray-800">Returns & exchanges accepted</p>
        </div>
        {showReturnPolicy ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </div>
      {showReturnPolicy && (
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 mb-2 leading-relaxed">
          <p>Just contact the seller within: <strong>30 days of delivery</strong></p>
          <p className="mt-1">Ship items back within: <strong>21 days of delivery</strong></p>
          <p className="mt-1">Custom or personalized orders cannot be returned.</p>
        </div>
      )}

      <div className="flex items-center gap-2 py-3 border-t border-gray-100">
        <ShieldCheck size={18} className="text-green-600" />
        <p className="text-sm text-gray-600">Etsy purchase protection</p>
      </div>

      <div className="border-t border-gray-100 mt-2 mb-5" />

      {/* ── Highlights (bullet points) ── */}
      {displayHighlights.length > 0 && (
        <div className="mb-5">
          <h3 className="text-base font-bold text-gray-900 mb-3">Highlights</h3>
          <ul className="space-y-1.5">
            {displayHighlights.filter(b => b?.trim()).map((h, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Materials ── */}
      {displayMaterials.length > 0 && (
        <div className="mb-4 text-sm">
          <span className="font-semibold text-gray-900">Materials: </span>
          <span className="text-gray-700">{displayMaterials.join(', ')}</span>
        </div>
      )}

      {/* ── Product details (care, origin) ── */}
      {(careInstructions || origin) && (
        <div className="mb-5 bg-gray-50 rounded-xl p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Product details</h3>
          <dl className="space-y-1.5 text-sm">
            {careInstructions && (
              <div className="flex gap-2">
                <dt className="text-gray-500 w-32 flex-shrink-0">Care</dt>
                <dd className="text-gray-800">{careInstructions}</dd>
              </div>
            )}
            {origin && (
              <div className="flex gap-2">
                <dt className="text-gray-500 w-32 flex-shrink-0">Origin</dt>
                <dd className="text-gray-800">{origin}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* ── Tags ── */}
      {tags.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-bold text-gray-900 mb-2">Explore related searches</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Description ── */}
      {description && (
        <div className="mt-2 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
          {description}
        </div>
      )}
    </div>
  );
};

export default EtsyInfo;
