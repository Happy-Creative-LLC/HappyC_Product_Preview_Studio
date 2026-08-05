import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Images,
  Loader2,
  Lock,
  Palette,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  Type,
  Upload,
  Video,
} from 'lucide-react';
import axiosInstance from '../../api/axiosConfig';
import { canEditZone } from '../../utils/permissions';

const CASE_ONE_IMAGE_LIMIT = 7;
const ETSY_IMAGE_LIMIT = 20;
const SINGLE_VIDEO_LIMIT = 1;
const SIZES_PRESETS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

const createFileItemId = (file) => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${file.name}-${file.lastModified}-${file.size}-${Math.random().toString(36).slice(2)}`;
};

const ZoneHeader = ({
  id,
  icon: Icon,
  label,
  title,
  description,
  editable,
}) => (
  <div className="hc-zone__header">
    <div className="hc-zone__heading">
      <span className="hc-zone__icon" aria-hidden="true">
        <Icon size={20} />
      </span>
      <div>
        <span className="hc-zone__label">{label}</span>
        <h2 id={id}>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
    <span className="hc-zone__permission">
      {editable ? <ShieldCheck size={15} aria-hidden="true" /> : <Lock size={15} aria-hidden="true" />}
      {editable ? 'Được chỉnh sửa' : 'Chỉ xem'}
    </span>
  </div>
);

const ZoneFooter = ({ editable, editableText, lockedText }) => (
  <div className="hc-zone__footer">
    <span className="inline-flex items-center gap-2">
      {editable ? <ShieldCheck size={15} aria-hidden="true" /> : <Lock size={15} aria-hidden="true" />}
      {editable ? editableText : lockedText}
    </span>
  </div>
);

const UploadTileRemoveButton = ({ label, onClick }) => (
  <button
    type="button"
    className="hc-upload-tile__remove"
    style={{ width: '2.75rem', height: '2.75rem' }}
    onClick={onClick}
    aria-label={label}
    title={label}
  >
    <Trash2 size={17} aria-hidden="true" />
  </button>
);

const AmazonUploadForm = ({
  projectId,
  taskId,
  platform = 'AMAZON',
  category = 1,
  role,
  initialTitle = '',
  onSaved,
  onReadinessChange,
}) => {
  const normalizedPlatform = String(platform || 'AMAZON').toUpperCase();
  const normalizedCategory = Number(category);
  const isClothing = normalizedPlatform === 'AMAZON' && normalizedCategory === 1;
  const isAmazonCaseOne = normalizedPlatform === 'AMAZON' && normalizedCategory === 1;
  const isCaseWithPendingLimit = normalizedPlatform === 'AMAZON' && [2, 3].includes(normalizedCategory);

  const canEditText = canEditZone(role, 'SELLER');
  const canEditImages = canEditZone(role, 'PRODUCT_DESIGN');
  const canEditVideo = canEditZone(role, 'MARVEL');
  const canSave = canEditText || canEditImages || canEditVideo;

  const [title, setTitle] = useState(initialTitle);
  const [price, setPrice] = useState('');
  const [brand, setBrand] = useState('');
  const [fabricType, setFabricType] = useState('');
  const [careInstructions, setCareInstructions] = useState('');
  const [origin, setOrigin] = useState('');
  const [bulletPoints, setBulletPoints] = useState(['', '', '', '', '']);

  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [colors, setColors] = useState([]);
  const [newColorName, setNewColorName] = useState('');
  const [sizes, setSizes] = useState([]);
  const [customSize, setCustomSize] = useState('');
  const [aPlusImages, setAPlusImages] = useState([]);

  const imageLimit = normalizedPlatform === 'ETSY'
    ? ETSY_IMAGE_LIMIT
    : (isAmazonCaseOne ? (videos.length > 0 ? CASE_ONE_IMAGE_LIMIT - 1 : CASE_ONE_IMAGE_LIMIT) : null);

  // TechBrief chốt rõ 1 video cho Case 1 ("7 ảnh, hoặc 6 ảnh + 1 Video") và cho Etsy
  // ("tối đa 20 ảnh + 1 Video"). Case 2/3 brief ghi 2 video nhưng con số này còn mâu
  // thuẫn (Open Issue #1) → để null = không chặn, chờ team chốt.
  const videoLimit = (normalizedPlatform === 'ETSY' || isAmazonCaseOne) ? SINGLE_VIDEO_LIMIT : null;

  const [submitting, setSubmitting] = useState(false);
  const [savedPreviewId, setSavedPreviewId] = useState(null);
  const [savedSignature, setSavedSignature] = useState(null);
  const [error, setError] = useState('');
  const [titleError, setTitleError] = useState('');
  const [mediaNotice, setMediaNotice] = useState('');
  const [videoNotice, setVideoNotice] = useState('');

  const titleInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const colorInputRef = useRef(null);
  const aPlusInputRef = useRef(null);
  const objectUrlsRef = useRef(new Set());

  const createPreviewUrl = (file) => {
    const url = URL.createObjectURL(file);
    objectUrlsRef.current.add(url);
    return url;
  };

  const revokePreviewUrl = (url) => {
    if (!url) return;
    URL.revokeObjectURL(url);
    objectUrlsRef.current.delete(url);
  };

  useEffect(() => () => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current.clear();
  }, []);

  const currentSignature = useMemo(() => JSON.stringify({
    title,
    price,
    brand,
    fabricType,
    careInstructions,
    origin,
    bulletPoints,
    images: images.map((item) => item.id),
    videos: videos.map((item) => item.id),
    colors: colors.map((item) => `${item.id}:${item.name}`),
    sizes,
    aPlusImages: aPlusImages.map((item) => item.id),
  }), [
    title,
    price,
    brand,
    fabricType,
    careInstructions,
    origin,
    bulletPoints,
    images,
    videos,
    colors,
    sizes,
    aPlusImages,
  ]);

  const hasUnsavedChanges = Boolean(savedSignature && savedSignature !== currentSignature);

  const readiness = useMemo(() => ({
    hasTitle: Boolean(title.trim()),
    imageCount: images.length,
    imageLimit,
    imageLimitPending: isCaseWithPendingLimit,
    hasVideo: videos.length > 0,
    videoCount: videos.length,
    videoLimit,
    colorCount: colors.length,
    sizeCount: sizes.length,
    aPlusCount: aPlusImages.length,
    savedPreviewId,
    hasUnsavedChanges,
  }), [
    title,
    images.length,
    imageLimit,
    isCaseWithPendingLimit,
    videos.length,
    videoLimit,
    colors.length,
    sizes.length,
    aPlusImages.length,
    savedPreviewId,
    hasUnsavedChanges,
  ]);

  useEffect(() => {
    onReadinessChange?.(readiness);
  }, [onReadinessChange, readiness]);

  const scrollToZone = (zoneId) => {
    document.getElementById(zoneId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleImageUpload = (event) => {
    if (!canEditImages) return;

    const selectedFiles = Array.from(event.target.files || []);
    const remaining = imageLimit === null ? selectedFiles.length : Math.max(imageLimit - images.length, 0);
    const acceptedFiles = imageLimit === null ? selectedFiles : selectedFiles.slice(0, remaining);

    if (imageLimit !== null && selectedFiles.length > acceptedFiles.length) {
      setMediaNotice(isAmazonCaseOne && videos.length > 0
        ? `Case 1 đã có video nên chỉ thêm ${acceptedFiles.length} ảnh, tối đa 6 ảnh + 1 video.`
        : `Chỉ thêm ${acceptedFiles.length} ảnh để không vượt quá giới hạn ${imageLimit} ảnh.`);
    } else {
      setMediaNotice('');
    }

    const nextItems = acceptedFiles.map((file) => ({
      id: createFileItemId(file),
      file,
      preview: createPreviewUrl(file),
    }));
    if (nextItems.length > 0) setImages((current) => [...current, ...nextItems]);
    event.target.value = '';
  };

  const removeImage = (id) => {
    if (isAmazonCaseOne && images.length === CASE_ONE_IMAGE_LIMIT) {
      setMediaNotice('');
      setVideoNotice('');
    }
    setImages((current) => {
      const item = current.find((entry) => entry.id === id);
      revokePreviewUrl(item?.preview);
      return current.filter((entry) => entry.id !== id);
    });
  };

  const handleVideoUpload = (event) => {
    if (!canEditVideo) return;
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    if (isAmazonCaseOne && images.length >= CASE_ONE_IMAGE_LIMIT) {
      const message = 'Case 1 cho phép 7 ảnh, hoặc 6 ảnh + 1 video. Hãy xóa bớt 1 ảnh trước khi chọn video.';
      setMediaNotice(message);
      setVideoNotice(message);
      event.target.value = '';
      return;
    }

    const remaining = videoLimit === null
      ? selectedFiles.length
      : Math.max(videoLimit - videos.length, 0);
    const acceptedFiles = selectedFiles.slice(0, remaining);

    if (acceptedFiles.length < selectedFiles.length) {
      setVideoNotice(videoLimit === SINGLE_VIDEO_LIMIT
        ? 'Danh mục này chỉ cho phép 1 video. Hãy xóa video hiện tại trước khi chọn video khác.'
        : `Chỉ thêm ${acceptedFiles.length} video để không vượt quá giới hạn ${videoLimit} video.`);
    } else {
      setMediaNotice('');
      setVideoNotice('');
    }

    const nextItems = acceptedFiles.map((file) => ({
      id: createFileItemId(file),
      file,
      preview: createPreviewUrl(file),
    }));
    if (nextItems.length > 0) setVideos((current) => [...current, ...nextItems]);
    event.target.value = '';
  };

  const removeVideo = (id) => {
    setVideos((current) => {
      const item = current.find((entry) => entry.id === id);
      revokePreviewUrl(item?.preview);
      return current.filter((entry) => entry.id !== id);
    });
    setVideoNotice('');
  };

  const handleColorImageUpload = (event) => {
    if (!canEditImages) return;
    const file = event.target.files?.[0];
    const colorName = newColorName.trim();
    if (!file || !colorName) return;

    setColors((current) => [...current, {
      id: createFileItemId(file),
      name: colorName,
      file,
      preview: createPreviewUrl(file),
    }]);
    setNewColorName('');
    event.target.value = '';
  };

  const removeColor = (id) => {
    setColors((current) => {
      const item = current.find((entry) => entry.id === id);
      revokePreviewUrl(item?.preview);
      return current.filter((entry) => entry.id !== id);
    });
  };

  const toggleSize = (size) => {
    if (!canEditText) return;
    setSizes((current) => (
      current.includes(size)
        ? current.filter((item) => item !== size)
        : [...current, size]
    ));
  };

  const commitCustomSize = () => {
    if (!canEditText) return;
    const value = customSize.trim().toUpperCase();
    if (value && !sizes.includes(value)) setSizes((current) => [...current, value]);
    setCustomSize('');
  };

  const handleCustomSizeKeyDown = (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    event.stopPropagation();
    commitCustomSize();
  };

  const handleAPlusUpload = (event) => {
    if (!canEditImages) return;
    const files = Array.from(event.target.files || []);
    const nextItems = files.map((file) => ({
      id: createFileItemId(file),
      file,
      preview: createPreviewUrl(file),
    }));
    if (nextItems.length > 0) setAPlusImages((current) => [...current, ...nextItems]);
    event.target.value = '';
  };

  const removeAPlus = (id) => {
    setAPlusImages((current) => {
      const item = current.find((entry) => entry.id === id);
      revokePreviewUrl(item?.preview);
      return current.filter((entry) => entry.id !== id);
    });
  };

  const handleTitleChange = (event) => {
    setTitle(event.target.value);
    if (event.target.value.trim()) setTitleError('');
  };

  const handleBulletPointChange = (index, value) => {
    setBulletPoints((current) => current.map((item, itemIndex) => (
      itemIndex === index ? value : item
    )));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSave || submitting) return;

    if (!title.trim()) {
      const message = 'Vui lòng nhập tiêu đề sản phẩm trước khi lưu Preview.';
      setTitleError(message);
      setError(message);
      titleInputRef.current?.focus();
      return;
    }

    setSubmitting(true);
    setError('');
    setTitleError('');

    try {
      const formData = new FormData();
      formData.append('taskId', taskId);
      formData.append('platform', normalizedPlatform);
      formData.append('title', title.trim());
      if (price !== '') formData.append('price', price);
      if (brand.trim()) formData.append('brand', brand.trim());
      if (fabricType.trim()) formData.append('fabricType', fabricType.trim());
      if (careInstructions.trim()) formData.append('careInstructions', careInstructions.trim());
      if (origin.trim()) formData.append('origin', origin.trim());

      bulletPoints
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((item) => formData.append('bulletPoints', item));
      sizes.forEach((size) => formData.append('sizes', size));

      if (images.length > 0) {
        formData.append('mainImage', images[0].file);
        images.slice(1).forEach((item) => formData.append('galleryImages', item.file));
      }
      // Key "videos" (nhiều file) — backend vẫn nhận key "video" cũ để tương thích ngược.
      videos.forEach((item) => formData.append('videos', item.file));

      colors.forEach((item) => formData.append('colorNames', item.name));
      colors.forEach((item) => formData.append('colorImages', item.file));
      aPlusImages.forEach((item) => formData.append('aPlusImages', item.file));

      const response = await axiosInstance.post('/api/previews/upload', formData);
      const previewId = response.data?.id;
      if (!previewId) throw new Error('MISSING_PREVIEW_ID');

      setSavedPreviewId(previewId);
      setSavedSignature(currentSignature);
      onSaved?.(previewId);
    } catch (requestError) {
      if (!requestError.response) {
        setError('Không thể kết nối máy chủ. Kiểm tra mạng rồi thử lưu lại.');
      } else if (requestError.response.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else if (requestError.response.status === 403) {
        setError('Bạn không có quyền lưu phần nội dung này. Vui lòng kiểm tra vai trò được phân công.');
      } else {
        setError('Upload thất bại. Vui lòng kiểm tra dữ liệu và thử lại.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const imageLimitDescription = imageLimit === null
    ? 'Chưa áp giới hạn cứng vì hạn mức media Case 2/3 đang chờ team chốt.'
    : (isAmazonCaseOne
      ? 'Case 1 cho phép 7 ảnh, hoặc 6 ảnh + 1 video. Ảnh đầu tiên được gửi bằng key mainImage.'
      : `Tối đa ${imageLimit} ảnh. Ảnh đầu tiên được gửi bằng key mainImage.`);
  const videoDescription = videoLimit === null
    ? 'Thêm được nhiều video. Chưa áp giới hạn cứng vì hạn mức media Case 2/3 đang chờ team chốt.'
    : `Danh mục này cho phép tối đa ${videoLimit} video.`;

  return (
    <form
      className="hc-upload-form"
      data-project-id={projectId}
      data-task-id={taskId}
      onSubmit={handleSubmit}
      noValidate
    >
      <nav className="hc-mobile-wizard" aria-label="Đi tới vùng chỉnh sửa">
        <button type="button" onClick={() => scrollToZone('workspace-images')}>Ảnh &amp; A+</button>
        <button type="button" onClick={() => scrollToZone('workspace-video')}>Video</button>
        <button type="button" onClick={() => scrollToZone('workspace-text')}>Nội dung</button>
      </nav>

      <section
        id="workspace-images"
        className={`hc-zone hc-zone--design ${canEditImages ? '' : 'hc-zone--locked'}`}
        aria-labelledby="workspace-images-title"
      >
        <ZoneHeader
          id="workspace-images-title"
          icon={Images}
          label="PRODUCT DESIGN"
          title="Hình ảnh, màu sắc & A+ Content"
          description={imageLimitDescription}
          editable={canEditImages}
        />

        <div className="hc-zone__content space-y-7">
          <div>
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--hc-navy-900)]">Hình ảnh sản phẩm</h3>
                <p className="mt-1 text-xs text-[var(--hc-gray-500)]">
                  Ảnh đầu tiên là ảnh chính. Chưa áp validation dung lượng/định dạng vì NFR upload đang chờ chốt.
                </p>
              </div>
              <span className="text-xs font-bold tabular-nums text-[var(--hc-gray-600)]">
                {images.length}{imageLimit === null ? ' ảnh' : `/${imageLimit} ảnh`}
              </span>
            </div>

            {mediaNotice && (
              <div className="hc-alert hc-alert--info mb-3" role="status">
                <AlertCircle size={18} aria-hidden="true" />
                <span>{mediaNotice}</span>
              </div>
            )}

            <div className="hc-upload-grid">
              {images.map((item, index) => (
                <div className="hc-upload-tile" key={item.id}>
                  <img src={item.preview} alt={`Ảnh ${index + 1}: ${item.file.name}`} />
                  {canEditImages && (
                    <UploadTileRemoveButton
                      label={`Xóa ảnh ${index + 1}`}
                      onClick={() => removeImage(item.id)}
                    />
                  )}
                  <span className="hc-upload-tile__badge">
                    {index === 0 ? 'ẢNH CHÍNH' : `ẢNH ${index + 1}`}
                  </span>
                </div>
              ))}

              {canEditImages && (imageLimit === null || images.length < imageLimit) && (
                <label className="hc-upload-tile hc-upload-tile--add focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-blue-500">
                  <Upload size={22} aria-hidden="true" />
                  <span>Thêm ảnh</span>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    className="sr-only"
                    onChange={handleImageUpload}
                    aria-label="Chọn hình ảnh sản phẩm"
                  />
                </label>
              )}
            </div>

            {images.length === 0 && !canEditImages && (
              <p className="mt-3 text-xs text-[var(--hc-gray-500)]">
                Chưa có ảnh được chọn trong form của phiên làm việc này.
              </p>
            )}
          </div>

          {isClothing && (
            <div className="border-t border-[var(--hc-gray-200)] pt-6">
              <div className="mb-3 flex items-start gap-3">
                <Palette size={19} className="mt-0.5 text-[var(--hc-role-design)]" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-bold text-[var(--hc-navy-900)]">Biến thể màu</h3>
                  <p className="mt-1 text-xs text-[var(--hc-gray-500)]">
                    Tên màu đi cùng ảnh swatch nên được quản lý trong vùng Product Design.
                  </p>
                </div>
              </div>

              {colors.length > 0 && (
                <div className="hc-upload-grid mb-4">
                  {colors.map((item) => (
                    <div className="hc-upload-tile" key={item.id}>
                      <img src={item.preview} alt={`Màu ${item.name}`} />
                      {canEditImages && (
                        <UploadTileRemoveButton
                          label={`Xóa màu ${item.name}`}
                          onClick={() => removeColor(item.id)}
                        />
                      )}
                      <span className="hc-upload-tile__badge max-w-[calc(100%-0.75rem)] truncate">
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="hc-form-grid">
                <label className="hc-field">
                  <span>Tên màu</span>
                  <input
                    className="hc-input"
                    type="text"
                    value={newColorName}
                    onChange={(event) => setNewColorName(event.target.value)}
                    placeholder="Ví dụ: Navy Blue"
                    readOnly={!canEditImages}
                  />
                  <small>Nhập tên trước khi chọn ảnh màu tương ứng.</small>
                </label>

                <div className="hc-field">
                  <span>Ảnh màu</span>
                  {canEditImages ? (
                    <label className={`hc-button hc-button--secondary w-full focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-blue-500 ${newColorName.trim() ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                      <Plus size={17} aria-hidden="true" />
                      Chọn ảnh màu
                      <input
                        ref={colorInputRef}
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        disabled={!newColorName.trim()}
                        onChange={handleColorImageUpload}
                        aria-label="Chọn ảnh cho màu vừa nhập"
                      />
                    </label>
                  ) : (
                    <button className="hc-button hc-button--secondary w-full" type="button" disabled>
                      <Lock size={17} aria-hidden="true" />
                      Không có quyền chọn ảnh màu
                    </button>
                  )}
                  <small>Chưa áp giới hạn dung lượng/định dạng file.</small>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-[var(--hc-gray-200)] pt-6">
            <div className="mb-3 flex items-start gap-3">
              <ImageIcon size={19} className="mt-0.5 text-[var(--hc-role-design)]" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-bold text-[var(--hc-navy-900)]">A+ Content</h3>
                <p className="mt-1 text-xs text-[var(--hc-gray-500)]">
                  Ảnh nội dung phong phú, khuyến nghị tỷ lệ 970×600. Hạn mức A+ chưa được đặc tả nên chưa áp giới hạn cứng.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {aPlusImages.map((item, index) => (
                <div className="hc-upload-tile" style={{ aspectRatio: '970 / 600' }} key={item.id}>
                  <img src={item.preview} alt={`A+ module ${index + 1}: ${item.file.name}`} />
                  {canEditImages && (
                    <UploadTileRemoveButton
                      label={`Xóa A+ module ${index + 1}`}
                      onClick={() => removeAPlus(item.id)}
                    />
                  )}
                  <span className="hc-upload-tile__badge">A+ {index + 1}</span>
                </div>
              ))}

              {canEditImages && (
                <label
                  className="hc-upload-tile hc-upload-tile--add focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-blue-500"
                  style={{ aspectRatio: '970 / 600' }}
                >
                  <Upload size={22} aria-hidden="true" />
                  <span>Thêm A+ module</span>
                  <input
                    ref={aPlusInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={handleAPlusUpload}
                    aria-label="Chọn ảnh A+ Content"
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        <ZoneFooter
          editable={canEditImages}
          editableText="Bạn có thể chỉnh sửa ảnh, ảnh màu và A+ Content."
          lockedText="Chỉ ADMIN hoặc PRODUCT_DESIGN được chỉnh sửa vùng hình ảnh."
        />
      </section>

      <section
        id="workspace-video"
        className={`hc-zone hc-zone--marvel ${canEditVideo ? '' : 'hc-zone--locked'}`}
        aria-labelledby="workspace-video-title"
      >
        <ZoneHeader
          id="workspace-video-title"
          icon={Video}
          label="MARVEL LABS"
          title="Video sản phẩm"
          description={videoDescription}
          editable={canEditVideo}
        />

        <div className="hc-zone__content">
          {videoNotice && (
            <div className="hc-alert hc-alert--info mb-4" role="alert">
              <AlertCircle size={18} aria-hidden="true" />
              <span>{videoNotice}</span>
            </div>
          )}
          {videos.length > 0 && (
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--hc-navy-900)]">Video đã chọn</h3>
              <span className="text-xs font-bold tabular-nums text-[var(--hc-gray-600)]">
                {videos.length}{videoLimit === null ? ' video' : `/${videoLimit} video`}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {videos.map((item, index) => (
              <div className="hc-upload-tile" style={{ aspectRatio: '16 / 9' }} key={item.id}>
                <video
                  src={item.preview}
                  controls
                  preload="metadata"
                  aria-label={`Video ${index + 1}: ${item.file.name}`}
                />
                {canEditVideo && (
                  <UploadTileRemoveButton
                    label={`Xóa video ${index + 1}`}
                    onClick={() => removeVideo(item.id)}
                  />
                )}
                <span className="hc-upload-tile__badge">
                  VIDEO {index + 1} · {(item.file.size / (1024 * 1024)).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} MB
                </span>
              </div>
            ))}

            {canEditVideo && (videoLimit === null || videos.length < videoLimit) && (
              <label
                className="hc-upload-tile hc-upload-tile--add focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-blue-500"
                style={{ aspectRatio: '16 / 9' }}
              >
                <Upload size={23} aria-hidden="true" />
                <span>{videos.length > 0 ? 'Thêm video' : 'Chọn video sản phẩm'}</span>
                <small className="px-4 text-center text-[10px]">Chưa áp validation dung lượng/định dạng vì NFR upload đang chờ chốt.</small>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  multiple={videoLimit === null || videoLimit > 1}
                  className="sr-only"
                  onChange={handleVideoUpload}
                  aria-label="Chọn video sản phẩm"
                />
              </label>
            )}
          </div>

          {!canEditVideo && videos.length === 0 && (
            <p className="text-xs text-[var(--hc-gray-500)]">
              Chưa có video được chọn trong form của phiên làm việc này.
            </p>
          )}
        </div>

        <ZoneFooter
          editable={canEditVideo}
          editableText="Bạn có thể thêm, thay thế hoặc xóa video sản phẩm."
          lockedText="Chỉ ADMIN hoặc MARVEL được chỉnh sửa vùng video."
        />
      </section>

      <section
        id="workspace-text"
        className={`hc-zone hc-zone--seller ${canEditText ? '' : 'hc-zone--locked'}`}
        aria-labelledby="workspace-text-title"
      >
        <ZoneHeader
          id="workspace-text-title"
          icon={Type}
          label="SELLER"
          title="Nội dung sản phẩm"
          description="Tiêu đề, giá, thông tin mô tả, bullet points và kích cỡ."
          editable={canEditText}
        />

        <div className="hc-zone__content space-y-7">
          <div className="hc-form-grid">
            <label className="hc-field hc-form-grid__full">
              <span className="flex items-center justify-between gap-3">
                <span>Tiêu đề sản phẩm <span className="text-[var(--hc-red-700)]">*</span></span>
                <small className="tabular-nums">{title.length}/200</small>
              </span>
              <textarea
                ref={titleInputRef}
                className="hc-textarea"
                value={title}
                onChange={handleTitleChange}
                maxLength={200}
                rows={2}
                placeholder="Ví dụ: Men's Classic Fit Crewneck T-Shirt, 100% Cotton..."
                readOnly={!canEditText}
                aria-invalid={Boolean(titleError)}
                aria-describedby={titleError ? 'product-title-error' : undefined}
                required
              />
              {titleError ? (
                <small id="product-title-error" className="!text-[var(--hc-red-700)]" role="alert">
                  {titleError}
                </small>
              ) : (
                <small>Trường bắt buộc và luôn được gửi bằng key title.</small>
              )}
            </label>

            <label className="hc-field">
              <span>Giá hiển thị ($)</span>
              <input
                className="hc-input"
                type="number"
                inputMode="decimal"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                step="0.01"
                min="0"
                placeholder="19.99"
                readOnly={!canEditText}
              />
            </label>

            <label className="hc-field">
              <span>Thương hiệu</span>
              <input
                className="hc-input"
                type="text"
                value={brand}
                onChange={(event) => setBrand(event.target.value)}
                placeholder="Ví dụ: Happy Creative"
                readOnly={!canEditText}
              />
            </label>

            {isClothing && (
              <>
                <label className="hc-field">
                  <span>Chất liệu</span>
                  <input
                    className="hc-input"
                    type="text"
                    value={fabricType}
                    onChange={(event) => setFabricType(event.target.value)}
                    placeholder="Ví dụ: 100% Cotton"
                    readOnly={!canEditText}
                  />
                </label>

                <label className="hc-field">
                  <span>Hướng dẫn bảo quản</span>
                  <input
                    className="hc-input"
                    type="text"
                    value={careInstructions}
                    onChange={(event) => setCareInstructions(event.target.value)}
                    placeholder="Ví dụ: Giặt máy bằng nước lạnh"
                    readOnly={!canEditText}
                  />
                </label>
              </>
            )}

            <label className="hc-field hc-form-grid__full">
              <span>Xuất xứ</span>
              <input
                className="hc-input"
                type="text"
                value={origin}
                onChange={(event) => setOrigin(event.target.value)}
                placeholder="Ví dụ: Việt Nam"
                readOnly={!canEditText}
              />
            </label>
          </div>

          <div className="border-t border-[var(--hc-gray-200)] pt-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-[var(--hc-navy-900)]">Bullet points</h3>
              <span className="text-xs text-[var(--hc-gray-500)]">Tối đa 5 mục</span>
            </div>
            <div className="space-y-3">
              {bulletPoints.map((bulletPoint, index) => (
                <label className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-2" key={`bullet-${index + 1}`}>
                  <span className="grid min-h-11 place-items-center rounded-[0.625rem] bg-[var(--hc-green-50)] text-xs font-bold text-[var(--hc-green-700)]">
                    {index + 1}
                  </span>
                  <span className="sr-only">Bullet point {index + 1}</span>
                  <textarea
                    className="hc-textarea !min-h-20"
                    rows={2}
                    value={bulletPoint}
                    onChange={(event) => handleBulletPointChange(index, event.target.value)}
                    placeholder={`Nội dung bullet point ${index + 1}`}
                    readOnly={!canEditText}
                  />
                </label>
              ))}
            </div>
          </div>

          {isClothing && (
            <div className="border-t border-[var(--hc-gray-200)] pt-6">
              <div className="mb-3">
                <h3 className="text-sm font-bold text-[var(--hc-navy-900)]">Kích cỡ</h3>
                <p className="mt-1 text-xs text-[var(--hc-gray-500)]">
                  Kích cỡ là dữ liệu text nên thuộc Seller; Product Design chỉ quản lý ảnh màu.
                </p>
              </div>

              <div className="hc-chip-list" role="group" aria-label="Chọn kích cỡ có sẵn">
                {SIZES_PRESETS.map((size) => (
                  <button
                    className="hc-chip"
                    type="button"
                    key={size}
                    onClick={() => toggleSize(size)}
                    aria-pressed={sizes.includes(size)}
                    disabled={!canEditText}
                  >
                    {size}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <label className="hc-field">
                  <span>Kích cỡ tùy chỉnh</span>
                  <input
                    className="hc-input"
                    type="text"
                    value={customSize}
                    onChange={(event) => setCustomSize(event.target.value)}
                    onKeyDown={handleCustomSizeKeyDown}
                    placeholder="Ví dụ: 3XL hoặc One Size"
                    readOnly={!canEditText}
                  />
                  <small>Nhấn Enter hoặc dùng nút Thêm; Enter sẽ không gửi form.</small>
                </label>
                <button
                  className="hc-button hc-button--secondary self-start sm:mt-[1.7rem]"
                  type="button"
                  onClick={commitCustomSize}
                  disabled={!canEditText || !customSize.trim()}
                >
                  <Plus size={17} aria-hidden="true" />
                  Thêm
                </button>
              </div>

              {sizes.some((size) => !SIZES_PRESETS.includes(size)) && (
                <div className="hc-chip-list mt-3" aria-label="Kích cỡ tùy chỉnh đã chọn">
                  {sizes.filter((size) => !SIZES_PRESETS.includes(size)).map((size) => (
                    <button
                      className="hc-chip"
                      type="button"
                      key={size}
                      onClick={() => toggleSize(size)}
                      disabled={!canEditText}
                      aria-label={`Xóa kích cỡ ${size}`}
                      title={`Xóa kích cỡ ${size}`}
                    >
                      {size}
                      {canEditText && <Trash2 size={14} aria-hidden="true" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <ZoneFooter
          editable={canEditText}
          editableText="Bạn có thể chỉnh sửa text và kích cỡ của listing."
          lockedText="Chỉ ADMIN hoặc SELLER được chỉnh sửa vùng nội dung."
        />
      </section>

      <div className="space-y-3" aria-live="polite">
        {error && (
          <div className="hc-alert hc-alert--error" role="alert">
            <AlertCircle size={19} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {savedPreviewId && (
          <div className={`hc-alert ${hasUnsavedChanges ? 'hc-alert--info' : 'hc-alert--success'}`} role="status">
            {hasUnsavedChanges
              ? <AlertCircle size={19} aria-hidden="true" />
              : <CheckCircle2 size={19} aria-hidden="true" />}
            <span className="min-w-0">
              {hasUnsavedChanges ? 'Bạn có thay đổi mới chưa được lưu. ' : 'Đã lưu bản Preview thành công. '}
              ID: <code className="break-all font-mono text-xs">{savedPreviewId}</code>
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-[var(--hc-gray-500)]">
          Lưu sẽ tạo một Preview mới từ dữ liệu hiện có trong form và giữ nguyên task hiện tại.
        </p>
        <button
          type="submit"
          disabled={submitting || !canSave}
          className="hc-button hc-button--primary w-full shrink-0 sm:w-auto"
        >
          {submitting ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Save size={18} aria-hidden="true" />}
          {submitting ? 'Đang upload...' : 'Lưu bản Preview'}
        </button>
      </div>
    </form>
  );
};

export default AmazonUploadForm;
