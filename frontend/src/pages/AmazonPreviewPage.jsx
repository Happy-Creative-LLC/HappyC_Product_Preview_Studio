import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import { useProductStore } from '../stores/productStore';
import { useAppStore } from '../stores/appStore';
import Header from '../components/amazon/Header';
import ProductGallery from '../components/amazon/ProductGallery';
import ProductInfo from '../components/amazon/ProductInfo';
import BuyBox from '../components/amazon/BuyBox';
import EditableZone from '../components/shared/EditableZone';
import CommentSection from '../components/shared/CommentSection';
import { MessageCircle, X } from 'lucide-react';

const AmazonPreviewPage = () => {
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
  const caseType = task?.category ? Number(task.category) : 1;

  const [previewData, setPreviewData] = useState(null);
  const [isLoading, setIsLoading]     = useState(!!previewId);

  // Comment panel state
  const [commentPanelOpen, setCommentPanelOpen]     = useState(false);
  const [commentDefaultZone, setCommentDefaultZone] = useState(null);

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

  const handleZoneComment = (zone) => {
    setCommentDefaultZone(zone);
    setCommentPanelOpen(true);
  };

  const productData = taskProductData || previewData || storeData;

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading Preview...</div>;
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans relative">
      <Header />

      {/* Breadcrumb */}
      <div className="max-w-[1500px] mx-auto px-4 py-2 text-xs text-gray-500 bg-white">
        {caseType === 1
          ? 'Clothing, Shoes & Jewelry > Men > Clothing > Underwear > Undershirts'
          : 'Home & Kitchen > Kitchen & Dining > Storage & Organization'}
      </div>

      {/* Main Content Area */}
      <main className="max-w-[1500px] mx-auto px-4 py-4 pb-20 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 relative overflow-visible">

          {/* Left Column: Gallery — IMAGE zone */}
          <div className="md:col-span-5 lg:col-span-5 overflow-visible">
            <EditableZone zone="IMAGE" onCommentClick={handleZoneComment}>
              <ProductGallery
                images={productData.images || []}
                videos={productData.videos || []}
                caseType={caseType}
              />
            </EditableZone>
          </div>

          {/* Center Column: Info — TEXT zone */}
          <div className="md:col-span-4 lg:col-span-4">
            <EditableZone zone="TEXT" onCommentClick={handleZoneComment}>
              <ProductInfo {...productData} caseType={caseType} />
            </EditableZone>
          </div>

          {/* Right Column: Buy Box — no zone (display only) */}
          <div className="md:col-span-3 lg:col-span-3 flex justify-end md:justify-end">
            <BuyBox price={Number(productData.price) || 0} brand={productData.brand} />
          </div>
        </div>

        {/* Product Description Block — TEXT zone */}
        <div className="mt-12 border-t border-gray-300 pt-6">
          <EditableZone zone="TEXT" onCommentClick={handleZoneComment} className="rounded-lg">
            <h2 className="text-xl font-bold mb-4 text-orange-600">Product Description</h2>
            <div className="text-gray-900 leading-relaxed max-w-4xl whitespace-pre-wrap">
              {productData.description || 'No description provided.'}
            </div>
          </EditableZone>
        </div>

        {/* A+ Content Block — APLUS zone */}
        {productData.aPlusImages && productData.aPlusImages.length > 0 && (
          <div className="mt-12 border-t border-gray-300 pt-6 max-w-5xl">
            <EditableZone zone="APLUS" onCommentClick={handleZoneComment}>
              <h2 className="text-xl font-bold text-orange-600 mb-6">From the brand</h2>
              <div className="flex flex-col space-y-4">
                {productData.aPlusImages.map((img, idx) => (
                  <img key={idx} src={img} alt={`A+ Content ${idx}`} className="w-full h-auto rounded shadow-sm" />
                ))}
              </div>
            </EditableZone>
          </div>
        )}
      </main>

      {/* Floating Comment FAB */}
      <button
        onClick={() => setCommentPanelOpen(prev => !prev)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-3 rounded-full shadow-xl transition-all"
        title="Xem / thêm comments"
      >
        <MessageCircle size={18} />
        Comments
      </button>

      {/* Right-side Comment Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[380px] max-w-full bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${
          commentPanelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <CommentSection
          previewId={previewId}
          defaultComponent={commentDefaultZone}
          onClose={() => setCommentPanelOpen(false)}
        />
      </div>

      {/* Backdrop */}
      {commentPanelOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setCommentPanelOpen(false)}
        />
      )}
    </div>
  );
};

export default AmazonPreviewPage;
