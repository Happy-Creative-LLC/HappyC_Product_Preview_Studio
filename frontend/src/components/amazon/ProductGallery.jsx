import React, { useState } from 'react';

// isVertical = true for Case 2 (Home & Kitchen DỌC)
// isVertical = false for Case 3 (Home & Kitchen NGANG)
const ProductGallery = ({ images, videos, isVertical = true }) => {
  const [activeMedia, setActiveMedia] = useState(images[0]);

  return (
    <div className={`flex ${isVertical ? 'flex-row' : 'flex-col-reverse'} sticky top-5`}>
      {/* Thumbnails */}
      <div className="flex flex-col space-y-2 mr-4 w-12 mt-2">
        {images.map((img, idx) => (
          <div 
            key={idx} 
            className={`cursor-pointer border-[1px] rounded-lg overflow-hidden ${activeMedia === img ? 'border-[#007185] shadow-[0_0_0_1px_#007185]' : 'border-gray-400 hover:border-[#007185]'}`}
            onMouseEnter={() => setActiveMedia(img)}
          >
            <img 
              src={img} 
              alt={`Thumbnail ${idx}`} 
              className="w-10 h-10 object-cover p-[2px]" 
              onError={(e) => { e.target.onerror = null; e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg'; }}
            />
          </div>
        ))}
        {videos && videos.map((vid, idx) => (
          <div 
            key={`vid-${idx}`} 
            className={`cursor-pointer border-[1px] rounded-lg overflow-hidden bg-black flex items-center justify-center h-10 ${activeMedia === vid ? 'border-[#007185] shadow-[0_0_0_1px_#007185]' : 'border-gray-400 hover:border-[#007185]'}`}
            onMouseEnter={() => setActiveMedia(vid)}
          >
            <span className="text-white text-[10px] font-bold tracking-wider">VIDEO</span>
          </div>
        ))}
      </div>

      {/* Main View */}
      <div className="flex-grow flex items-center justify-center relative cursor-crosshair bg-white">
        {activeMedia?.endsWith('.mp4') ? (
          <video src={activeMedia} controls className="max-h-[700px] w-auto max-w-full" autoPlay />
        ) : (
          <img 
            src={activeMedia} 
            alt="Main view" 
            className="max-h-[700px] w-auto max-w-full object-contain" 
            onError={(e) => { e.target.onerror = null; e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg'; }}
          />
        )}
      </div>
    </div>
  );
};

export default ProductGallery;
