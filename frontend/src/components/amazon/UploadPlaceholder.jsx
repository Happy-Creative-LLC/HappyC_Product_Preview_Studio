import React from 'react';
import { ImagePlus, Video, Type } from 'lucide-react';

// Gray dashed "upload slot" frame, colored by zone group. Always fills its
// parent (parent controls the exact size / aspect-ratio) so swapping in real
// media never shifts layout.
const ZONE_STYLE = {
  IMAGE: { color: '#ef4444', bg: 'rgba(239,68,68,0.06)', label: 'Upload ảnh',   Icon: ImagePlus },
  VIDEO: { color: '#a855f7', bg: 'rgba(168,85,247,0.06)', label: 'Upload video', Icon: Video },
  TEXT:  { color: '#22c55e', bg: 'rgba(34,197,94,0.06)',  label: 'Upload text',  Icon: Type },
};

const UploadPlaceholder = ({ zone = 'IMAGE', label, compact = false, radius = 8, className = '' }) => {
  const z = ZONE_STYLE[zone] || ZONE_STYLE.IMAGE;
  const Icon = z.Icon;
  return (
    <div
      data-zone={zone}
      className={`w-full h-full flex flex-col items-center justify-center text-center select-none ${className}`}
      style={{ background: z.bg, border: `1.5px dashed ${z.color}`, borderRadius: radius, color: z.color }}
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
