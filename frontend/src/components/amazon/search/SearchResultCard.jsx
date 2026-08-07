import { useState } from 'react';
import { ImageOff, Star } from 'lucide-react';

const parseAmount = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
};

const formatAmountParts = (value) => {
  const amount = parseAmount(value);
  if (amount === null) return null;

  const [whole, cents] = amount.toFixed(2).split('.');
  return { whole, cents };
};

const getRatingNumber = (value) => {
  const match = String(value ?? '').match(/\d+(?:[.,]\d+)?/);
  if (!match) return null;
  const rating = Number(match[0].replace(',', '.'));
  return Number.isFinite(rating) ? rating : null;
};

const ProductImage = ({ src, alt, eager = false, emptyText }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-5 text-center text-xs leading-5 text-gray-500">
        <ImageOff size={24} aria-hidden="true" />
        <span>{emptyText}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width="320"
      height="320"
      loading={eager ? 'eager' : 'lazy'}
      onError={() => setFailed(true)}
      className="h-full w-full object-contain mix-blend-multiply"
    />
  );
};

const Price = ({ value, missingLabel = 'Chưa có giá' }) => {
  const parts = formatAmountParts(value);

  if (!parts) {
    return <p className="text-sm font-medium text-gray-600">{missingLabel}</p>;
  }

  return (
    <p className="flex items-start text-[#0f1111]" aria-label={`${parts.whole} đô la ${parts.cents} cent`}>
      <span className="mt-1 text-xs">$</span>
      <span className="text-[28px] font-medium leading-8 tabular-nums">{parts.whole}</span>
      <span className="mt-1 text-xs tabular-nums">{parts.cents}</span>
    </p>
  );
};

const MissingField = ({ children }) => (
  <span className="font-medium text-amber-800">{children}</span>
);

const SearchResultCard = ({ item, position, eagerImage = false }) => {
  const rating = getRatingNumber(item.rating);
  const originalPrice = parseAmount(item.originalPrice);
  const price = parseAmount(item.price);
  const showOriginalPrice = originalPrice !== null && price !== null && originalPrice > price;

  return (
    <article
      id={item.isInjected ? 'listing-noi-bo' : undefined}
      className={`relative flex min-w-0 flex-col overflow-hidden rounded-lg bg-white ${
        item.isInjected
          ? 'border-2 border-[var(--hc-role-seller)] shadow-[0_14px_36px_rgba(13,117,70,0.16)]'
          : 'border border-gray-200'
      }`}
      aria-label={item.isInjected ? `Listing nội bộ ở vị trí ${position}` : undefined}
    >
      {item.isInjected && (
        <div className="flex min-h-9 items-center justify-between gap-2 bg-emerald-700 px-3 py-2 text-xs font-bold text-white">
          <span>LISTING NỘI BỘ</span>
          <span className="rounded-full bg-white/15 px-2 py-0.5">Vị trí {position}</span>
        </div>
      )}

      <div className="aspect-square w-full bg-[#f7f7f7] p-3">
        <ProductImage
          src={item.image}
          alt={item.title || (item.isInjected ? 'Ảnh chính listing nội bộ' : 'Ảnh sản phẩm Amazon')}
          eager={eagerImage}
          emptyText={item.isInjected ? 'Preview chưa có ảnh chính' : 'Amazon không trả về ảnh sản phẩm'}
        />
      </div>

      <div className="flex flex-1 flex-col p-3.5 text-[#0f1111]">
        {!item.isInjected && (item.isSponsored || item.sponsored) && (
          <p className="mb-1 text-[11px] text-gray-600">Sponsored</p>
        )}

        {!item.isInjected && item.badge && (
          <span className="mb-2 w-fit rounded-sm bg-[#232f3e] px-2 py-1 text-[11px] font-bold text-white">
            {item.badge}
          </span>
        )}

        {!item.isInjected && item.brand && (
          <p className="mb-1 truncate text-xs font-semibold text-gray-700">{item.brand}</p>
        )}

        <h2 className="line-clamp-3 min-h-[3.75rem] text-sm font-medium leading-5">
          {item.title?.trim() || <MissingField>Chưa nhập tên sản phẩm</MissingField>}
        </h2>

        {!item.isInjected && rating !== null && (
          <div className="mt-2 flex min-h-6 items-center gap-1.5 text-xs" aria-label={`Đánh giá ${rating} trên 5`}>
            <span className="flex items-center gap-1 text-[#007185]">
              <span className="tabular-nums">{rating.toFixed(1)}</span>
              <Star size={15} className="fill-[#ffa41c] text-[#ffa41c]" aria-hidden="true" />
            </span>
            {item.reviews && <span className="text-[#007185]">({item.reviews})</span>}
          </div>
        )}

        {!item.isInjected && item.salesVolume && (
          <p className="mt-1 text-xs leading-5 text-gray-600">{item.salesVolume}</p>
        )}

        {item.isInjected && (
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
            Sản phẩm cần so sánh
          </p>
        )}

        <div className="mt-2">
          <Price value={item.price} missingLabel={item.isInjected ? 'Chưa nhập giá hiển thị' : 'Amazon không trả về giá'} />
          {showOriginalPrice && (
            <p className="mt-0.5 text-xs text-gray-500">
              Giá niêm yết <span className="line-through">${originalPrice.toFixed(2)}</span>
            </p>
          )}
        </div>

        {item.isInjected && (
          <div className="mt-3 space-y-2 border-t border-emerald-100 pt-3 text-xs leading-5">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wide text-gray-500">Khuyến mãi</span>
              {item.promotion?.trim() || <MissingField>Chưa nhập</MissingField>}
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wide text-gray-500">Vận chuyển</span>
              {item.shippingCost?.trim() || <MissingField>Chưa nhập giá vận chuyển</MissingField>}
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wide text-gray-500">Giao hàng</span>
              {item.deliveryTime?.trim() || <MissingField>Chưa nhập thời gian giao hàng</MissingField>}
            </div>
          </div>
        )}
      </div>
    </article>
  );
};

export default SearchResultCard;
