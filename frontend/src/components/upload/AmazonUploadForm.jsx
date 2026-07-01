import React, { useState } from 'react';
import { Upload, X, Plus, Save, Loader2, CheckCircle } from 'lucide-react';
import axiosInstance from '../../api/axiosConfig';

const MAX_IMAGES = 7;
const MAX_APLUS = 5;

const SIZES_PRESETS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

const AmazonUploadForm = ({ projectId, taskId, platform = 'AMAZON', category = 1 }) => {
  // Text fields
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [brand, setBrand] = useState('');
  const [fabricType, setFabricType] = useState('');
  const [careInstructions, setCareInstructions] = useState('');
  const [origin, setOrigin] = useState('');

  // Bullet points
  const [bulletPoints, setBulletPoints] = useState(['', '', '', '', '']);

  // Images: { file: File, preview: string }[]
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);

  // Colors: { name: string, file: File, preview: string }[]
  const [colors, setColors] = useState([]);
  const [newColorName, setNewColorName] = useState('');

  // Sizes
  const [sizes, setSizes] = useState([]);

  // A+ Content
  const [aPlusImages, setAPlusImages] = useState([]);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [savedPreviewId, setSavedPreviewId] = useState(null);
  const [error, setError] = useState('');

  // ── Image handlers ──────────────────────────────────────────────
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const remaining = MAX_IMAGES - images.length;
    files.slice(0, remaining).forEach(file => {
      setImages(prev => [...prev, { file, preview: URL.createObjectURL(file) }]);
    });
    e.target.value = '';
  };

  const removeImage = (idx) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) setVideo({ file, preview: URL.createObjectURL(file) });
    e.target.value = '';
  };

  // ── Color handlers ──────────────────────────────────────────────
  const handleColorImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && newColorName.trim()) {
      setColors(prev => [...prev, { name: newColorName.trim(), file, preview: URL.createObjectURL(file) }]);
      setNewColorName('');
    }
    e.target.value = '';
  };

  const removeColor = (idx) => {
    setColors(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // ── Size handlers ───────────────────────────────────────────────
  const toggleSize = (size) => {
    setSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  };

  const addCustomSize = (e) => {
    if (e.key === 'Enter') {
      const val = e.target.value.trim().toUpperCase();
      if (val && !sizes.includes(val)) setSizes(prev => [...prev, val]);
      e.target.value = '';
    }
  };

  // ── A+ Content ──────────────────────────────────────────────────
  const handleAPlusUpload = (e) => {
    const files = Array.from(e.target.files);
    const remaining = MAX_APLUS - aPlusImages.length;
    files.slice(0, remaining).forEach(file => {
      setAPlusImages(prev => [...prev, { file, preview: URL.createObjectURL(file) }]);
    });
    e.target.value = '';
  };

  const removeAPlus = (idx) => {
    setAPlusImages(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // ── Submit ──────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError('Vui lòng nhập tiêu đề sản phẩm.'); return; }

    setSubmitting(true);
    setError('');

    try {
      const fd = new FormData();
      fd.append('taskId', taskId);
      fd.append('platform', platform);
      fd.append('title', title);
      if (price) fd.append('price', price);
      if (brand) fd.append('brand', brand);
      if (fabricType) fd.append('fabricType', fabricType);
      if (careInstructions) fd.append('careInstructions', careInstructions);
      if (origin) fd.append('origin', origin);

      bulletPoints.filter(b => b.trim()).forEach(b => fd.append('bulletPoints', b));
      sizes.forEach(s => fd.append('sizes', s));

      if (images.length > 0) {
        fd.append('mainImage', images[0].file);
        images.slice(1).forEach(img => fd.append('galleryImages', img.file));
      }
      if (video) fd.append('video', video.file);

      colors.forEach(c => fd.append('colorNames', c.name));
      colors.forEach(c => fd.append('colorImages', c.file));

      aPlusImages.forEach(ap => fd.append('aPlusImages', ap.file));

      const response = await axiosInstance.post('/api/previews/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSavedPreviewId(response.data.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Section 1: Thông tin cơ bản ── */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-sm font-bold flex items-center justify-center">1</span>
          Thông tin sản phẩm
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề sản phẩm <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={200}
              placeholder="VD: Men's Classic Fit Crewneck T-Shirt, 100% Cotton..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">{title.length}/200 ký tự</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giá ($)</label>
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              step="0.01" min="0"
              placeholder="19.99"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
            <input
              type="text"
              value={brand}
              onChange={e => setBrand(e.target.value)}
              placeholder="VD: Hanes, Amazon Essentials..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
            />
          </div>

          {(category === 1) && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fabric Type</label>
                <input
                  type="text"
                  value={fabricType}
                  onChange={e => setFabricType(e.target.value)}
                  placeholder="VD: 100% Cotton, Polyester Blend..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Care Instructions</label>
                <input
                  type="text"
                  value={careInstructions}
                  onChange={e => setCareInstructions(e.target.value)}
                  placeholder="VD: Machine wash cold, tumble dry low"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country of Origin</label>
            <input
              type="text"
              value={origin}
              onChange={e => setOrigin(e.target.value)}
              placeholder="VD: Vietnam, China, Bangladesh..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
            />
          </div>
        </div>
      </section>

      {/* ── Section 2: Bullet Points ── */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-sm font-bold flex items-center justify-center">2</span>
          Bullet Points (tối đa 5)
        </h2>
        <div className="space-y-3">
          {bulletPoints.map((bp, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-gray-400 text-sm w-5 flex-shrink-0">•</span>
              <input
                type="text"
                value={bp}
                onChange={e => {
                  const copy = [...bulletPoints];
                  copy[idx] = e.target.value;
                  setBulletPoints(copy);
                }}
                placeholder={`Bullet point ${idx + 1}`}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 3: Hình ảnh ── */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 text-sm font-bold flex items-center justify-center">3</span>
          Hình ảnh sản phẩm
          <span className="text-xs font-normal text-gray-400 ml-1">(tối đa {MAX_IMAGES} ảnh, tỷ lệ 1:1)</span>
        </h2>
        <p className="text-xs text-gray-400 mb-4">Ảnh đầu tiên là ảnh chính. Khuyến nghị 1000×1000px trở lên.</p>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {images.map((img, idx) => (
            <div key={idx} className="relative aspect-square border-2 border-gray-200 rounded-lg overflow-hidden group">
              <img src={img.preview} alt={`img-${idx}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow opacity-0 group-hover:opacity-100 transition-opacity text-red-500"
              >
                <X size={14} />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-xs text-center py-0.5">
                {idx === 0 ? 'Main' : `Slot ${idx + 1}`}
              </div>
            </div>
          ))}

          {images.length < MAX_IMAGES && (
            <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors">
              <Upload size={20} className="text-gray-400 mb-1" />
              <span className="text-xs text-gray-400">Thêm ảnh</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
          )}
        </div>

        {/* Video */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Video sản phẩm
            <span className="text-xs font-normal text-gray-400 ml-1">(tùy chọn, tối đa 1 video)</span>
          </h3>
          {video ? (
            <div className="relative inline-block">
              <video
                src={video.preview}
                className="h-32 rounded-lg border border-gray-200"
                controls
              />
              <button
                type="button"
                onClick={() => setVideo(null)}
                className="absolute top-1 right-1 bg-white rounded-full p-1 shadow text-red-500"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <label className="inline-flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 hover:border-orange-400 hover:bg-orange-50 transition-colors text-sm text-gray-500">
              <Upload size={18} />
              Upload Video
              <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
            </label>
          )}
        </div>
      </section>

      {/* ── Section 4: Màu sắc & Size (chỉ cho Clothing) ── */}
      {category === 1 && (
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-sm font-bold flex items-center justify-center">4</span>
            Màu sắc & Kích cỡ
          </h2>

          {/* Colors */}
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Màu sắc</h3>
            <div className="flex flex-wrap gap-3 mb-3">
              {colors.map((c, idx) => (
                <div key={idx} className="relative group">
                  <img src={c.preview} alt={c.name} className="w-14 h-14 rounded-lg object-cover border-2 border-gray-200" />
                  <p className="text-xs text-center text-gray-500 mt-0.5 truncate max-w-[56px]">{c.name}</p>
                  <button
                    type="button"
                    onClick={() => removeColor(idx)}
                    className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow opacity-0 group-hover:opacity-100 transition-opacity text-red-500"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newColorName}
                onChange={e => setNewColorName(e.target.value)}
                placeholder="Tên màu (VD: Navy Blue)"
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 w-48"
              />
              <label className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${newColorName.trim() ? 'bg-orange-50 border border-orange-300 text-orange-600 hover:bg-orange-100' : 'bg-gray-50 border border-gray-200 text-gray-400 cursor-not-allowed'}`}>
                <Plus size={16} />
                Chọn ảnh màu
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={!newColorName.trim()}
                  onChange={handleColorImageUpload}
                />
              </label>
            </div>
          </div>

          {/* Sizes */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Kích cỡ</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {SIZES_PRESETS.map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${sizes.includes(size) ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-200 text-gray-600 hover:border-orange-300'}`}
                >
                  {size}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Kích cỡ tuỳ chỉnh — nhấn Enter để thêm"
              onKeyDown={addCustomSize}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 w-full"
            />
          </div>
        </section>
      )}

      {/* ── Section 5: A+ Content ── */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-sm font-bold flex items-center justify-center">
            {category === 1 ? 5 : 4}
          </span>
          A+ Content
          <span className="text-xs font-normal text-gray-400 ml-1">(tùy chọn, tỷ lệ 970×600)</span>
        </h2>
        <p className="text-xs text-gray-400 mb-4">Ảnh nội dung phong phú cho phần mô tả. Tối đa {MAX_APLUS} ảnh.</p>

        <div className="space-y-3">
          {aPlusImages.map((ap, idx) => (
            <div key={idx} className="relative group max-w-2xl">
              <img
                src={ap.preview}
                alt={`aplus-${idx}`}
                className="w-full rounded-lg border border-gray-200"
                style={{ aspectRatio: '970/600', objectFit: 'cover' }}
              />
              <button
                type="button"
                onClick={() => removeAPlus(idx)}
                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity text-red-500"
              >
                <X size={16} />
              </button>
            </div>
          ))}

          {aPlusImages.length < MAX_APLUS && (
            <label className="max-w-2xl flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors">
              <Upload size={24} className="text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">Upload A+ Module (970×600)</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleAPlusUpload} />
            </label>
          )}
        </div>
      </section>

      {/* ── Submit ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {savedPreviewId && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle size={16} />
          Upload thành công! Preview ID: <code className="font-mono">{savedPreviewId}</code>
        </div>
      )}

      <div className="flex justify-end pb-8">
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-60"
        >
          {submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {submitting ? 'Đang upload...' : 'Lưu & Upload'}
        </button>
      </div>
    </form>
  );
};

export default AmazonUploadForm;
