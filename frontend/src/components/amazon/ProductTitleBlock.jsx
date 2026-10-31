import Stars from '../shared/Stars';

const parseCount = (v) => {
  const n = Number(String(v || 0).replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
};

// Store link + Amazon's Choice + title + rating.
// Shared: desktop renders it inside ProductInfo; mobile renders it above the
// gallery (real Amazon mobile shows the title before the product image).
const ProductTitleBlock = ({ title, brand, rating, reviewsCount, boughtRecently, salesStat, badges }) => (
  <div className="text-[13px] text-gray-900">
    {/* Amazon's Choice badge */}
    <div className="mb-1.5">
      <span className="inline-flex items-center bg-[#232F3E] text-white text-[11px] font-bold px-2 py-0.5 rounded-sm">
        Amazon's <span className="text-[#FF9900] ml-1">Choice</span>
      </span>
      <span className="text-[12px] text-[#565959] ml-2">in Men's Casual Button-Down Shirts</span>
    </div>

    {/* Store link */}
    <a href="#" className="text-[13px] text-[#007185] hover:text-[#C45500] hover:underline mb-1.5 block">
      Visit the {brand || 'Brand'} Store
    </a>

    {/* Title */}
    <h1 className="text-[20px] md:text-[21px] leading-[1.3] font-medium text-gray-900 mb-1.5">
      {title}
    </h1>

    {/* Rating */}
    {rating && (
      <div className="flex items-center flex-wrap gap-1 mb-1 text-[13px]">
        <span className="text-gray-800 font-medium">{Number(rating).toFixed(1)}</span>
        <Stars value={rating} size={14} />
        <a href="#" className="text-[#007185] hover:text-[#C45500] hover:underline">
          {parseCount(reviewsCount).toLocaleString()} ratings
        </a>
      </div>
    )}

    {(boughtRecently || salesStat) && (
      <div className="text-[12px] text-gray-600 mb-1">{boughtRecently || salesStat}</div>
    )}

    {badges && badges.length > 0 && (
      <div className="flex flex-wrap gap-1 mb-2">
        {badges.map((b, i) => (
          <span key={i} className="text-xs bg-blue-50 border border-blue-200 text-blue-800 px-2 py-0.5 rounded font-medium">
            {b}
          </span>
        ))}
      </div>
    )}
  </div>
);

export default ProductTitleBlock;
