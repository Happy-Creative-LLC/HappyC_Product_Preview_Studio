import React from 'react';
import { useProductStore } from '../stores/productStore';
import EtsyHeader from '../components/etsy/EtsyHeader';
import EtsyGallery from '../components/etsy/EtsyGallery';
import EtsyInfo from '../components/etsy/EtsyInfo';

const EtsyPreviewPage = () => {
  // Get data from global store
  const store = useProductStore();
  
  const productData = {
    images: store.images,
    videos: store.videos,
    title: store.title,
    shopName: store.brand || 'HappyCreative',
    sales: '23,491',
    rating: '5',
    price: store.price ? Number(store.price) : 0
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <EtsyHeader />
      
      <main className="max-w-[1400px] mx-auto pt-6 px-4 md:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left: Gallery */}
          <div className="lg:col-span-7">
            <EtsyGallery images={productData.images} videos={productData.videos} />
            
            {/* Reviews Section Mock */}
            <div className="mt-12 border-t border-gray-200 pt-8">
              <h2 className="text-2xl font-bold mb-6">4,128 Reviews</h2>
              <div className="flex items-center space-x-2 mb-8">
                <span className="text-xl">★★★★★</span>
                <span className="text-sm text-gray-700">Buyers are raving! This shop got multiple 5-star reviews in the past 7 days.</span>
              </div>
            </div>
          </div>

          {/* Right: Info & Buy */}
          <div className="lg:col-span-5">
            <EtsyInfo {...productData} />
          </div>

        </div>
      </main>
    </div>
  );
};

export default EtsyPreviewPage;
