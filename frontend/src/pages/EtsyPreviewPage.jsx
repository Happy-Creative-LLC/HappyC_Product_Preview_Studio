import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import { useProductStore } from '../stores/productStore';
import { useAppStore } from '../stores/appStore';
import EtsyHeader from '../components/etsy/EtsyHeader';
import EtsyGallery from '../components/etsy/EtsyGallery';
import EtsyBuyBox from '../components/etsy/EtsyBuyBox';
import EtsyReviews from '../components/etsy/EtsyReviews';
import EtsyShopCard from '../components/etsy/EtsyShopCard';
import EtsyRecommendations from '../components/etsy/EtsyRecommendations';
import EtsyFooter from '../components/etsy/EtsyFooter';
import EditableZone from '../components/shared/EditableZone';
import CommentSection from '../components/shared/CommentSection';
import { Loader2, MessageCircle } from 'lucide-react';

const EtsyPreviewPage = () => {
  const [searchParams] = useSearchParams();
  const previewId = searchParams.get('previewId');
  const taskId    = searchParams.get('taskId');
  const projectId = searchParams.get('projectId');

  const { tasks } = useAppStore();
  const storeData = useProductStore();

  const task = (projectId && taskId && tasks[projectId])
    ? tasks[projectId].find((t) => t.id === taskId)
    : null;
  const taskProductData = task?.productData;

  const [previewData, setPreviewData] = useState(null);
  const [isLoading, setIsLoading] = useState(!!previewId);

  const [commentPanelOpen, setCommentPanelOpen] = useState(false);
  const [commentDefaultZone, setCommentDefaultZone] = useState(null);

  useEffect(() => {
    if (!previewId) return;
    axiosInstance.get(`/api/previews/${previewId}`)
      .then((res) => {
        if (res.data?.productData) {
          try { setPreviewData(JSON.parse(res.data.productData)); } catch { /* productData không phải JSON hợp lệ: giữ dữ liệu mặc định */ }
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [previewId]);

  const handleZoneComment = (zone) => {
    setCommentDefaultZone(zone);
    setCommentPanelOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-orange-500" />
      </div>
    );
  }

  const pd = taskProductData || previewData || storeData;

  const shopName     = pd.brand || 'HappyCreative';
  const images       = pd.images || [];
  const videos       = pd.videos || [];
  const bulletPoints = pd.bulletPoints || [];
  const rating       = pd.rating || '4.9';
  const reviewCount  = pd.reviewsCount || '8,512';

  return (
    <div className="font-etsy min-h-screen bg-white text-gray-900 relative">
      <EtsyHeader />

      <main className="max-w-[1200px] mx-auto pt-4 px-4 pb-16">
        {/* Breadcrumb */}
        <nav className="text-[13px] text-gray-500 mb-4 flex items-center gap-1.5">
          <a href="#" className="hover:underline">Homepage</a>
          <span>/</span>
          <span className="text-gray-700">Clothing</span>
        </nav>

        {/* ── Two-column: gallery (left) + buy box (right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left column */}
          <div className="lg:col-span-7">
            {videos.length > 0 ? (
              <EditableZone zone="VIDEO" onCommentClick={handleZoneComment}>
                <EditableZone zone="IMAGE" onCommentClick={handleZoneComment}>
                  <EtsyGallery images={images} videos={videos} />
                </EditableZone>
              </EditableZone>
            ) : (
              <EditableZone zone="IMAGE" onCommentClick={handleZoneComment}>
                <EtsyGallery images={images} videos={videos} />
              </EditableZone>
            )}

            <EtsyReviews rating={rating} reviewCount={reviewCount} photos={images} />
            <EtsyShopCard shopName={shopName} products={images} />
          </div>

          {/* Right column — sticky buy box */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-4">
              <EditableZone zone="TEXT" onCommentClick={handleZoneComment}>
                <EtsyBuyBox
                  title={pd.title}
                  shopName={shopName}
                  rating={rating}
                  reviewCount={reviewCount}
                  price={Number(pd.price || 0)}
                  listPrice={Number(pd.oldPrice || 0)}
                  bulletPoints={bulletPoints}
                  materials={pd.fabricType ? [pd.fabricType] : []}
                  images={images}
                />
              </EditableZone>
            </div>
          </div>
        </div>

        {/* ── Full-width recommendations ── */}
        <EtsyRecommendations images={images} tags={pd.tags || []} />
      </main>

      <EtsyFooter />

      {/* Floating Comment FAB */}
      <button
        onClick={() => setCommentPanelOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-3 rounded-full shadow-xl transition-all"
        title="Xem / thêm comments"
      >
        <MessageCircle size={18} />
        Comments
      </button>

      {/* Right-side Comment Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Comments"
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] max-w-full bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${
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
        <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setCommentPanelOpen(false)} />
      )}
    </div>
  );
};

export default EtsyPreviewPage;
