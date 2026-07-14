import React from 'react';
import useIsMobile from '../../hooks/useIsMobile';
import MobileGallery from './mobile/MobileGallery';
import ClothingGallery from './cases/ClothingGallery';
import HomeKitchenVerticalGallery from './cases/HomeKitchenVerticalGallery';
import HomeKitchenHorizontalGallery from './cases/HomeKitchenHorizontalGallery';

// Breakpoint-aware gallery selector.
//   Mobile  → one shared swipe carousel (MobileGallery) for every case.
//   Desktop → case-specific layout:
//     1 = Clothing (vertical thumbnails, no zoom)
//     2 = Home & Kitchen Vertical (vertical thumbnails + hover zoom)
//     3 = Home & Kitchen Horizontal (horizontal thumbnails + hover zoom)
const ProductGallery = ({ images = [], videos = [], caseType = 1, onCommentClick }) => {
  const isMobile = useIsMobile();
  if (isMobile) return <MobileGallery images={images} videos={videos} />;

  const type = Number(caseType) || 1;
  if (type === 2) return <HomeKitchenVerticalGallery images={images} videos={videos} onCommentClick={onCommentClick} />;
  if (type === 3) return <HomeKitchenHorizontalGallery images={images} videos={videos} onCommentClick={onCommentClick} />;
  return <ClothingGallery images={images} videos={videos} onCommentClick={onCommentClick} />;
};

export default ProductGallery;
