import React, { useState } from 'react';

const EtsyGallery = ({ images, videos }) => {
  const [activeMedia, setActiveMedia] = useState(images[0]);
  
  // Combine videos and images up to 21 total (20 images + 1 video as per requirements)
  const allMedia = [...(videos || []), ...images].slice(0, 21);

  return (
    <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
      {/* Thumbnails (Left side on desktop, hidden on mobile for carousel) */}
      <div className="hidden md:flex flex-col space-y-2 w-16 overflow-y-auto max-h-[600px] pr-1 custom-scrollbar">
        {allMedia.map((media, idx) => {
          const isVideo = media.endsWith('.mp4');
          const isActive = activeMedia === media;
          
          return (
            <div 
              key={idx} 
              className={`cursor-pointer rounded-lg overflow-hidden border-2 ${isActive ? 'border-gray-900' : 'border-transparent hover:border-gray-300'}`}
              onClick={() => setActiveMedia(media)}
            >
              {isVideo ? (
                <div className="w-12 h-12 bg-gray-200 flex items-center justify-center">
                  <span className="text-[10px] font-bold">VIDEO</span>
                </div>
              ) : (
                <img src={media} alt={`Thumb ${idx}`} className="w-12 h-12 object-cover" />
              )}
            </div>
          );
        })}
      </div>

      {/* Main Image */}
      <div className="flex-grow flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden relative">
        {activeMedia?.endsWith('.mp4') ? (
          <video src={activeMedia} controls autoPlay className="w-full h-auto max-h-[600px] object-contain rounded-xl" />
        ) : (
          <img src={activeMedia} alt="Main view" className="w-full h-auto max-h-[600px] object-contain rounded-xl" />
        )}
      </div>
      
      {/* Mobile thumbnails (below image) */}
      <div className="flex md:hidden space-x-2 overflow-x-auto pb-2">
        {allMedia.map((media, idx) => (
           <div 
           key={`mob-${idx}`} 
           className={`flex-shrink-0 cursor-pointer rounded-md overflow-hidden border-2 ${activeMedia === media ? 'border-gray-900' : 'border-transparent'}`}
           onClick={() => setActiveMedia(media)}
         >
           <img src={media} alt={`Thumb ${idx}`} className="w-12 h-12 object-cover" />
         </div>
        ))}
      </div>
    </div>
  );
};

export default EtsyGallery;
