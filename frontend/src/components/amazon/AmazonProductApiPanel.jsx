import { useState } from 'react';
import { AlertCircle, ArrowDownToLine, Database, Loader2, Search, X } from 'lucide-react';
import axiosInstance from '../../api/axiosConfig';

const AmazonProductApiPanel = ({ taskId, onPreview, onApply, onClear, product, previewing, applying }) => {
  const [open, setOpen] = useState(false);
  const [asinInput, setAsinInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [source, setSource] = useState('');

  const loadProduct = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get('/api/amazon/product', {
        // Use one API cache entry for desktop and mobile. The internal page itself is responsive.
        params: { asin: asinInput.trim(), device: 'desktop' },
      });
      setSource(response.headers['x-product-source'] || 'serpapi');
      onPreview(response.data, false);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không lấy được dữ liệu sản phẩm. Hãy kiểm tra ASIN hoặc thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const applyProductToTask = async () => {
    setError('');
    try {
      await onApply(asinInput.trim());
      setOpen(false);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể lưu dữ liệu API vào task. Hãy thử lại.');
    }
  };

  return (
    <section className="relative z-20 border-b border-[#d5d9d9] bg-[#f7f8fa] px-4 py-2 text-[#0f1111]">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#c8d1d8] bg-white px-3 text-sm font-semibold hover:bg-gray-50"
        >
          <Database size={16} className="text-[#2162a1]" aria-hidden="true" />
          Product API
        </button>
        <span className="text-xs text-[#565959]">
          {product ? `${product.title} · ${previewing ? 'đang xem dữ liệu API' : 'đã tải làm dữ liệu tham chiếu'}` : 'Tải dữ liệu sản phẩm thật theo ASIN để đối chiếu UI.'}
        </span>
        {product && !open && (
          <button type="button" onClick={onClear} className="ml-auto inline-flex items-center gap-1 text-xs text-[#007185] hover:underline">
            <X size={14} aria-hidden="true" /> Bỏ dữ liệu API
          </button>
        )}
      </div>

      {open && (
        <div className="mx-auto mt-2 max-w-[1500px] rounded-lg border border-[#d5d9d9] bg-white p-3 shadow-sm">
          <form onSubmit={loadProduct} className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="amazon-product-api-asin" className="sr-only">ASIN hoặc URL sản phẩm Amazon</label>
            <input
              id="amazon-product-api-asin"
              value={asinInput}
              onChange={(event) => setAsinInput(event.target.value)}
              placeholder="Nhập ASIN hoặc URL sản phẩm Amazon"
              className="min-h-10 min-w-0 flex-1 rounded-md border border-[#888c8c] px-3 text-sm outline-none focus:border-[#007185] focus:ring-2 focus:ring-[#c8f3fa]"
              autoComplete="off"
            />
            <button disabled={loading || !asinInput.trim()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#2162a1] px-4 text-sm font-semibold text-white hover:bg-[#174f86] disabled:cursor-wait disabled:opacity-60">
              {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Search size={16} aria-hidden="true" />}
              Lấy Product API
            </button>
          </form>

          {error && <p role="alert" className="mt-2 flex items-center gap-2 text-sm text-red-700"><AlertCircle size={16} />{error}</p>}

          {product && (
            <div className="mt-3 flex flex-col gap-3 border-t border-gray-100 pt-3 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {product.images?.[0] && <img src={product.images[0]} alt="" className="size-14 shrink-0 rounded border border-gray-200 object-contain" />}
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-semibold">{product.title}</p>
                  <p className="mt-1 text-xs text-[#565959]">ASIN {product.asin} · {product.images?.length || 0} ảnh · {source === 'cache' ? 'cache nội bộ' : 'SerpApi'}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => { onPreview(product); setOpen(false); }} className="min-h-9 rounded-md border border-[#c8d1d8] bg-white px-3 text-sm font-semibold hover:bg-gray-50">
                  {previewing ? 'Đang xem dữ liệu API' : 'Xem trên trang preview'}
                </button>
                {taskId && (
                  <button type="button" disabled={applying} onClick={applyProductToTask} className="inline-flex min-h-9 items-center gap-2 rounded-md bg-[#ffd814] px-3 text-sm font-semibold hover:bg-[#f7ca00] disabled:opacity-60">
                    {applying ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <ArrowDownToLine size={15} aria-hidden="true" />}
                    Áp dụng vào task
                  </button>
                )}
                <button type="button" onClick={onClear} className="min-h-9 rounded-md px-3 text-sm text-[#565959] hover:bg-gray-100">Bỏ dữ liệu</button>
              </div>
            </div>
          )}

          <p className="mt-2 text-[11px] text-[#565959]">
            Xem trên trang chỉ đổi dữ liệu đang hiển thị. “Áp dụng vào task” lưu dữ liệu API vào preview của task hiện tại.
          </p>
        </div>
      )}
    </section>
  );
};

export default AmazonProductApiPanel;
