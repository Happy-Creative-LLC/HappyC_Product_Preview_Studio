import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import ProductTitleBlock from './ProductTitleBlock';
import UploadPlaceholder from './UploadPlaceholder';

const ProductInfo = ({
  title, brand, price, rating, reviewsCount,
  boughtRecently, salesStat, badges, colors, sizes,
  fabricType, careInstructions, origin, caseType, categoryLabel,
  variationLabel = 'Color', variationGroups = [], variantCombinations = [], isApiProduct = false, promotion, onVariationChange,
}) => {
  const isClothing     = Number(caseType) === 1;
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize,  setSelectedSize]  = useState(0);
  const [highlightsOpen, setHighlightsOpen] = useState(true);
  const [showAllColors, setShowAllColors] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState(() => variationGroups.map((group) => {
    const selected = group.items?.findIndex((item) => item.selected);
    return selected >= 0 ? selected : 0;
  }));
  const [variantPages, setVariantPages] = useState({});

  const currentPrice = Number(price) || 0;
  const cents        = (currentPrice % 1).toFixed(2).substring(1); // ".99"
  const colorName    = (c) => (typeof c === 'object' ? c.name : c);

  const detailRows = [
    ['Fabric type',        fabricType],
    ['Care instructions',  careInstructions],
    ['Country of origin',  origin],
    ['Closure type',       'Button'],
  ].filter(([, v]) => v);

  const savings = [
    { tag: 'Save 5%', text: 'on 2 select item(s)' },
    { tag: 'Save 7%', text: 'on 5 select item(s)' },
    { tag: 'Savings',  text: 'Buy any 10, Save 10%' },
    { tag: 'Savings',  text: 'Buy any 15, Save 12%' },
  ];

  return (
    <div className="flex flex-col px-1 text-[13px] text-gray-900">

      {/* Title block — desktop only (mobile renders it above the gallery) */}
      <div className="hidden md:block">
        <ProductTitleBlock
          title={title} brand={brand} rating={rating} reviewsCount={reviewsCount}
          boughtRecently={boughtRecently} salesStat={salesStat} badges={badges}
          categoryLabel={categoryLabel}
        />
        <div className="border-t border-[#E7E7E7] my-2" />
      </div>

      {/* Price */}
      <div className="flex items-start mb-1">
        <span className="text-[13px] text-[#0F1111] relative top-1.5 mr-px">$</span>
        <span className="text-[28px] text-[#0F1111] leading-none font-medium tracking-tight">{Math.floor(currentPrice)}</span>
        <span className="text-[13px] text-[#0F1111] relative top-1.5 ml-px">{cents}</span>
      </div>

      {/* Coupon */}
      {!isApiProduct && <div className="flex items-center gap-2 my-1.5 flex-wrap">
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input type="checkbox" className="w-[14px] h-[14px] accent-[#007185] cursor-pointer" />
          <span>
            Apply{' '}
            <span className="font-bold text-[#cc6600]">$1.00 coupon</span>
          </span>
        </label>
        <a href="#" className="text-[#007185] hover:text-[#C45500] hover:underline">Shop items</a>
        <span className="text-gray-300">|</span>
        <a href="#" className="text-[#007185] hover:text-[#C45500] hover:underline">Terms</a>
      </div>}

      {isApiProduct && promotion && (
        <p className="my-1.5 text-[13px] text-[#0F1111]">{promotion}</p>
      )}

      {/* Savings tiers */}
      {!isApiProduct && <div className="flex flex-col gap-1 mb-2">
        {savings.map((s, i) => (
          <div key={i} className="leading-snug">
            <span className="inline-block bg-[#007600] text-white font-bold px-1.5 py-[1px] rounded-[3px] text-[11px] mr-1.5">{s.tag}</span>
            <span className="text-gray-800">{s.text}</span>
            {' '}<a href="#" className="text-[#007185] hover:text-[#C45500] hover:underline">Shop items ›</a>
          </div>
        ))}
      </div>}

      <div className="border-t border-[#E7E7E7] my-2" />

      {/* Color grid */}
      {isApiProduct && variationGroups.length > 0 && variationGroups.map((group, groupIndex) => {
        const items = group.items || [];
        if (!items.length) return null;
        const pageSize = 14;
        const page = variantPages[groupIndex] || 0;
        const pageCount = Math.ceil(items.length / pageSize);
        const apiSelectedIndex = items.findIndex((item) => item.selected);
        const selectedIndex = selectedVariants[groupIndex] ?? Math.max(0, apiSelectedIndex);
        const visibleItems = items.slice(page * pageSize, (page + 1) * pageSize);
        const isSizeGroup = /size|length/i.test(group.title);
        const dimensionKey = (name) => String(name).toLowerCase().replace(/[^a-z]/g, '');
        const isUnavailable = (itemIndex) => {
          if (variationGroups.length < 2 || !variantCombinations.length) return false;
          const wanted = {};
          variationGroups.forEach((otherGroup, otherIndex) => {
            const activeIndex = otherIndex === groupIndex ? itemIndex : (selectedVariants[otherIndex] ?? Math.max(0, otherGroup.items?.findIndex((entry) => entry.selected) ?? 0));
            const dimension = Object.keys(variantCombinations[0]?.dimensions || {}).find((key) => dimensionKey(otherGroup.title).includes(dimensionKey(key)));
            if (dimension && otherGroup.items?.[activeIndex]) wanted[dimension] = otherGroup.items[activeIndex].name;
          });
          const matches = variantCombinations.filter(({ dimensions = {} }) =>
            Object.entries(wanted).every(([key, value]) => dimensions[key] === value));
          return matches.length > 0 && matches.every((combination) => combination.unavailable);
        };
        return (
          <section key={`${group.title}-${groupIndex}`} className="mb-3" aria-label={`${group.title} variations`}>
            <div className="mb-1.5"><strong>{group.title}:</strong>{' '}<span>{items[selectedIndex]?.name}</span></div>
            <div className={isSizeGroup ? 'flex flex-wrap gap-1.5' : 'grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-1.5'}>
              {visibleItems.map((item, itemIndex) => {
                const index = page * pageSize + itemIndex;
                const selected = selectedIndex === index;
                const itemPrice = Number(item.price) || currentPrice;
                const unavailable = isUnavailable(index);
                return (
                  <button
                    key={`${item.asin || item.name}-${index}`}
                    type="button"
                    onClick={() => {
                      setSelectedVariants((current) => {
                        const next = [...current];
                        next[groupIndex] = index;
                        return next;
                      });
                      onVariationChange?.(item);
                    }}
                    title={item.name}
                    aria-label={`${group.title}: ${item.name}`}
                    aria-pressed={selected}
                    disabled={unavailable}
                    className={`${isSizeGroup ? 'min-h-9 min-w-12 px-3 py-1.5' : 'min-w-0 overflow-hidden p-1'} rounded-md border bg-white text-left transition-colors ${selected ? 'border-2 border-[#2162A1] shadow-sm' : 'border-[#D5D9D9] hover:border-[#888C8C]'} ${unavailable ? 'cursor-not-allowed opacity-40 line-through' : ''}`}
                  >
                    {isSizeGroup ? <span className="text-[12px]">{item.name}</span> : <>
                      <span className="block aspect-square overflow-hidden rounded-sm bg-[#F7F8F8]">
                        {item.image
                          ? <img src={item.image} alt="" className="h-full w-full object-contain" loading="lazy" />
                          : <span className="grid h-full place-items-center px-1 text-center text-[10px] leading-tight text-[#565959]">{item.name}</span>}
                      </span>
                      <span className="mt-1 block truncate text-[10px] leading-tight text-[#565959]">{item.name}</span>
                      {itemPrice > 0 && <span className="block text-[11px] text-[#0F1111]">${itemPrice.toFixed(2)}</span>}
                    </>}
                  </button>
                );
              })}
            </div>
            {pageCount > 1 && (
              <nav className="mt-2 flex items-center justify-center gap-1.5" aria-label={`${group.title} pages`}>
                <button type="button" onClick={() => setVariantPages((current) => ({ ...current, [groupIndex]: Math.max(0, page - 1) }))} disabled={page === 0} className="size-8 rounded-md border border-[#D5D9D9] disabled:opacity-40" aria-label="Previous variation page">‹</button>
                {Array.from({ length: pageCount }, (_, pageIndex) => (
                  <button key={pageIndex} type="button" onClick={() => setVariantPages((current) => ({ ...current, [groupIndex]: pageIndex }))} aria-current={pageIndex === page ? 'page' : undefined} className={`size-8 rounded-md border ${pageIndex === page ? 'border-[#2162A1] bg-[#EFF6FC] text-[#0F1111]' : 'border-[#D5D9D9]'}`}>{pageIndex + 1}</button>
                ))}
                <button type="button" onClick={() => setVariantPages((current) => ({ ...current, [groupIndex]: Math.min(pageCount - 1, page + 1) }))} disabled={page === pageCount - 1} className="size-8 rounded-md border border-[#D5D9D9] disabled:opacity-40" aria-label="Next variation page">›</button>
              </nav>
            )}
          </section>
        );
      })}

      {(!isApiProduct || variationGroups.length === 0) && colors && colors.length > 0 && (() => {
        const PER_PAGE = 14;
        const shown = showAllColors ? colors : colors.slice(0, PER_PAGE);
        const hasMore = colors.length > PER_PAGE;
        return (
          <div className="mb-3">
            <div className="mb-1.5">
              <strong>{variationLabel}:</strong>{' '}
              <span>{colorName(colors[selectedColor])}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {shown.map((c, i) => {
                const price = Number(c.price) || currentPrice;
                const selected = selectedColor === i;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedColor(i)}
                    title={colorName(c)}
                    aria-pressed={selected}
                    className="flex flex-col items-center rounded-md p-0.5 transition-all"
                    style={{ width: 72 }}
                  >
                    <div
                      className="overflow-hidden rounded-sm"
                      style={{
                        width: 72, height: 72,
                        border: selected ? '2px solid #2162A1' : '1px solid #D5D9D9',
                      }}
                    >
                      {c.image
                        ? <img src={c.image} alt={colorName(c)} className="w-full h-full object-contain" />
                        : isApiProduct
                          ? <span className="grid h-full place-items-center px-1 text-center text-[10px] text-[#565959]">{colorName(c)}</span>
                          : <UploadPlaceholder zone="IMAGE" compact radius={4} />}
                    </div>
                    <span className="text-[10px] leading-none text-gray-600 mt-1">${price.toFixed(2)}</span>
                  </button>
                );
              })}
            </div>
            {hasMore && (
              <button
                onClick={() => setShowAllColors((v) => !v)}
                className="text-[#007185] hover:text-[#C45500] hover:underline text-[13px] mt-2 inline-block"
              >
                {showAllColors ? 'Thu gọn' : `Xem tất cả ${colors.length} tùy chọn ›`}
              </button>
            )}
          </div>
        );
      })()}

      {/* Size (clothing only) */}
      {!isApiProduct && isClothing && sizes && sizes.length > 0 && (
        <div className="mb-2">
          <div className="mb-1.5">
            <strong>Size:</strong>{' '}
            <span>{sizes[selectedSize]}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sizes.map((s, i) => (
              <button
                key={i}
                onClick={() => setSelectedSize(i)}
                className={`rounded-sm border px-3 py-1.5 text-[12px] transition-colors min-w-[42px] ${
                  selectedSize === i
                    ? 'border-[#E77600] ring-1 ring-[#E77600] bg-orange-50 font-medium'
                    : 'border-[#D5D9D9] hover:border-[#999]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <a href="#" className="text-[#007185] hover:text-[#C45500] hover:underline text-[12px] mt-1.5 inline-block">
            Size Chart ›
          </a>
        </div>
      )}

      {/* Customizations count */}
      {!isApiProduct && colors && colors.length > 0 && (
        <div className="mb-2">
          <strong>Customizations:</strong> {colors.length} image{colors.length !== 1 ? 's' : ''} available
        </div>
      )}

      {/* Product details accordion */}
      {detailRows.length > 0 && (
        <div className="mt-4">
          <h2 className="text-[18px] font-bold text-gray-900 mb-1">Product details</h2>
          <button
            onClick={() => setHighlightsOpen(o => !o)}
            className="w-full border-t border-gray-200 py-3 flex items-center justify-between text-left hover:bg-gray-50 px-1 -mx-1 rounded-sm"
          >
            <span className="font-bold text-[15px]">Top highlights</span>
            {highlightsOpen
              ? <ChevronUp size={18} className="text-gray-500 shrink-0" />
              : <ChevronDown size={18} className="text-gray-500 shrink-0" />
            }
          </button>
          {highlightsOpen && (
            <div className="flex flex-col gap-1.5 pb-3 text-[13px]">
              {detailRows.map(([k, v], i) => (
                <div key={i} className="flex gap-3">
                  <span className="w-40 shrink-0 font-bold text-gray-700">{k}</span>
                  <span className="flex-1 text-gray-800">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductInfo;
