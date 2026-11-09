import { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, Loader2, Upload, Video } from 'lucide-react';
import axiosInstance from '../../api/axiosConfig';
import { useAppStore } from '../../stores/appStore';
import { canEditZone } from '../../utils/permissions';

const FilePicker = ({ label, accept, multiple, onChange }) => (
  <label className="hc-button hc-button--secondary cursor-pointer">
    <Upload size={16} aria-hidden="true" />
    {label}
    <input className="sr-only" type="file" accept={accept} multiple={multiple} onChange={onChange} />
  </label>
);

const SelectedImage = ({ file, alt }) => {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => setUrl(reader.result);
    reader.readAsDataURL(file);
    return () => reader.abort();
  }, [file]);
  return url ? <img className="rounded-lg" src={url} alt={alt} /> : null;
};

const ListingMediaForm = ({ taskId, platform, category, role, title, productData, version, onSaved, onDirtyChange }) => {
  const canEditImages = canEditZone(role, 'PRODUCT_DESIGN');
  const canEditVideo = canEditZone(role, 'MARVEL');
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [colorImages, setColorImages] = useState([]);
  const [colorName, setColorName] = useState('');
  const [aPlusImages, setAPlusImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Version preview mà trang đã tải; gửi kèm khi upload để backend phát hiện nội dung đã đổi ở nơi khác (409).
  const versionRef = useRef(version ?? null);
  useEffect(() => {
    if (version != null && (versionRef.current == null || version > versionRef.current)) {
      versionRef.current = version;
    }
  }, [version]);
  const savedImages = productData?.images || [];
  const savedVideos = productData?.videos || [];
  const savedColors = productData?.colors || [];
  const savedAPlus = productData?.aPlusImages || [];
  const isCaseOne = platform === 'AMAZON' && Number(category) === 1;
  const imageLimit = platform === 'ETSY' ? 20 : (isCaseOne && savedVideos.length + videos.length ? 6 : (isCaseOne ? 7 : null));
  const videoLimit = platform === 'ETSY' || isCaseOne ? 1 : null;
  const imageCount = savedImages.length + images.length;
  const videoCount = savedVideos.length + videos.length;
  const dirty = Boolean(images.length + videos.length + colorImages.length + aPlusImages.length);

  useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);

  const choose = (event, setter, available) => {
    const files = Array.from(event.target.files || []).slice(0, available ?? undefined);
    if (files.length) {
      setter((current) => [...current, ...files]);
    }
    event.target.value = '';
  };

  const remove = (setter, index) => {
    setter((current) => current.filter((_, position) => position !== index));
    // Tính lại ở lần render tiếp theo; nút review cũng kiểm trạng thái lưu trên server.
  };

  const save = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    setError('');
    const buildBody = () => {
      const body = new FormData();
      body.append('taskId', taskId);
      body.append('platform', platform);
      body.append('title', title);
      if (versionRef.current != null) body.append('version', versionRef.current);
      if (images.length) {
        body.append('mainImage', images[0]);
        images.slice(1).forEach((file) => body.append('galleryImages', file));
      }
      videos.forEach((file) => body.append('videos', file));
      colorImages.forEach(({ file, name }) => {
        body.append('colorNames', name);
        body.append('colorImages', file);
      });
      aPlusImages.forEach((file) => body.append('aPlusImages', file));
      return body;
    };
    try {
      let response;
      try {
        response = await axiosInstance.post('/api/previews/upload', buildBody());
      } catch (requestError) {
        if (requestError.response?.status !== 409) throw requestError;
        // Nội dung vừa đổi ở nơi khác (ví dụ đang tự lưu Text): tải lại bản hiện hành, giữ nguyên các file đã chọn
        // rồi gửi lại một lần với version mới.
        const fresh = await useAppStore.getState().fetchCurrentPreview(taskId);
        versionRef.current = fresh?.version ?? null;
        if (fresh) onSaved?.(fresh);
        response = await axiosInstance.post('/api/previews/upload', buildBody());
      }
      if (response.data?.version != null) versionRef.current = response.data.version;
      setImages([]);
      setVideos([]);
      setColorImages([]);
      setAPlusImages([]);
      onSaved?.(response.data);
    } catch (requestError) {
      const status = requestError.response?.status;
      if (status === 403) setError('Bạn không có quyền lưu vùng media này.');
      else if (status === 409) setError('Nội dung vừa được cập nhật ở nơi khác. Đã tải lại, hãy bấm Lưu media lần nữa.');
      else setError('Không lưu được media. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className={`hc-zone hc-zone--design ${canEditImages ? '' : 'hc-zone--locked'}`}>
        <div className="hc-zone__header">
          <div className="hc-zone__heading"><span className="hc-zone__icon"><ImageIcon size={20} /></span>
            <div><span className="hc-zone__label">PRODUCT DESIGN</span><h2>Ảnh và A+ Content</h2></div>
          </div>
          <span className="hc-zone__permission">{canEditImages ? 'Được chỉnh sửa' : 'Chỉ xem'}</span>
        </div>
        <div className="hc-zone__content space-y-6">
          <div>
            <h3 className="mb-2 text-sm font-bold">Ảnh sản phẩm · {imageCount}{imageLimit === null ? '' : `/${imageLimit}`}</h3>
            <div className="hc-upload-grid">
              {savedImages.map((url, index) => <img className="rounded-lg" key={`${url}-${index}`} src={url} alt={`Ảnh đã lưu ${index + 1}`} />)}
            </div>
            {images.map((file, index) => <div key={`${file.name}-${index}`} className="mt-2 flex items-center gap-2 text-sm">
              <SelectedImage file={file} alt={`Ảnh mới ${index + 1}`} />
              <span>{file.name}</span><button type="button" onClick={() => remove(setImages, index)} aria-label={`Bỏ ảnh ${file.name}`}>×</button>
            </div>)}
            {canEditImages && (imageLimit === null || imageCount < imageLimit) &&
              <FilePicker label="Thêm ảnh" accept="image/*" multiple onChange={(event) => choose(event, setImages, imageLimit === null ? null : imageLimit - imageCount)} />}
            {platform === 'AMAZON' && Number(category) > 1 && <p className="mt-2 text-xs">Hạn mức ảnh/video Case 2/3 đang chờ chốt.</p>}
          </div>
          {isCaseOne && <div className="border-t pt-4">
            <h3 className="mb-2 text-sm font-bold">Biến thể màu</h3>
            <div className="hc-upload-grid">{savedColors.map((color, index) =>
              <img className="rounded-lg" key={`${color.image}-${index}`} src={color.image} alt={color.name || 'Màu đã lưu'} />)}</div>
            {colorImages.map((entry, index) => <p className="text-sm" key={index}>{entry.name}: {entry.file.name}</p>)}
            {canEditImages && <div className="hc-form-grid mt-3">
              <label className="hc-field"><span>Tên màu</span><input className="hc-input" value={colorName} onChange={(event) => setColorName(event.target.value)} /></label>
              <label className="hc-field"><span>Ảnh màu</span><input type="file" accept="image/*" disabled={!colorName.trim()}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) { setColorImages((current) => [...current, { file, name: colorName.trim() }]); setColorName(''); }
                  event.target.value = '';
                }} /></label>
            </div>}
          </div>}
          <div className="border-t pt-4">
            <h3 className="mb-2 text-sm font-bold">A+ Content</h3>
            <div className="hc-upload-grid">{savedAPlus.map((url, index) =>
              <img className="rounded-lg" key={`${url}-${index}`} src={url} alt={`A+ đã lưu ${index + 1}`} />)}</div>
            {aPlusImages.map((file, index) => <div className="mt-2 flex items-center gap-2 text-sm" key={`${file.name}-${index}`}>
              <SelectedImage file={file} alt={`A+ mới ${index + 1}`} /><span>{file.name}</span>
              <button type="button" onClick={() => remove(setAPlusImages, index)} aria-label={`Bỏ A+ ${file.name}`}>×</button>
            </div>)}
            {canEditImages && <FilePicker label="Thêm A+" accept="image/*" multiple onChange={(event) => choose(event, setAPlusImages, null)} />}
          </div>
        </div>
      </section>
      <section className={`hc-zone hc-zone--marvel ${canEditVideo ? '' : 'hc-zone--locked'}`}>
        <div className="hc-zone__header">
          <div className="hc-zone__heading"><span className="hc-zone__icon"><Video size={20} /></span>
            <div><span className="hc-zone__label">MARVEL LABS</span><h2>Video · {videoCount}{videoLimit === null ? '' : `/${videoLimit}`}</h2></div>
          </div>
          <span className="hc-zone__permission">{canEditVideo ? 'Được chỉnh sửa' : 'Chỉ xem'}</span>
        </div>
        <div className="hc-zone__content">
          <div className="grid gap-3 sm:grid-cols-2">{savedVideos.map((url, index) =>
            <video key={`${url}-${index}`} src={url} controls preload="metadata" aria-label={`Video đã lưu ${index + 1}`} />)}</div>
          {videos.map((file, index) => <div className="mt-2 flex items-center gap-2 text-sm" key={`${file.name}-${index}`}>
            {file.name}<button type="button" onClick={() => remove(setVideos, index)} aria-label={`Bỏ video ${file.name}`}>×</button>
          </div>)}
          {canEditVideo && (videoLimit === null || videoCount < videoLimit) && (!isCaseOne || imageCount < 7) &&
            <FilePicker label="Thêm video" accept="video/*" multiple={videoLimit === null}
              onChange={(event) => choose(event, setVideos, videoLimit === null ? null : videoLimit - videoCount)} />}
        </div>
      </section>
      {(canEditImages || canEditVideo) && <div>
        {error && <p className="hc-alert hc-alert--error mb-3" role="alert">{error}</p>}
        <button type="button" className="hc-button hc-button--primary" onClick={save} disabled={!dirty || saving}>
          {saving ? <Loader2 className="animate-spin" size={16} aria-hidden="true" /> : <Upload size={16} aria-hidden="true" />}
          {saving ? 'Đang lưu media…' : 'Lưu media'}
        </button>
      </div>}
    </div>
  );
};

export default ListingMediaForm;
