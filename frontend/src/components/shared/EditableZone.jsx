import React, { useState } from 'react';
import { MessageCircle, Lock } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

const ZONE_CONFIG = {
  IMAGE: {
    color: '#ef4444',
    label: 'Vùng Ảnh',
    labelClass: 'bg-red-100 text-red-700',
    editRoles: ['PRODUCT_DESIGN', 'ADMIN'],
  },
  VIDEO: {
    color: '#a855f7',
    label: 'Vùng Video',
    labelClass: 'bg-purple-100 text-purple-700',
    editRoles: ['MARVEL', 'ADMIN'],
  },
  TEXT: {
    color: '#22c55e',
    label: 'Vùng Text',
    labelClass: 'bg-green-100 text-green-700',
    editRoles: ['SELLER', 'ADMIN', 'MARVEL'],
  },
  APLUS: {
    color: '#f97316',
    label: 'Vùng A+',
    labelClass: 'bg-orange-100 text-orange-700',
    editRoles: ['PRODUCT_DESIGN', 'ADMIN'],
  },
  GENERAL: {
    color: '#9ca3af',
    label: 'Chung',
    labelClass: 'bg-gray-100 text-gray-500',
    editRoles: ['ADMIN'],
  },
};

// EditableZone — wrapper hiển thị viền màu theo vùng quyền hạn
// Props:
//   zone: 'IMAGE' | 'VIDEO' | 'TEXT' | 'APLUS' | 'GENERAL'
//   onCommentClick(zone): callback khi click comment button
//   className: thêm class vào wrapper
const EditableZone = ({ zone = 'GENERAL', onCommentClick, className = '', children }) => {
  const { user } = useAppStore();
  const [hovered, setHovered] = useState(false);

  const config = ZONE_CONFIG[zone] || ZONE_CONFIG.GENERAL;
  const canEdit = config.editRoles.includes(user?.role);

  const boxShadow = hovered
    ? `0 0 0 2px ${config.color}`
    : 'none';

  return (
    <div
      className={`relative rounded-lg transition-shadow duration-150 ${className}`}
      style={{ boxShadow }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}

      {/* Hover overlay: label + comment button */}
      {hovered && (
        <div className="absolute top-2 right-2 flex items-center gap-1.5 z-30 pointer-events-none">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${config.labelClass}`}>
            {config.label}
          </span>
          {!canEdit && (
            <span className="flex items-center gap-1 text-[11px] bg-gray-800/75 text-white px-2 py-0.5 rounded-full">
              <Lock size={10} />
              Không có quyền sửa
            </span>
          )}
        </div>
      )}

      {/* Comment button — always shown on hover if callback provided */}
      {hovered && onCommentClick && (
        <button
          className="absolute bottom-2 right-2 z-30 flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-2.5 py-1.5 rounded-full shadow-md transition-colors"
          onClick={() => onCommentClick(zone)}
          title="Comment vào vùng này"
        >
          <MessageCircle size={13} />
          Comment
        </button>
      )}
    </div>
  );
};

export default EditableZone;
