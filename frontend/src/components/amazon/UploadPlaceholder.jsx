import { ImagePlus, Video, Type } from 'lucide-react';

// Neutral placeholder that fills its parent without implying role permissions.
const PLACEHOLDER_STYLE = {
  IMAGE: { label: 'Upload ảnh', Icon: ImagePlus },
  VIDEO: { label: 'Upload video', Icon: Video },
  TEXT: { label: 'Upload text', Icon: Type },
};

const UploadPlaceholder = ({ zone = 'IMAGE', label, compact = false, radius = 8, className = '' }) => {
  const z = PLACEHOLDER_STYLE[zone] || PLACEHOLDER_STYLE.IMAGE;
  const Icon = z.Icon;
  return (
    <div
      data-zone={zone}
      className={`w-full h-full flex flex-col items-center justify-center text-center select-none ${className}`}
      style={{ background: 'rgba(15,23,42,0.025)', border: '1px dashed #cbd2dc', borderRadius: radius, color: '#7b8493' }}
      title={label || z.label}
    >
      <Icon size={compact ? 15 : 22} strokeWidth={1.75} />
      {!compact && (
        <span className="mt-1 text-[11px] font-semibold leading-tight px-1.5">{label || z.label}</span>
      )}
    </div>
  );
};

export default UploadPlaceholder;
