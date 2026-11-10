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
  const previewIdParam = searchParams.get('previewId');
  const taskId    = searchParams.get('taskId');
  const projectId = searchParams.get('projectId');

  const { tasks } = useAppStore();
  const storeData = useProductStore();

  const task = (projectId && taskId && tasks[projectId])
    ? tasks[projectId].find((t) => t.id === taskId)
    : null;
  const taskProductData = task?.productData;

  const [loadedPreview, setLoadedPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(taskId || previewIdParam));

  const [commentPanelOpen, setCommentPanelOpen] = useState(false);

  useEffect(() => {
    if (!taskId && !previewIdParam) return;
    axiosInstance.get(taskId ? `/api/tasks/${taskId}/preview` : `/api/previews/${previewIdParam}`)
      .then((res) => setLoadedPreview(res.data || null))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [taskId, previewIdParam]);

  const previewData = (() => {
    try { return loadedPreview?.productData ? JSON.parse(loadedPreview.productData) : null; }
    catch { return null; }
  })();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-orange-500" />
      </div>
    );
  }

  const pd = taskProductData || previewData || storeData;

  const shopName     = pd.brand || 'HappyCreative';
  const categoryCrumbs = String(pd.taxonomyPath || 'Home & Living').split('>').slice(0, 2).map((crumb) => crumb.trim());
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
          {categoryCrumbs.map((crumb) => <span key={crumb} className="text-gray-700">{crumb}</span>)}
        </nav>

        {/* ── Two-column: gallery (left) + buy box (right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left column */}
          <div className="lg:col-span-7">
            {videos.length > 0 ? (
              <EditableZone zone="VIDEO">
                <EditableZone zone="IMAGE">
                  <EtsyGallery images={images} videos={videos} />
                </EditableZone>
              </EditableZone>
            ) : (
              <EditableZone zone="IMAGE">
                <EtsyGallery images={images} videos={videos} />
              </EditableZone>
            )}

            <EtsyReviews rating={rating} reviewCount={reviewCount} photos={images} />
            <EtsyShopCard shopName={shopName} products={images} />
          </div>

          {/* Right column — sticky buy box */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-4">
              <EditableZone zone="TEXT">
                <EtsyBuyBox
                  title={pd.title}
                  shopName={shopName}
                  rating={rating}
                  reviewCount={reviewCount}
                  price={Number(pd.price || 0)}
                  listPrice={Number(pd.oldPrice || 0)}
                  bulletPoints={bulletPoints}
                  materials={pd.materials || []}
                  images={images}
                />
              </EditableZone>
              {(pd.description || pd.materials?.length || pd.tags?.length || pd.whoMade || pd.whenMade || pd.taxonomyPath || pd.quantity != null) && (
                <EditableZone zone="TEXT">
                  <section className="mt-5 space-y-2 rounded-xl border p-4 text-sm" aria-label="Chi tiết listing Etsy">
                    {pd.description && <p className="whitespace-pre-wrap">{pd.description}</p>}
                    {pd.materials?.length > 0 && <p><strong>Materials:</strong> {pd.materials.join(', ')}</p>}
                    {pd.tags?.length > 0 && <p><strong>Tags:</strong> {pd.tags.join(', ')}</p>}
                    {pd.whoMade && <p><strong>Who made:</strong> {pd.whoMade}</p>}
                    {pd.whenMade && <p><strong>When made:</strong> {pd.whenMade}</p>}
                    {pd.taxonomyPath && <p><strong>Danh mục:</strong> {pd.taxonomyPath}</p>}
                    {pd.quantity != null && <p><strong>Số lượng:</strong> {pd.quantity}</p>}
                  </section>
                </EditableZone>
              )}
            </div>
          </div>
        </div>

        {/* ── Full-width recommendations ── */}
        <EtsyRecommendations images={images} tags={pd.tags || []} productTitle={pd.title} />
      </main>

      <EtsyFooter />

      {taskId && (
        <>
          <button
            type="button"
            onClick={() => setCommentPanelOpen((open) => !open)}
            aria-expanded={commentPanelOpen}
            aria-controls="task-comments-panel"
            aria-label="Mở trao đổi trong task"
            className="fixed bottom-4 right-4 z-40 flex size-11 items-center justify-center rounded-full bg-blue-600 p-0 text-sm font-semibold text-white shadow-xl transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 md:bottom-6 md:right-6 md:h-11 md:w-auto md:gap-2 md:px-4 md:py-3"
            title="Xem / thêm comment"
          >
            <MessageCircle size={18} aria-hidden="true" />
            <span className="sr-only md:hidden">Comments</span>
            <span className="hidden md:inline">Comments</span>
          </button>

          <div
            id="task-comments-panel"
            role="dialog"
            aria-modal={commentPanelOpen}
            aria-hidden={!commentPanelOpen}
            aria-label="Trao đổi trong task"
            className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-full flex-col bg-white shadow-2xl transition-transform duration-300 sm:w-[400px] ${
              commentPanelOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <CommentSection taskId={taskId} onClose={() => setCommentPanelOpen(false)} />
          </div>

          {commentPanelOpen && (
            <button
              type="button"
              aria-label="Đóng phần trao đổi"
              className="fixed inset-0 z-40 cursor-default bg-black/20"
              onClick={() => setCommentPanelOpen(false)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default EtsyPreviewPage;
