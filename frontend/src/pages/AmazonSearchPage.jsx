import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Database,
  Loader2,
  LocateFixed,
  RefreshCw,
  Search,
  Star,
} from 'lucide-react';
import Header from '../components/amazon/Header';
import SearchListingEditor from '../components/amazon/search/SearchListingEditor';
import SearchResultCard from '../components/amazon/search/SearchResultCard';
import axiosInstance from '../api/axiosConfig';

const DEFAULT_INJECTED = {
  title: null,
  price: null,
  promotion: '',
  shippingCost: '',
  deliveryTime: '',
  imageIndex: 0,
};

const parsePreviewProduct = (value) => {
  if (value && typeof value === 'object') return value;
  if (typeof value === 'string' && value.trim()) return JSON.parse(value);
  throw new Error('INVALID_PREVIEW_DATA');
};

const deriveKeyword = (title) => {
  const words = String(title ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return words.slice(0, 4).join(' ');
};

const getSearchError = (error) => {
  if (!error.response) return 'Không thể kết nối máy chủ. Kiểm tra mạng rồi thử lại.';
  if (error.response.status === 403) return 'Chỉ Seller và Admin được dùng Search Preview.';
  if (error.response.status === 503) return 'Dịch vụ tìm kiếm Amazon chưa được cấu hình. Hãy kiểm tra RapidAPI key.';
  if (error.response.status === 502) return 'Amazon hoặc nhà cung cấp dữ liệu đang gián đoạn. Vui lòng thử lại sau.';
  return error.response.data?.message || 'Không lấy được dữ liệu Amazon. Vui lòng thử lại.';
};

const LoadingGrid = () => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" aria-hidden="true">
    {Array.from({ length: 10 }, (_, index) => (
      <div key={index} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="aspect-square animate-pulse bg-gray-100" />
        <div className="space-y-3 p-4">
          <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-gray-200" />
          <div className="h-7 w-1/2 animate-pulse rounded bg-gray-100" />
        </div>
      </div>
    ))}
  </div>
);

const AmazonFilters = () => (
  <aside className="hidden w-56 shrink-0 border-r border-gray-200 pr-6 text-sm text-[#0f1111] lg:block" aria-label="Bộ lọc Amazon mẫu">
    <section className="mb-6">
      <h2 className="mb-2 font-bold">Department</h2>
      <ul className="space-y-1.5 pl-3 leading-5">
        <li>Clothing, Shoes &amp; Jewelry</li>
        <li>Home &amp; Kitchen</li>
        <li>Arts, Crafts &amp; Sewing</li>
      </ul>
    </section>
    <section className="mb-6">
      <h2 className="mb-2 font-bold">Customer Reviews</h2>
      <div className="flex items-center gap-1 text-[#007185]">
        <span className="flex" aria-label="4 sao trở lên">
          {Array.from({ length: 4 }, (_, index) => (
            <Star key={index} size={15} className="fill-[#ffa41c] text-[#ffa41c]" aria-hidden="true" />
          ))}
        </span>
        <span>&amp; Up</span>
      </div>
    </section>
    <section>
      <h2 className="mb-2 font-bold">Price</h2>
      <ul className="space-y-1.5 leading-5">
        <li>Under $25</li>
        <li>$25 to $50</li>
        <li>$50 to $100</li>
        <li>$100 &amp; Above</li>
      </ul>
    </section>
  </aside>
);

