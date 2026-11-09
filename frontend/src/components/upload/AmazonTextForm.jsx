import { useEffect, useState } from 'react';
import { Loader2, Lock, Type } from 'lucide-react';
import axiosInstance from '../../api/axiosConfig';
import { canEditZone } from '../../utils/permissions';
import useAutosaveText from './useAutosaveText';

const countCharacters = (value) => Array.from(value || '').length;
const countBytes = (value) => new TextEncoder().encode(value || '').length;
const initialForm = (data, title) => ({
  title: data?.title ?? title,
  brand: data?.brand ?? '',
  productType: data?.productType ?? '',
  bulletPoints: Array.from({ length: 5 }, (_, index) => data?.bulletPoints?.[index] || ''),
  description: data?.description ?? '',
  searchTerms: data?.searchTerms ?? '',
  price: data?.price ?? '',
  fabricType: data?.fabricType ?? '',
  careInstructions: data?.careInstructions ?? '',
  origin: data?.origin ?? '',
  sizes: (data?.sizes || []).join(', '),
});
const toRequest = (form) => ({
  ...form,
  price: form.price === '' ? null : Number(form.price),
  clearFields: form.price === '' ? ['price'] : [],
  sizes: form.sizes.split(',').map((item) => item.trim()).filter(Boolean),
});

const AmazonTextForm = ({ taskId, role, title, productData, updatedAt, version, onSaved, onDirtyChange }) => {
  const editable = canEditZone(role, 'SELLER');
  const [productTypes, setProductTypes] = useState([]);
  const [configError, setConfigError] = useState('');
  const { form, change, dirty, saving, error, retry, saveLabel } = useAutosaveText({
    taskId, initialForm: initialForm(productData, title), initialUpdatedAt: updatedAt, editable, version,
    onSaved, onDirtyChange, toRequest,
  });

  useEffect(() => {
    let active = true;
    axiosInstance.get('/api/content/amazon-product-types')
      .then(({ data }) => { if (active) setProductTypes(data); })
      .catch(() => { if (active) setConfigError('Không tải được danh sách loại sản phẩm.'); });
    return () => { active = false; };
  }, []);

  const input = (label, key, type = 'text') => (
    <label className="hc-field" htmlFor={`amazon-${key}`}>
      <span>{label}</span>
      <input id={`amazon-${key}`} className="hc-input" type={type} value={form[key]}
        onChange={(event) => change(key, event.target.value)} readOnly={!editable} />
    </label>
  );

  return (
    <section id="workspace-text" className={`hc-zone hc-zone--seller ${editable ? '' : 'hc-zone--locked'}`}>
      <div className="hc-zone__header">
        <div className="hc-zone__heading"><span className="hc-zone__icon"><Type size={20} /></span>
          <div><span className="hc-zone__label">SELLER</span><h2>Text · Amazon</h2></div>
        </div>
        <span className="hc-zone__permission">
          {editable ? (saving ? <Loader2 size={15} className="animate-spin" /> : saveLabel) : <><Lock size={15} /> Chỉ xem</>}
        </span>
      </div>
      <div className="hc-zone__content space-y-6">
        {error && <div className="hc-alert hc-alert--error" role="alert">{error} <button type="button" onClick={retry}>Thử lại</button></div>}
        {configError && <div className="hc-alert hc-alert--error" role="alert">{configError}</div>}
        <label className="hc-field" htmlFor="amazon-title">
          <span>Title · {countCharacters(form.title)} ký tự</span>
          <textarea id="amazon-title" className="hc-input" rows={3} value={form.title}
            onChange={(event) => change('title', event.target.value)} readOnly={!editable} />
        </label>
        <div className="hc-form-grid">
          {input('Brand', 'brand')}
          <label className="hc-field" htmlFor="amazon-product-type">
            <span>Loại sản phẩm (product_type)</span>
            <select id="amazon-product-type" className="hc-select" value={form.productType}
              onChange={(event) => change('productType', event.target.value)} disabled={!editable || Boolean(configError)}>
              <option value="">Chưa chọn</option>
              {productTypes.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            <small>Có thể lưu bản nháp khi chưa chọn loại sản phẩm.</small>
          </label>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-bold">Bullet points</h3>
          {form.bulletPoints.map((point, index) => (
            <label className="hc-field mb-3" key={index} htmlFor={`amazon-bullet-${index}`}>
              <span>Bullet {index + 1} · {countCharacters(point)} ký tự</span>
              <textarea id={`amazon-bullet-${index}`} className="hc-input" rows={2} value={point}
                onChange={(event) => change('bulletPoints', form.bulletPoints.map((item, position) => position === index ? event.target.value : item))}
                readOnly={!editable} />
            </label>
          ))}
        </div>
        <label className="hc-field" htmlFor="amazon-description">
          <span>Description · {countCharacters(form.description)} ký tự</span>
          <textarea id="amazon-description" className="hc-input" rows={4} value={form.description}
            onChange={(event) => change('description', event.target.value)} readOnly={!editable} />
        </label>
        <label className="hc-field" htmlFor="amazon-search-terms">
          <span>Search terms · {countBytes(form.searchTerms)} byte</span>
          <textarea id="amazon-search-terms" className="hc-input" rows={3} value={form.searchTerms}
            onChange={(event) => change('searchTerms', event.target.value)} readOnly={!editable} />
          <small>Từ khóa ẩn, người mua không thấy.</small>
        </label>
        <div className="hc-form-grid">
          {input('Giá (USD)', 'price', 'number')}
          {input('Size (ngăn cách bằng dấu phẩy)', 'sizes')}
          {input('Fabric type', 'fabricType')}
          {input('Care instructions', 'careInstructions')}
          {input('Origin', 'origin')}
        </div>
        {editable && dirty && <p className="text-xs" role="status">{saveLabel}</p>}
      </div>
    </section>
  );
};

export default AmazonTextForm;
