import React, { useState } from 'react';

// isVertical = true for Case 2 (Home & Kitchen DỌC)
// isVertical = false for Case 3 (Home & Kitchen NGANG)
const ProductGallery = ({ images, videos, isVertical = true }) => {
  const [activeMedia, setActiveMedia] = useState(images[0]);

  return (
    <div className={`flex ${isVertical ? 'flex-row' : 'flex-col-reverse'} sticky top-5`}>
      {/* Thumbnails */}
      <div className={`flex ${isVertical ? 'flex-col space-y-2 mr-4 w-12' : 'flex-row space-x-2 mt-4'}`}>
        {images.map((img, idx) => (
          <div 
            key={idx} 
            className={`cursor-pointer border-2 rounded-md overflow-hidden ${activeMedia === img ? 'border-amazon-yellow shadow-md' : 'border-transparent hover:border-gray-300'}`}
            onMouseEnter={() => setActiveMedia(img)}
          >
            <img 
              src={img} 
              alt={`Thumbnail ${idx}`} 
              className="w-10 h-10 object-cover" 
              onError={(e) => { e.target.onerror = null; e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg'; }}
            />
          </div>
        ))}
        {videos && videos.map((vid, idx) => (
          <div 
            key={`vid-${idx}`} 
            className={`cursor-pointer border-2 rounded-md overflow-hidden bg-black flex items-center justify-center ${activeMedia === vid ? 'border-amazon-yellow shadow-md' : 'border-transparent hover:border-gray-300'}`}
            onMouseEnter={() => setActiveMedia(vid)}
          >
            <span className="text-white text-xs">Play</span>
          </div>
        ))}
      </div>

      {/* Main View */}
      <div className="flex-grow flex items-center justify-center relative cursor-crosshair">
        {activeMedia?.endsWith('.mp4') ? (
          <video src={activeMedia} controls className="max-h-[500px] w-auto max-w-full" autoPlay />
        ) : (
          <img 
            src={activeMedia} 
            alt="Main view" 
            className="max-h-[500px] w-auto max-w-full object-contain" 
            onError={(e) => { e.target.onerror = null; e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg'; }}
          />
        )}
      </div>
    </div>
  );
};

export default ProductGallery;
