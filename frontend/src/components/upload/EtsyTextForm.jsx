import { Lock, Type } from 'lucide-react';
import { canEditZone } from '../../utils/permissions';
import useAutosaveText from './useAutosaveText';

const countCharacters = (value) => Array.from(value || '').length;
const initialForm = (data, title) => ({
  title: data?.title ?? title,
  tags: data?.tags || [],
  description: data?.description ?? '',
  materials: (data?.materials || []).join(', '),
  price: data?.price ?? '',
  quantity: data?.quantity ?? '',
  whoMade: data?.whoMade ?? '',
  whenMade: data?.whenMade ?? '',
  taxonomyPath: data?.taxonomyPath ?? '',
});
const toRequest = (form) => ({
  ...form,
  materials: form.materials.split(',').map((item) => item.trim()).filter(Boolean),
  price: form.price === '' ? null : Number(form.price),
  quantity: form.quantity === '' ? null : Number(form.quantity),
  clearFields: ['price', 'quantity'].filter((field) => form[field] === ''),
});

const EtsyTextForm = ({ taskId, role, title, productData, updatedAt, version, onSaved, onDirtyChange }) => {
  const editable = canEditZone(role, 'SELLER');
  const { form, change, dirty, error, retry, saveLabel } = useAutosaveText({
    taskId, initialForm: initialForm(productData, title), initialUpdatedAt: updatedAt, editable, version,
    onSaved, onDirtyChange, toRequest,
  });

  const input = (label, key, type = 'text') => (
    <label className="hc-field" htmlFor={`etsy-${key}`}>
      <span>{label}</span>
      <input id={`etsy-${key}`} className="hc-input" type={type} value={form[key]}
        onChange={(event) => change(key, event.target.value)} readOnly={!editable} />
    </label>
  );

  return (
    <section id="workspace-text" className={`hc-zone hc-zone--seller ${editable ? '' : 'hc-zone--locked'}`}>
      <div className="hc-zone__header">
        <div className="hc-zone__heading"><span className="hc-zone__icon"><Type size={20} /></span>
          <div><span className="hc-zone__label">SELLER</span><h2>Text · Etsy</h2></div>
        </div>
        <span className="hc-zone__permission">{editable ? saveLabel : <><Lock size={15} /> Chỉ xem</>}</span>
      </div>
      <div className="hc-zone__content space-y-6">
        {error && <div className="hc-alert hc-alert--error" role="alert">{error} <button type="button" onClick={retry}>Thử lại</button></div>}
        <label className="hc-field" htmlFor="etsy-title">
          <span>Title · {countCharacters(form.title)} ký tự</span>
          <textarea id="etsy-title" className="hc-input" rows={3} value={form.title}
            onChange={(event) => change('title', event.target.value)} readOnly={!editable} />
        </label>
        <div>
          <label className="hc-field" htmlFor="etsy-new-tag">
            <span>Tags · {form.tags.length} tag</span>
            <input id="etsy-new-tag" className="hc-input" placeholder="Nhập tag rồi nhấn Enter" readOnly={!editable}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && editable) {
                  event.preventDefault();
                  const value = event.currentTarget.value.trim();
                  if (value && !form.tags.includes(value)) change('tags', [...form.tags, value]);
                  event.currentTarget.value = '';
                }
              }} />
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {form.tags.map((tag, index) => <span className="rounded-full border px-3 py-1 text-xs" key={`${tag}-${index}`}>
              {tag} · {countCharacters(tag)}
              {editable && <button type="button" className="ml-2" aria-label={`Xóa tag ${tag}`}
                onClick={() => change('tags', form.tags.filter((_, position) => position !== index))}>×</button>}
            </span>)}
          </div>
        </div>
        <label className="hc-field" htmlFor="etsy-description">
          <span>Description · {countCharacters(form.description)} ký tự</span>
          <textarea id="etsy-description" className="hc-input" rows={5} value={form.description}
            onChange={(event) => change('description', event.target.value)} readOnly={!editable} />
        </label>
        <div className="hc-form-grid">
          {input('Materials (ngăn cách bằng dấu phẩy)', 'materials')}
          {input('Giá', 'price', 'number')}
          {input('Số lượng', 'quantity', 'number')}
          <label className="hc-field" htmlFor="etsy-whoMade">
            <span>Ai làm (who_made)</span>
            <select id="etsy-whoMade" className="hc-select" value={form.whoMade}
              onChange={(event) => change('whoMade', event.target.value)} disabled={!editable}>
              <option value="">Chưa chọn</option>
              <option value="i_did">i_did</option>
              <option value="someone_else">someone_else</option>
              <option value="collective">collective</option>
            </select>
          </label>
          {input('Thời điểm làm (when_made)', 'whenMade')}
          {input('Danh mục (taxonomy)', 'taxonomyPath')}
        </div>
        {editable && dirty && <p className="text-xs" role="status">{saveLabel}</p>}
      </div>
    </section>
  );
};

export default EtsyTextForm;
