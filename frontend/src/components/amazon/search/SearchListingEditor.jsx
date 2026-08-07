import { ChevronDown, Image as ImageIcon, MapPin, PackageSearch } from 'lucide-react';

const Field = ({ label, hint, children }) => (
  <label className="flex min-w-0 flex-col gap-1.5 text-sm font-semibold text-[var(--hc-navy-900)]">
    <span>{label}</span>
    {children}
    {hint && <span className="text-xs font-normal leading-5 text-[var(--hc-gray-500)]">{hint}</span>}
  </label>
);

const inputClassName = 'min-h-11 w-full rounded-lg border border-[var(--hc-input-border)] bg-white px-3 text-sm text-[var(--hc-navy-900)] placeholder:text-[var(--hc-gray-400)] focus:border-[var(--hc-color-focus)] focus:outline-none';

const SearchListingEditor = ({
  sourceLoading,
  sourceError,
  sourceImages,
  injected,
  effectiveTitle,
  effectivePrice,
  onFieldChange,
  onImageChange,
}) => (
  <details className="group overflow-hidden rounded-xl border border-[var(--hc-color-border)] bg-white shadow-[var(--hc-shadow-xs)]" open>
    <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 marker:hidden sm:px-5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
        <PackageSearch size={19} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-[var(--hc-navy-900)]">Nội dung listing nội bộ</span>
        <span className="block truncate text-xs leading-5 text-[var(--hc-gray-500)]">
          {sourceLoading ? 'Đang lấy dữ liệu từ Preview đã lưu...'
            : sourceError || 'Chỉnh 6 trường trong brief; kết quả cập nhật ngay trong lưới so sánh.'}
        </span>
      </span>
      <ChevronDown
        size={20}
        className="shrink-0 text-[var(--hc-gray-500)] transition-transform duration-200 group-open:rotate-180"
        aria-hidden="true"
      />
    </summary>

    <div className="border-t border-[var(--hc-color-border)] bg-[var(--hc-gray-25)] px-4 py-4 sm:px-5">
      {sourceError && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm leading-5 text-amber-900" role="alert">
          {sourceError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Ảnh chính" hint="Chọn từ bộ ảnh của Preview đã lưu.">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--hc-color-border)] bg-white">
              {sourceImages[injected.imageIndex] ? (
                <img
                  src={sourceImages[injected.imageIndex]}
                  alt="Ảnh chính đang chọn"
                  width="44"
                  height="44"
                  className="h-full w-full object-contain"
                />
              ) : (
                <ImageIcon size={18} className="text-[var(--hc-gray-400)]" aria-hidden="true" />
              )}
            </div>
            <select
              value={injected.imageIndex}
              onChange={onImageChange}
              disabled={sourceLoading || sourceImages.length === 0}
              className={`${inputClassName} min-w-0 flex-1 disabled:cursor-not-allowed disabled:bg-[var(--hc-gray-100)] disabled:text-[var(--hc-gray-500)]`}
            >
              {sourceImages.length === 0
                ? <option value={0}>Preview chưa có ảnh</option>
                : sourceImages.map((_, index) => (
                  <option key={index} value={index}>Ảnh {index + 1}</option>
                ))}
            </select>
          </div>
        </Field>

        <Field label="Tên sản phẩm">
          <input
            type="text"
            value={effectiveTitle}
            onChange={onFieldChange('title')}
            disabled={sourceLoading}
            placeholder="Nhập tên listing nội bộ"
            className={`${inputClassName} disabled:cursor-wait disabled:bg-[var(--hc-gray-100)]`}
          />
        </Field>

        <Field label="Giá hiển thị (USD)">
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={effectivePrice}
            onChange={onFieldChange('price')}
            disabled={sourceLoading}
            placeholder="Ví dụ: 29.99"
            className={`${inputClassName} tabular-nums disabled:cursor-wait disabled:bg-[var(--hc-gray-100)]`}
          />
        </Field>

        <Field label="Chương trình khuyến mãi">
          <input
            type="text"
            value={injected.promotion}
            onChange={onFieldChange('promotion')}
            placeholder="Ví dụ: Giảm 15% hôm nay"
            className={inputClassName}
          />
        </Field>

        <Field label="Giá vận chuyển">
          <div className="relative">
            <MapPin size={16} className="pointer-events-none absolute left-3 top-3.5 text-[var(--hc-gray-400)]" aria-hidden="true" />
            <input
              type="text"
              value={injected.shippingCost}
              onChange={onFieldChange('shippingCost')}
              placeholder="Ví dụ: FREE delivery"
              className={`${inputClassName} pl-9`}
            />
          </div>
        </Field>

        <Field label="Thời gian giao hàng">
          <input
            type="text"
            value={injected.deliveryTime}
            onChange={onFieldChange('deliveryTime')}
            placeholder="Ví dụ: Giao vào Thứ Sáu, 8/8"
            className={inputClassName}
          />
        </Field>
      </div>
    </div>
  </details>
);

export default SearchListingEditor;
