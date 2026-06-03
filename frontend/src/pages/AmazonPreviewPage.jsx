import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { useProductStore } from '../stores/productStore';
import { useAppStore } from '../stores/appStore';
import Header from '../components/amazon/Header';
import ProductGallery from '../components/amazon/ProductGallery';
import ProductInfo from '../components/amazon/ProductInfo';
import BuyBox from '../components/amazon/BuyBox';

const AmazonPreviewPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const previewId = searchParams.get('previewId');
  const taskId = searchParams.get('taskId');
  const projectId = searchParams.get('projectId');
  
  const { tasks } = useAppStore();
  
  // Get fallback data from global store
  const storeData = useProductStore();
  
  // Task specific data
  const task = (projectId && taskId && tasks[projectId]) 
    ? tasks[projectId].find(t => t.id === taskId)
    : null;
  const taskProductData = task?.productData;
  
  // Case selection: 1 = Clothing/Jewelry (Vertical), 2 = Home&Kitchen (Vertical), 3 = Home&Kitchen (Horizontal)
  const caseType = task?.category ? Number(task.category) : 1;
  
  // Local state for fetched preview data
  const [previewData, setPreviewData] = useState(null);
  const [isLoading, setIsLoading] = useState(!!previewId);

  useEffect(() => {
    if (previewId) {
      axios.get(`/api/previews/${previewId}`)
        .then(response => {
          if (response.data && response.data.productData) {
            setPreviewData(JSON.parse(response.data.productData));
          }
        })
        .catch(error => {
          console.error("Error fetching preview:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [previewId]);

  const productData = taskProductData || previewData || storeData;

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading Preview...</div>;
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans relative">
      <Header />
      
      {/* Breadcrumb */}
      <div className="max-w-[1500px] mx-auto px-4 py-2 text-xs text-gray-500 bg-white">
        Clothing, Shoes & Jewelry {'>'} Men {'>'} Clothing {'>'} Underwear {'>'} Undershirts
      </div>

      {/* Main Content Area */}
      <main className="max-w-[1500px] mx-auto px-4 py-4 pb-20 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 relative">
          {/* Left Column: Gallery */}
          <div className={`${caseType === 3 ? 'md:col-span-12 lg:col-span-12 mb-8' : 'md:col-span-5 lg:col-span-5'} z-10`}>
            <ProductGallery 
              images={productData.images} 
              videos={productData.videos} 
            />
          </div>

          {/* Center Column: Info */}
          <div className={`${caseType === 3 ? 'md:col-span-8 lg:col-span-8' : 'md:col-span-4 lg:col-span-4'}`}>
            <ProductInfo {...productData} />
          </div>

          {/* Right Column: Buy Box */}
          <div className={`${caseType === 3 ? 'md:col-span-4 lg:col-span-4' : 'md:col-span-3 lg:col-span-3'} flex justify-end md:justify-end`}>
            <BuyBox price={Number(productData.price) || 0} brand={productData.brand} />
          </div>
        </div>

        {/* Product Description Block */}
        <div className="mt-12 border-t border-gray-300 pt-6">
          <h2 className="text-xl font-bold mb-4 text-orange-600">Product Description</h2>
          <div className="text-gray-900 leading-relaxed max-w-4xl whitespace-pre-wrap">
            {productData.description || 'No description provided.'}
          </div>
        </div>

        {/* A+ Content Block */}
        {productData.aPlusImages && productData.aPlusImages.length > 0 && (
          <div className="mt-12 border-t border-gray-300 pt-6 max-w-5xl">
            <h2 className="text-xl font-bold text-orange-600 mb-6">From the brand</h2>
            <div className="flex flex-col space-y-4">
              {productData.aPlusImages.map((img, idx) => (
                <img key={idx} src={img} alt={`A+ Content ${idx}`} className="w-full h-auto rounded shadow-sm" />
              ))}
            </div>
          </div>
        )}
      </main>


    </div>
  );
};

export default AmazonPreviewPage;
