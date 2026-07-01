import React from 'react';
import ClothingGallery from './cases/ClothingGallery';
import HomeKitchenVerticalGallery from './cases/HomeKitchenVerticalGallery';
import HomeKitchenHorizontalGallery from './cases/HomeKitchenHorizontalGallery';

// caseType:
//   1 = Clothing — vertical thumbnails, no zoom
//   2 = Home & Kitchen Vertical — vertical thumbnails + hover zoom
//   3 = Home & Kitchen Horizontal — horizontal thumbnails + hover zoom
const ProductGallery = ({ images = [], videos = [], caseType = 1 }) => {
  const type = Number(caseType) || 1;

  if (type === 2) return <HomeKitchenVerticalGallery images={images} videos={videos} />;
  if (type === 3) return <HomeKitchenHorizontalGallery images={images} videos={videos} />;
  return <ClothingGallery images={images} videos={videos} />;
};

export default ProductGallery;
