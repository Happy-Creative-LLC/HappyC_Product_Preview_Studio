import React from 'react';
import EditableZone from '../shared/EditableZone';
import UploadPlaceholder from './UploadPlaceholder';

// A+ static banners (Banner 2–5) stacked vertically below the carousel.
// Count is DATA-DRIVEN (productData.aPlusBanners); empty → 4 default upload
// slots. Each banner is its own IMAGE (red) EditableZone, measured 1293×530.
const AplusContent = ({ banners = [], onCommentClick }) => {
  const items = banners.length > 0 ? banners : [null, null, null, null]; // default 4 (Banner 2–5)

  return (
    <div className="flex flex-col items-center gap-3 mt-3">
      {items.map((src, i) => {
        const n = i + 2; // Banner 2–5
        return (
          <EditableZone
            key={i}
            zone="IMAGE"
            group="red"
            id={`aplus-banner-${n}`}
            onCommentClick={onCommentClick}
            className="w-full max-w-[1293px]"
          >
            <div className="w-full overflow-hidden bg-white" style={{ aspectRatio: '1293 / 530' }}>
              {src
                ? <img src={src} alt={`A+ banner ${n}`} loading="lazy" className="w-full h-full" style={{ objectFit: 'fill' }} />
                : <UploadPlaceholder zone="IMAGE" radius={0} label={`Upload banner A+ #${n}`} />}
            </div>
          </EditableZone>
        );
      })}
    </div>
  );
};

export default AplusContent;
