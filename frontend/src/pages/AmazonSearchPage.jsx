import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Loader2, RefreshCw, Search } from 'lucide-react';
import Header from '../components/amazon/Header';
import { useProductStore } from '../stores/productStore';
import axiosInstance from '../api/axiosConfig';

/* ══════════════════════════════════════════════════════════════
   Amazon Product Search Page — TechBrief mục III

   Hai tính năng brief yêu cầu:
   1. Ô tìm kiếm (vùng ĐỎ) → gọi dữ liệu thời gian thực từ Amazon.
   2. Sản phẩm Seller chèn (vùng XANH) → chèn được vào BẤT KỲ vị trí nào,
      gồm đúng 6 trường: Ảnh chính · Tên sản phẩm · Giá hiển thị ·
      Chương trình khuyến mãi · Giá vận chuyển · Thời gian giao hàng.

   Mọi thứ ngoài 2 vùng đó là thông tin mẫu cố định (brief: "Các khu vực
   thông tin ngoài phạm vi khoanh vùng chỉ cần hiển thị thông tin mẫu cố định").
   ══════════════════════════════════════════════════════════════ */

// Filler cho card đối thủ phải ỔN ĐỊNH giữa các lần render. Trước đây dùng
// Math.random() ngay trong render nên chỉ cần gõ một ký tự vào ô search là
// toàn bộ số lượt mua / review / giá gốc nhảy loạn.
const hashString = (value) => {
  let hash = 0;
  const text = String(value ?? '');
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

// Chỉ giữ những gì Seller đã tự sửa. Tên/giá chưa sửa (null) sẽ lấy thẳng từ
// sản phẩm nguồn lúc render — không đồng bộ qua useEffect, tránh cascading render
// và tránh prefill cũ còn dính lại khi preview tải xong.
const DEFAULT_INJECTED = {
  title: null,
  price: null,
  promotion: 'Limited time deal',
  shippingCost: 'FREE delivery',
  deliveryTime: 'Tomorrow, 9 AM - 2 PM',
  imageIndex: 0,
};

const FILTER_GROUPS = [
  { heading: "Men's General Size", values: ['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL'] },
  { heading: "Women's General Size", values: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', '6XL'] },
  { heading: "Men's Big & Tall Size", values: ['ST', 'MT', 'LT', 'XLT', '2XBT', '3XBT', '4XBT', '5XBT', 'XLB', '2XLB'] },
];

const FILTER_COLORS = ['bg-white', 'bg-black', 'bg-gray-400', 'bg-[#8b4513]', 'bg-red-600',
  'bg-pink-400', 'bg-orange-500', 'bg-yellow-400', 'bg-green-500', 'bg-blue-500', 'bg-purple-500'];

const formatPriceParts = (value) => {
  const amount = Number(value) || 0;
  return {
    whole: Math.floor(amount),
    cents: (amount % 1).toFixed(2).substring(2),
  };
};

const AmazonSearchPage = () => {
  const [searchParams] = useSearchParams();
  const previewId = searchParams.get('previewId');
  const projectId = searchParams.get('projectId');
  const taskId = searchParams.get('taskId');

  const scaffold = useProductStore();

  const [previewData, setPreviewData] = useState(null);
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [injectPosition, setInjectPosition] = useState(2);
  const [injected, setInjected] = useState(DEFAULT_INJECTED);
  // null = chưa gõ gì, dùng từ khoá suy ra từ tên sản phẩm.
  const [keywordOverride, setKeywordOverride] = useState(null);
  const [searchInput, setSearchInput] = useState(null);
  // Tăng lên để ép gọi lại API với cùng một từ khoá (nút "Cập nhật từ Amazon").
  const [refreshNonce, setRefreshNonce] = useState(0);

  // Sản phẩm nội bộ lấy từ preview THẬT khi mở từ task; nếu không có previewId
  // thì rơi về scaffold để trang vẫn xem được độc lập.
  const sourceProduct = previewData || scaffold;
  const sourceImages = useMemo(
    () => (sourceProduct.images || []).filter(Boolean),
    [sourceProduct.images],
  );

  // Giá trị hiệu lực = thứ Seller đã sửa, nếu chưa sửa thì lấy từ sản phẩm nguồn.
  const effectiveTitle = injected.title ?? sourceProduct.title ?? '';
  const effectivePrice = injected.price ?? (sourceProduct.price != null ? String(sourceProduct.price) : '');
  const derivedKeyword = (sourceProduct.title || '').split(' ').slice(0, 2).join(' ').trim() || 'shirt';
  const keyword = keywordOverride ?? derivedKeyword;
  const searchValue = searchInput ?? keyword;

  useEffect(() => {
    if (!previewId) return undefined;
    let active = true;
    axiosInstance.get(`/api/previews/${previewId}`)
      .then((res) => {
        if (!active || !res.data?.productData) return;
        try { setPreviewData(JSON.parse(res.data.productData)); } catch { /* giữ scaffold */ }
      })
      .catch(() => { /* giữ scaffold; chỉ lỗi tìm kiếm mới cần báo người dùng */ });
    return () => { active = false; };
  }, [previewId]);

  // Toàn bộ setState nằm trong callback của promise — không gọi đồng bộ trong
  // thân effect (quy tắc react-hooks/set-state-in-effect). Trạng thái loading
  // ban đầu là true, các lần sau do handler bật trước khi đổi từ khoá.
  useEffect(() => {
    if (!keyword) return undefined;
    let active = true;
    const forceRefresh = refreshNonce > 0;
    axiosInstance
      .get(`/api/amazon/search?keyword=${encodeURIComponent(keyword)}${forceRefresh ? '&forceRefresh=true' : ''}`)
      .then((response) => {
        if (!active) return;
        const results = Array.isArray(response.data) ? response.data : [];
        setCompetitors(results);
        setError(results.length === 0
          ? `Không tìm thấy kết quả nào cho từ khoá "${keyword}". Thử từ khoá khác.`
          : '');
      })
      .catch((requestError) => {
        if (!active) return;
        setCompetitors([]);
        if (!requestError.response) {
          setError('Không thể kết nối máy chủ. Kiểm tra mạng rồi thử lại.');
        } else if (requestError.response.status === 403) {
          setError('Chỉ Seller và Admin được dùng Search Preview.');
        } else {
          // Backend trả message tiếng Việt cụ thể (VD: chưa cấu hình RapidAPI,
          // không lấy được dữ liệu thật) qua GlobalExceptionHandler — ưu tiên nó
          // thay vì luôn hiện một câu chung chung.
          setError(requestError.response?.data?.message
            || 'Không lấy được dữ liệu từ Amazon. Vui lòng thử lại.');
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [keyword, refreshNonce]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const term = searchValue.trim();
    if (!term || term === keyword) return;
    setLoading(true);
    setKeywordOverride(term);
  };

  const handleRefresh = () => {
    setLoading(true);
    setRefreshNonce((current) => current + 1);
  };

  const updateInjected = (field) => (event) => {
    setInjected((current) => ({ ...current, [field]: event.target.value }));
  };

  // Brief: "Seller có thể chèn nội dung sản phẩm vào bất kỳ vị trí nào trên trang
  // tìm kiếm" — nên vị trí là số tự do 1..N+1, không phải danh sách cố định.
  const maxPosition = competitors.length + 1;
  const safePosition = Math.min(Math.max(injectPosition, 1), Math.max(maxPosition, 1));

  const results = useMemo(() => {
    const list = [...competitors];
    list.splice(safePosition - 1, 0, {
      id: '__injected__',
      isInjected: true,
      title: effectiveTitle.trim() || 'Sản phẩm của bạn (chưa có tên)',
      image: sourceImages[injected.imageIndex] || sourceImages[0] || null,
      price: Number(effectivePrice) || 0,
      brand: sourceProduct.brand || 'Your Brand',
      promotion: injected.promotion,
      shippingCost: injected.shippingCost,
      deliveryTime: injected.deliveryTime,
      rating: sourceProduct.rating,
      reviews: sourceProduct.reviewsCount,
    });
    return list;
  }, [competitors, safePosition, injected, effectiveTitle, effectivePrice, sourceImages,
    sourceProduct.brand, sourceProduct.rating, sourceProduct.reviewsCount]);

  const workspacePath = projectId && taskId ? `/projects/${projectId}/tasks/${taskId}` : '/projects';

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Header />

      {/* ── Thanh điều khiển Search Preview ── */}
      <div className="sticky top-0 z-40 border-b border-gray-300 bg-gray-100 shadow-sm">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-2 text-sm">
          <Link
            to={workspacePath}
            className="flex items-center gap-1.5 rounded border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Quay lại workspace
          </Link>

          <span className="font-bold text-orange-600">Search Preview</span>

          {/* Ô tìm kiếm = VÙNG ĐỎ theo brief */}
          <form onSubmit={handleSearchSubmit} className="flex items-center">
            <span className="sr-only" id="search-zone-label">Ô tìm kiếm — vùng đỏ</span>
            <div className="flex rounded ring-2 ring-red-500 ring-offset-1">
              <input
                type="text"
                value={searchValue}
                onChange={(event) => setSearchInput(event.target.value)}
                aria-labelledby="search-zone-label"
                className="w-52 rounded-l border border-gray-300 px-2 py-1.5 outline-none"
                placeholder="Nhập từ khoá tìm kiếm..."
              />
              <button
                type="submit"
                className="rounded-r border border-[#FCD200] bg-[#FFD814] px-3 py-1.5 font-bold text-black hover:bg-[#F7CA00]"
              >
                <Search size={15} aria-hidden="true" />
                <span className="sr-only">Tìm kiếm</span>
              </button>
            </div>
          </form>

          <label className="flex items-center gap-2 text-xs">
            <span className="font-medium text-gray-700">Chèn vào vị trí</span>
            <input
              type="number"
              min={1}
              max={Math.max(maxPosition, 1)}
              value={injectPosition}
              onChange={(event) => setInjectPosition(Number(event.target.value) || 1)}
              className="w-16 rounded border border-gray-300 px-2 py-1.5 text-center outline-none"
            />
            <span className="text-gray-500">/ {Math.max(maxPosition, 1)}</span>
          </label>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="ml-auto flex items-center gap-1.5 rounded border border-gray-300 bg-gray-200 px-3 py-1.5 text-xs text-gray-800 shadow-sm transition-colors hover:bg-gray-300 disabled:opacity-50"
          >
            <RefreshCw size={13} aria-hidden="true" />
            Cập nhật từ Amazon
          </button>
        </div>

        {/* Vùng XANH — 6 trường brief yêu cầu cho sản phẩm chèn */}
        <div className="border-t border-green-200 bg-green-50/70">
          <div className="mx-auto max-w-[1600px] px-4 py-2.5">
            <p className="mb-2 text-xs font-bold text-green-800">
              Nội dung sản phẩm chèn (vùng xanh — Seller)
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <label className="flex flex-col gap-1 text-[11px] font-medium text-green-900">
                Ảnh chính
                <select
                  value={injected.imageIndex}
                  onChange={(event) => setInjected((current) => ({
                    ...current,
                    imageIndex: Number(event.target.value),
                  }))}
                  disabled={sourceImages.length === 0}
                  className="rounded border border-green-300 bg-white px-2 py-1.5 text-xs font-normal text-gray-800 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                >
                  {sourceImages.length === 0
                    ? <option value={0}>Chưa có ảnh trong preview</option>
                    : sourceImages.map((_, index) => (
                      <option key={index} value={index}>Ảnh {index + 1}</option>
                    ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-[11px] font-medium text-green-900">
                Tên sản phẩm
                <input
                  type="text"
                  value={effectiveTitle}
                  onChange={updateInjected('title')}
                  className="rounded border border-green-300 bg-white px-2 py-1.5 text-xs font-normal text-gray-800 outline-none"
                />
              </label>

              <label className="flex flex-col gap-1 text-[11px] font-medium text-green-900">
                Giá hiển thị (USD)
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={effectivePrice}
                  onChange={updateInjected('price')}
                  className="rounded border border-green-300 bg-white px-2 py-1.5 text-xs font-normal text-gray-800 outline-none"
                />
              </label>

              <label className="flex flex-col gap-1 text-[11px] font-medium text-green-900">
                Chương trình khuyến mãi
                <input
                  type="text"
                  value={injected.promotion}
                  onChange={updateInjected('promotion')}
                  placeholder="VD: Limited time deal"
                  className="rounded border border-green-300 bg-white px-2 py-1.5 text-xs font-normal text-gray-800 outline-none"
                />
              </label>

              <label className="flex flex-col gap-1 text-[11px] font-medium text-green-900">
                Giá vận chuyển
                <input
                  type="text"
                  value={injected.shippingCost}
                  onChange={updateInjected('shippingCost')}
                  placeholder="VD: FREE delivery"
                  className="rounded border border-green-300 bg-white px-2 py-1.5 text-xs font-normal text-gray-800 outline-none"
                />
              </label>

              <label className="flex flex-col gap-1 text-[11px] font-medium text-green-900">
                Thời gian giao hàng
                <input
                  type="text"
                  value={injected.deliveryTime}
                  onChange={updateInjected('deliveryTime')}
                  placeholder="VD: Tomorrow, 9 AM - 2 PM"
                  className="rounded border border-green-300 bg-white px-2 py-1.5 text-xs font-normal text-gray-800 outline-none"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Dòng tổng kết kết quả — thông tin mẫu cố định */}
      <div className="flex items-center justify-between border-b px-4 py-2 text-sm shadow-sm">
        <div>
          <span>1-{results.length} of over 60,000 results for </span>
          <span className="font-bold text-orange-600">&quot;{keyword}&quot;</span>
        </div>
      </div>

      {error && (
        <div className="mx-auto mt-3 flex max-w-[1600px] items-center gap-2 rounded border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          <AlertCircle size={17} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="mx-auto mt-4 flex max-w-[1600px] px-4">
        {/* Sidebar lọc — thông tin mẫu cố định */}
        <aside className="hidden w-64 flex-shrink-0 border-r pr-6 text-sm text-gray-900 md:block">
          <div className="mb-4">
            <h3 className="mb-1 font-bold">Delivery Day</h3>
            {['Get It Today', 'Get It by Tomorrow'].map((label) => (
              <label key={label} className="mb-1 flex cursor-pointer items-center text-sm hover:text-orange-600">
                <input type="checkbox" className="mr-2" /> {label}
              </label>
            ))}
          </div>

          <div className="mb-4">
            <h3 className="mb-1 font-bold">Gender</h3>
            <ul className="space-y-1">
              {['Men', 'Women', 'Boys', 'Girls', 'Babies', 'Unisex'].map((label) => (
                <li key={label}>
                  <label className="flex cursor-pointer items-center hover:text-orange-600">
                    <input type="checkbox" className="mr-2" /> {label}
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-4">
            <h3 className="mb-2 font-bold">Color</h3>
            <div className="flex flex-wrap gap-2">
              {FILTER_COLORS.map((color) => (
                <span
                  key={color}
                  className={`h-6 w-6 cursor-pointer rounded-full border border-gray-300 hover:ring-2 hover:ring-orange-500 ${color}`}
                />
              ))}
            </div>
          </div>

          {FILTER_GROUPS.map((group) => (
            <div key={group.heading} className="mb-4">
              <h3 className="mb-2 font-bold">{group.heading}</h3>
              <div className="flex flex-wrap gap-1">
                {group.values.map((size) => (
                  <span key={size} className="cursor-pointer rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100">
                    {size}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </aside>

        {/* Lưới kết quả */}
        <div className="flex-grow pb-20 pl-0 md:pl-6">
          <h2 className="mb-4 text-xl font-bold">Results</h2>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={36} className="animate-spin text-orange-500" aria-hidden="true" />
              <span className="ml-3 text-lg text-gray-600">Đang lấy dữ liệu thời gian thực từ Amazon...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {results.map((item, index) => (
                <ResultCard key={item.id || index} item={item} index={index} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Một card kết quả. Card đối thủ dùng filler suy ra từ id (ổn định),
       card của Seller dùng đúng 6 trường brief. ─── */
const ResultCard = ({ item, index }) => {
  const seed = hashString(item.id || item.title || index);
  const price = formatPriceParts(item.price);

  const colorsCount = item.isInjected ? 3 : (seed % 40) + 1;
  const boughtCount = item.isInjected
    ? '1K+ bought in past month'
    : (item.salesVolume || `${((seed % 9) + 1) * 100}+ bought in past month`);
  const reviews = item.reviews || (seed % 2000) + 100;
  const brand = item.brand
    || `${String(item.title || '').split(' ')[0] || ''} ${String(item.title || '').split(' ')[1] || ''}`.trim();

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-lg ${
        item.isInjected ? 'border-green-500 ring-2 ring-green-500 shadow-md' : 'border-gray-200'
      }`}
    >
      {item.isInjected && (
        <div className="absolute left-0 top-0 z-10 rounded-br-lg bg-green-600 px-2 py-1 text-xs font-bold text-white">
          SẢN PHẨM CỦA BẠN
        </div>
      )}

      {/* Ảnh chính */}
      <div className="relative flex h-64 cursor-pointer items-center justify-center bg-gray-50 p-2">
        {item.image ? (
          <img
            src={item.image}
            alt={item.title}
            className="max-h-full max-w-full object-contain mix-blend-multiply"
          />
        ) : (
          <span className="px-4 text-center text-xs text-gray-400">
            {item.isInjected ? 'Chưa có ảnh trong preview — upload ảnh ở workspace trước' : 'Không có ảnh'}
          </span>
        )}
      </div>

      <div className="flex flex-grow flex-col p-3 text-sm">
        <div className="mb-1 cursor-pointer text-[13px] text-blue-600 hover:text-orange-500 hover:underline">
          +{colorsCount} other colors/patterns
        </div>

        {item.isSponsored && !item.isInjected && (
          <div className="mb-1 text-[11px] text-gray-500">Sponsored</div>
        )}

        <div className="mb-1 truncate text-[14px] font-bold leading-tight text-gray-900">{brand}</div>

        {/* Tên sản phẩm */}
        <h3 className="mb-1 line-clamp-2 h-[34px] cursor-pointer text-[13px] leading-tight text-gray-900 hover:text-orange-600">
          {item.title}
        </h3>

        <div className="mb-1 flex items-center space-x-1 text-[13px]">
          <span className="text-orange-500">★★★★☆</span>
          <span className="cursor-pointer text-blue-600 hover:underline">({reviews})</span>
        </div>

        <div className="mb-2 text-[12px] text-gray-500">{boughtCount}</div>

        {/* Chương trình khuyến mãi */}
        {item.isInjected && item.promotion?.trim() && (
          <div className="mb-1 w-fit rounded-sm bg-[#cc0c39] px-2 py-0.5 text-[11px] font-bold text-white">
            {item.promotion}
          </div>
        )}

        {/* Giá hiển thị */}
        <div className="mt-auto flex items-baseline space-x-1">
          <span className="mt-1 align-top text-[12px]">$</span>
          <span className="text-[28px] font-medium leading-none">{price.whole}</span>
          <span className="mt-1 align-top text-[12px]">{price.cents}</span>
        </div>

        {/* Giá vận chuyển + Thời gian giao hàng */}
        {item.isInjected ? (
          <div className="mt-2 text-[12px] leading-tight text-gray-900">
            {item.shippingCost?.trim() && <span className="font-bold">{item.shippingCost}</span>}
            {item.shippingCost?.trim() && item.deliveryTime?.trim() && ' · '}
            {item.deliveryTime?.trim() && <span className="font-bold">{item.deliveryTime}</span>}
          </div>
        ) : (
          <div className="mt-2 text-[12px] leading-tight text-gray-900">
            <span className="font-bold text-blue-500">Join Prime</span> to get{' '}
            <span className="font-bold">FREE delivery</span>
          </div>
        )}

        <div className="mt-3 w-full">
          <button
            type="button"
            className="w-full rounded-full border border-[#FCD200] bg-[#FFD814] px-3 py-1.5 text-sm text-black shadow-sm transition-all hover:bg-[#F7CA00] hover:shadow"
          >
            {seed % 2 === 0 ? 'See options' : 'Add to cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AmazonSearchPage;