const AmazonSearchPage = () => {
  const [searchParams] = useSearchParams();
  const previewId = searchParams.get('previewId');
  const projectId = searchParams.get('projectId');
  const taskId = searchParams.get('taskId');
  const hasUserSearched = useRef(false);

  const [sourceState, setSourceState] = useState({
    loading: Boolean(previewId),
    data: null,
    error: previewId ? '' : 'Chưa có Preview đã lưu. Hãy mở Search Preview từ trang Task Detail.',
  });
  const [searchInput, setSearchInput] = useState('');
  const [searchRequest, setSearchRequest] = useState(null);
  const [searchState, setSearchState] = useState({
    loading: false,
    results: [],
    error: '',
    loadedKeyword: '',
  });
  const [injectPosition, setInjectPosition] = useState(2);
  const [injected, setInjected] = useState(DEFAULT_INJECTED);

  useEffect(() => {
    if (!previewId) return undefined;

    const controller = new AbortController();
    let active = true;

    axiosInstance.get(`/api/previews/${previewId}`, { signal: controller.signal })
      .then((response) => {
        if (!active) return;
        const product = parsePreviewProduct(response.data?.productData);
        setSourceState({ loading: false, data: product, error: '' });

        if (!hasUserSearched.current) {
          const initialKeyword = deriveKeyword(product.title);
          setSearchInput(initialKeyword);
          if (initialKeyword) {
            setSearchState((current) => ({ ...current, loading: true, error: '', results: [] }));
            setSearchRequest({ keyword: initialKeyword, forceRefresh: false, requestId: 1 });
          }
        }
      })
      .catch((error) => {
        if (!active || error.code === 'ERR_CANCELED') return;
        setSourceState({
          loading: false,
          data: null,
          error: 'Không đọc được Preview đã lưu. Hãy quay lại Task Detail, lưu lại form rồi thử lại.',
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [previewId]);

  useEffect(() => {
    if (!searchRequest?.keyword) return undefined;

    const controller = new AbortController();
    let active = true;

    axiosInstance.get('/api/amazon/search', {
      params: {
        keyword: searchRequest.keyword,
        forceRefresh: searchRequest.forceRefresh,
      },
      signal: controller.signal,
    })
      .then((response) => {
        if (!active) return;
        const results = Array.isArray(response.data) ? response.data : [];
        setSearchState({
          loading: false,
          results,
          error: '',
          loadedKeyword: searchRequest.keyword,
        });
      })
      .catch((error) => {
        if (!active || error.code === 'ERR_CANCELED') return;
        setSearchState({
          loading: false,
          results: [],
          error: getSearchError(error),
          loadedKeyword: searchRequest.keyword,
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [searchRequest]);

  const sourceProduct = sourceState.data;
  const sourceImages = useMemo(
    () => (Array.isArray(sourceProduct?.images) ? sourceProduct.images.filter(Boolean) : []),
    [sourceProduct],
  );
  const effectiveTitle = injected.title ?? sourceProduct?.title ?? '';
  const effectivePrice = injected.price ?? (sourceProduct?.price != null ? String(sourceProduct.price) : '');
  const maxPosition = searchState.results.length + 1;
  const safePosition = Math.min(Math.max(injectPosition, 1), Math.max(maxPosition, 1));

  const comparisonResults = useMemo(() => {
    const results = [...searchState.results];
    if (!sourceProduct) return results;

    results.splice(safePosition - 1, 0, {
      id: '__internal_listing__',
      isInjected: true,
      title: effectiveTitle,
      image: sourceImages[injected.imageIndex] || sourceImages[0] || null,
      price: effectivePrice,
      promotion: injected.promotion,
      shippingCost: injected.shippingCost,
      deliveryTime: injected.deliveryTime,
    });
    return results;
  }, [effectivePrice, effectiveTitle, injected, safePosition, searchState.results, sourceImages, sourceProduct]);

  const queueSearch = (keyword, forceRefresh) => {
    setSearchState((current) => ({
      ...current,
      loading: true,
      results: forceRefresh ? current.results : [],
      error: '',
    }));
    setSearchRequest((current) => ({
      keyword,
      forceRefresh,
      requestId: (current?.requestId || 0) + 1,
    }));
  };

  const handleSearchSubmit = () => {
    const keyword = searchInput.trim();
    hasUserSearched.current = true;
    if (!keyword) {
      setSearchState((current) => ({
        ...current,
        loading: false,
        results: [],
        error: 'Nhập từ khoá sản phẩm cần so sánh trước khi tìm kiếm.',
      }));
      return;
    }
    queueSearch(keyword, false);
  };

  const handleRefresh = () => {
    const keyword = (searchState.loadedKeyword || searchInput).trim();
    if (keyword) queueSearch(keyword, true);
  };

  const updateInjected = (field) => (event) => {
    setInjected((current) => ({ ...current, [field]: event.target.value }));
  };

  const workspacePath = projectId && taskId ? `/projects/${projectId}/tasks/${taskId}` : '/projects';
  const resultCountText = searchState.loadedKeyword
    ? `${searchState.results.length} kết quả đối thủ cho “${searchState.loadedKeyword}”`
    : 'Nhập từ khoá để lấy kết quả đối thủ từ Amazon';

  return (
    <div className="min-h-dvh overflow-x-clip bg-white text-gray-950">
      <a className="hc-skip-link" href="#amazon-search-results">Đi đến kết quả tìm kiếm</a>

      <section className="hc-app border-b border-[var(--hc-color-border)] bg-[var(--hc-color-canvas)]" aria-labelledby="comparison-title">
        <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 sm:py-5">
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <Link
                to={workspacePath}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--hc-color-border)] bg-white text-[var(--hc-navy-900)] transition-colors duration-200 hover:bg-[var(--hc-gray-100)]"
                aria-label="Quay lại Task Detail"
              >
                <ArrowLeft size={19} aria-hidden="true" />
              </Link>
              <div className="min-w-0">
                <div className="mb-1 flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  <h1 id="comparison-title" className="text-xl font-bold text-[var(--hc-navy-900)] sm:text-2xl">
                    So sánh Amazon Search
                  </h1>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                    SELLER / ADMIN
                  </span>
                </div>
                <p className="max-w-3xl text-sm leading-6 text-[var(--hc-gray-600)]">
                  Tìm đối thủ bằng ô Amazon bên dưới, sau đó đặt listing nội bộ cạnh sản phẩm muốn so sánh.
                </p>
              </div>
            </div>

            <div className="grid w-full grid-cols-1 gap-2 text-xs text-[var(--hc-gray-600)] sm:flex sm:w-auto sm:flex-wrap sm:items-center">
              <span className="inline-flex min-h-9 w-fit max-w-full items-center gap-2 rounded-full border border-[var(--hc-color-border)] bg-white px-3">
                <Database size={15} className="text-[var(--hc-color-focus)]" aria-hidden="true" />
                Dữ liệu Amazon · cache tối đa 24 giờ
              </span>
              <span className={`inline-flex min-h-9 w-fit max-w-full items-center gap-2 rounded-full border px-3 ${
                sourceProduct
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-amber-200 bg-amber-50 text-amber-900'
              }`}>
                <span className={`h-2 w-2 rounded-full ${sourceProduct ? 'bg-emerald-600' : 'bg-amber-500'}`} aria-hidden="true" />
                {sourceProduct ? 'Đã nạp Preview nội bộ' : 'Chưa có Preview nội bộ'}
              </span>
            </div>
          </div>

          <SearchListingEditor
            sourceLoading={sourceState.loading}
            sourceError={sourceState.error}
            sourceImages={sourceImages}
            injected={injected}
            effectiveTitle={effectiveTitle}
            effectivePrice={effectivePrice}
            onFieldChange={updateInjected}
            onImageChange={(event) => setInjected((current) => ({
              ...current,
              imageIndex: Number(event.target.value),
            }))}
          />

          <div className="mt-3 flex flex-col gap-3 rounded-xl border border-[var(--hc-color-border)] bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <div className="flex items-center gap-2 text-sm text-[var(--hc-gray-600)]">
              <LocateFixed size={18} className="shrink-0 text-emerald-700" aria-hidden="true" />
              <span>
                Listing nội bộ đang ở <strong className="text-[var(--hc-navy-900)]">vị trí {safePosition}</strong>
                {' '}trong {comparisonResults.length || 1} thẻ.
              </span>
            </div>

            <div className="grid w-full grid-cols-[auto_44px_minmax(72px,1fr)_44px] items-center gap-2 sm:flex sm:w-auto sm:flex-wrap">
              <label htmlFor="inject-position" className="text-sm font-semibold text-[var(--hc-navy-900)]">Vị trí</label>
              <button
                type="button"
                onClick={() => setInjectPosition(Math.max(safePosition - 1, 1))}
                disabled={!sourceProduct || safePosition <= 1}
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--hc-color-border)] bg-white hover:bg-[var(--hc-gray-100)] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Chuyển listing nội bộ về trước một vị trí"
              >
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
              <select
                id="inject-position"
                value={safePosition}
                onChange={(event) => setInjectPosition(Number(event.target.value))}
                disabled={!sourceProduct}
                className="h-11 min-w-20 rounded-lg border border-[var(--hc-input-border)] bg-white px-3 text-center font-semibold tabular-nums disabled:cursor-not-allowed disabled:bg-[var(--hc-gray-100)]"
              >
                {Array.from({ length: Math.max(maxPosition, 1) }, (_, index) => (
                  <option key={index + 1} value={index + 1}>{index + 1}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setInjectPosition(Math.min(safePosition + 1, maxPosition))}
                disabled={!sourceProduct || safePosition >= maxPosition}
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--hc-color-border)] bg-white hover:bg-[var(--hc-gray-100)] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Chuyển listing nội bộ về sau một vị trí"
              >
                <ChevronRight size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={searchState.loading || !(searchState.loadedKeyword || searchInput.trim())}
                className="col-span-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[var(--hc-color-border)] bg-white px-3.5 text-sm font-semibold text-[var(--hc-navy-900)] hover:bg-[var(--hc-gray-100)] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                {searchState.loading
                  ? <Loader2 size={17} className="animate-spin" aria-hidden="true" />
                  : <RefreshCw size={17} aria-hidden="true" />}
                Làm mới dữ liệu
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="font-amazon">
        <Header
          searchValue={searchInput}
          onSearchChange={(event) => setSearchInput(event.target.value)}
          onSearchSubmit={handleSearchSubmit}
          searchLoading={searchState.loading}
          searchPlaceholder="Tìm sản phẩm đối thủ trên Amazon"
        />

        <div className="border-b border-gray-200 bg-white px-4 py-3 shadow-sm sm:px-6">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="break-words text-sm text-[#0f1111]" aria-live="polite">{resultCountText}</p>
            {sourceProduct && (
              <p className="text-xs font-semibold text-emerald-800">Viền xanh = listing nội bộ cần so sánh</p>
            )}
          </div>
        </div>

        <main id="amazon-search-results" className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6" tabIndex="-1">
          {searchState.error && (
            <div className="mb-5 flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between" role="alert">
              <span className="flex items-start gap-2">
                <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>{searchState.error}</span>
              </span>
              {(searchState.loadedKeyword || searchInput.trim()) && (
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-amber-400 bg-white px-4 font-semibold hover:bg-amber-100"
                >
                  <RefreshCw size={16} aria-hidden="true" />
                  Thử lại
                </button>
              )}
            </div>
          )}

          {searchState.loading ? (
            <div role="status" aria-live="polite">
              <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Loader2 size={18} className="animate-spin text-[#ff9900]" aria-hidden="true" />
                Đang lấy dữ liệu Amazon cho “{searchRequest?.keyword}”...
              </div>
              <LoadingGrid />
            </div>
          ) : searchState.loadedKeyword && searchState.results.length === 0 && !searchState.error ? (
            <div className="mx-auto flex max-w-xl flex-col items-center py-20 text-center">
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                <Search size={24} aria-hidden="true" />
              </span>
              <h2 className="text-xl font-bold">Không tìm thấy sản phẩm đối thủ</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">Thử từ khoá ngắn hơn, tên danh mục hoặc đặc điểm chính của sản phẩm.</p>
            </div>
          ) : comparisonResults.length > 0 ? (
            <div className="flex items-start gap-6">
              <AmazonFilters />
              <section className="min-w-0 flex-1" aria-labelledby="results-heading">
                <h2 id="results-heading" className="mb-4 text-xl font-bold text-[#0f1111]">Results</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {comparisonResults.map((item, index) => (
                    <SearchResultCard
                      key={item.id || `${item.title}-${index}`}
                      item={item}
                      position={index + 1}
                      eagerImage={index < 4}
                    />
                  ))}
                </div>
              </section>
            </div>
          ) : !searchState.error && (
            <div className="mx-auto flex max-w-xl flex-col items-center py-20 text-center">
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#fff4e5] text-[#c45500]">
                <Search size={24} aria-hidden="true" />
              </span>
              <h2 className="text-xl font-bold">Bắt đầu bằng một từ khoá đối thủ</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Dùng ô tìm kiếm trong header Amazon. Listing nội bộ sẽ được chèn vào kết quả ngay sau khi dữ liệu tải xong.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AmazonSearchPage;
