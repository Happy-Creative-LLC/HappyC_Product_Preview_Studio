import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import { useProductStore } from '../stores/productStore';
import { useAppStore } from '../stores/appStore';
import EtsyHeader from '../components/etsy/EtsyHeader';
import EtsyGallery from '../components/etsy/EtsyGallery';
import EtsyInfo from '../components/etsy/EtsyInfo';
import { Loader2 } from 'lucide-react';

const EtsyPreviewPage = () => {
  const [searchParams] = useSearchParams();
  const previewId  = searchParams.get('previewId');
  const taskId     = searchParams.get('taskId');
  const projectId  = searchParams.get('projectId');

  const { tasks } = useAppStore();
  const storeData  = useProductStore();

  const task = (projectId && taskId && tasks[projectId])
    ? tasks[projectId].find(t => t.id === taskId)
    : null;
  const taskProductData = task?.productData;

  const [previewData, setPreviewData] = useState(null);
  const [isLoading, setIsLoading]     = useState(!!previewId);

  useEffect(() => {
    if (!previewId) return;
    axiosInstance.get(`/api/previews/${previewId}`)
      .then(res => {
        if (res.data?.productData) {
          try { setPreviewData(JSON.parse(res.data.productData)); } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [previewId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-orange-500" />
      </div>
    );
  }

  const pd = taskProductData || previewData || storeData;

  const shopName     = pd.brand || 'HappyCreative';
  const images       = pd.images  || [];
  const videos       = pd.videos  || [];
  const colors       = pd.colors  || [];
  const sizes        = pd.sizes   || [];
  const bulletPoints = pd.bulletPoints || [];

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <EtsyHeader />

      <main className="max-w-[1400px] mx-auto pt-6 px-4 md:px-8 pb-20">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-500 mb-5 space-x-1">
          <a href="#" className="hover:underline">Home</a>
          <span>›</span>
          <a href="#" className="hover:underline">Clothing & Shoes</a>
          <span>›</span>
          <span className="text-gray-700 font-medium">{shopName}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Left — Gallery + Reviews */}
          <div className="lg:col-span-7">
            <EtsyGallery images={images} videos={videos} />

            {/* Reviews section */}
            <div className="mt-12 border-t border-gray-200 pt-8">
              <h2 className="text-xl font-bold mb-4">4,128 Reviews</h2>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl font-bold">4.9</span>
                <span className="text-yellow-400 text-lg">★★★★★</span>
              </div>
              <p className="text-sm text-green-700 font-medium bg-green-50 border border-green-100 px-4 py-2.5 rounded-xl inline-block">
                Buyers are raving! This shop received multiple 5-star reviews in the past 7 days.
              </p>

              {/* Sample review */}
              <div className="mt-6 border-t border-gray-100 pt-6">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm flex-shrink-0">
                    A
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Amanda T.</p>
                    <span className="text-yellow-400 text-xs">★★★★★</span>
                    <p className="text-sm text-gray-600 mt-1">
                      Absolutely love this product! Great quality and fast shipping. Would definitely buy again.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right — Info & Buy */}
          <div className="lg:col-span-5">
            <EtsyInfo
              title={pd.title}
              shopName={shopName}
              sales="23,491"
              rating="4.9"
              reviewCount="4,128"
              price={Number(pd.price || 0)}
              colors={colors}
              sizes={sizes}
              bulletPoints={bulletPoints}
              description={pd.description || ''}
              fabricType={pd.fabricType || ''}
              careInstructions={pd.careInstructions || ''}
              origin={pd.origin || ''}
              tags={['handmade', 'gift', 'customized', 'personalized', 'trending']}
            />
          </div>

        </div>
      </main>
    </div>
  );
};

export default EtsyPreviewPage;
