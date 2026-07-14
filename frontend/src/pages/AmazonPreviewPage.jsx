import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import { useProductStore } from '../stores/productStore';
import { useAppStore } from '../stores/appStore';
import Header from '../components/amazon/Header';
import AmazonLogo from '../components/amazon/AmazonLogo';
import MobileSectionNav from '../components/amazon/mobile/MobileSectionNav';
import ProductTitleBlock from '../components/amazon/ProductTitleBlock';
import MobileStickyCTA from '../components/amazon/mobile/MobileStickyCTA';
import UploadPlaceholder from '../components/amazon/UploadPlaceholder';
import AplusCarousel from '../components/amazon/AplusCarousel';
import AplusContent from '../components/amazon/AplusContent';
import ProductGallery from '../components/amazon/ProductGallery';
import ProductInfo from '../components/amazon/ProductInfo';
import BuyBox from '../components/amazon/BuyBox';
import EditableZone from '../components/shared/EditableZone';
import CommentSection from '../components/shared/CommentSection';
import Stars from '../components/shared/Stars';
import { MessageCircle, Play, ChevronLeft, ChevronRight, ThumbsUp, ChevronDown, Flag, Share2 } from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   STATIC CHROME DATA
   These sections are NON-editable scaffold that mimics a real
   Amazon detail page. Only the colored EditableZone blocks
   (IMAGE / TEXT / APLUS / VIDEO) change based on upload.
   ══════════════════════════════════════════════════════════════ */
const REL_TITLES = [
  'Custom Hawaiian Shirt Personalized Name Beach Aloha Shirt Men Women Summer',
  'Hawaiian Shirts for Men Short Sleeve Button Down Tropical Printed Beach Top',
  'Personalized Custom Face Hawaiian Shirt Funny Photo Shirt Gift for Him Her',
  "Men's Hawaiian Shirt Floral Print Button Down Short Sleeve Beach Party",
  'Custom Name Hawaiian Shirt Matching Family Beach Shirts Summer Gift',
  'Hawaiian Aloha Shirt Men Slim Fit Short Sleeve Casual Button Down Tropical',
  'Personalized Hawaiian Shirt Custom Text Photo Beach Button Down Gift',
  'Hawaiian Button Down Shirts Men Summer Casual Short Sleeve Beach Holiday',
];
const REL_PRICES  = [24.99, 19.99, 29.99, 22.99, 27.99, 18.99, 31.99, 23.49];
const REL_RATINGS = [4.5, 4.7, 4.3, 4.8, 4.6, 4.4, 4.9, 4.5];
const REL_REVIEWS = [1234, 3821, 892, 4450, 3102, 789, 1567, 2104];

const STATIC_REVIEWS = [
  { name: 'Amanda T.', date: 'June 15, 2024', rating: 5, verified: true, helpful: 42,
    title: 'Perfect gift for my husband!',
    body: 'Absolutely love this shirt! The print is vibrant and exactly as shown. The fabric is soft and comfortable. My husband wore it on our beach vacation and got so many compliments. Will definitely order more!' },
  { name: 'Michael R.', date: 'May 28, 2024', rating: 4, verified: true, helpful: 18,
    title: 'Great quality, runs a bit large',
    body: 'Beautiful design and great quality fabric. The colors are bright and true to the photos. I would recommend sizing down as it runs a bit large. Overall very satisfied with this purchase.' },
  { name: 'Jessica L.', date: 'July 2, 2024', rating: 5, verified: false, helpful: 9,
    title: 'Amazing personalization!',
    body: "Ordered this with our dog's face on it. The image quality is incredible. Arrived quickly and packaged nicely. Perfect for summer! The process to upload the custom image was very easy too." },
];

/* ─── Dev-only neutral placeholders (?case=2|3 QA path — see below) ───
   Flat gray numbered squares, NOT product photos, NOT Unsplash. Only used
   so the thumbnail rail + zoom lens can actually be exercised while testing
   Case 2/3 without a real backend task. Never used on the real /amazon
   default path or when a real task provides its own media. ─── */
const devPlaceholderImages = (n) => Array.from({ length: n }, (_, i) => {
  const label = i + 1;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'>`
    + `<rect width='400' height='400' fill='#c9ccd1'/>`
    + `<rect width='400' height='400' fill='none' stroke='#9aa0a8' stroke-width='2'/>`
    + `<text x='50%' y='50%' font-size='36' fill='#6b7280' text-anchor='middle' dominant-baseline='middle'>${label}</text>`
    + `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
});
const devPlaceholderVideo = () =>
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

/* ─── Reusable product card (recommendation carousels) ─── */
const ProductCard = ({ image, title, price, rating, reviews, w = 'w-44' }) => (
  <div className={`flex-shrink-0 ${w} cursor-pointer group`}>
    <div className="w-full aspect-square bg-gray-100 overflow-hidden mb-2 rounded-sm">
      {image
        ? <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
        : <div className="w-full h-full bg-gray-200" />}
    </div>
    <p className="text-xs text-[#007185] line-clamp-3 leading-snug mb-1 group-hover:text-[#C7511F]">{title}</p>
    <div className="flex items-center gap-1 mb-0.5">
      <Stars value={rating} size={11} />
      <span className="text-xs text-[#007185]">{reviews.toLocaleString()}</span>
    </div>
    <p className="text-sm font-bold text-gray-900">${price.toFixed(2)}</p>
  </div>
);

/* ─── Horizontal carousel wrapper with scroll buttons ─── */
const Carousel = ({ title, cards }) => {
  const scrollRef = React.useRef(null);
  const scroll = (dir) => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: dir * 500, behavior: 'smooth' });
  };
  return (
    <div className="bg-white mt-3">
      <div className="max-w-[1500px] mx-auto px-4 py-5 relative">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
        <button
          onClick={() => scroll(-1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-14 bg-white border border-gray-300 rounded shadow-md flex items-center justify-center hover:bg-gray-50"
        >
          <ChevronLeft size={20} />
        </button>
        <div ref={scrollRef} className="flex gap-5 overflow-x-auto scroll-smooth px-8" style={{ scrollbarWidth: 'none' }}>
          {cards.map((c, i) => <ProductCard key={i} {...c} />)}
        </div>
        <button
          onClick={() => scroll(1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-14 bg-white border border-gray-300 rounded shadow-md flex items-center justify-center hover:bg-gray-50"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════════ */
const AmazonPreviewPage = () => {
  const [searchParams] = useSearchParams();
  const previewId = searchParams.get('previewId');
  const taskId    = searchParams.get('taskId');
  const projectId = searchParams.get('projectId');

  const { tasks } = useAppStore();
  const storeData  = useProductStore();

  const task = (projectId && taskId && tasks[projectId])
    ? tasks[projectId].find(t => t.id === taskId)
    : null;
  const taskProductData = task?.productData;
  // Dev/preview convenience: ?case=2|3 lets you preview a case without a real
  // backend task (tasks are only populated from the live API — no mock data
  // since Sprint 1). A real task's category always takes priority.
  const caseOverride = Number(searchParams.get('case'));
  const caseType = task?.category ? Number(task.category) : ([2, 3].includes(caseOverride) ? caseOverride : 1);

  const [previewData, setPreviewData] = useState(null);
  const [isLoading, setIsLoading]     = useState(!!previewId);
  const [activeVideo, setActiveVideo] = useState(0);
  const videoRowRef = React.useRef(null);
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

  // Dev-only: when previewing via ?case=2|3 with no real task/media, inject a
  // handful of NEUTRAL synthetic placeholders (flat SVG squares — not real
  // photos, not Unsplash) so the thumbnail rail + zoom lens are actually
  // exercisable during QA. Only fires for the dev override path with zero
  // real images; a real task's media (or the production empty scaffold on
  // plain /amazon) is never touched.
  const isDevCaseOverride = !task && [2, 3].includes(caseType) && (productData.images || []).length === 0;
  const images = isDevCaseOverride ? devPlaceholderImages(8) : (productData.images || []);
  const videos = isDevCaseOverride ? [devPlaceholderVideo()] : (productData.videos || []);
  const basePrice = Number(productData.price) || 24.99;

  // Amazon "you might also like" recommendation blocks are just filler for a
  // pre-publish preview — hidden for now, decision pending.
  const showAmazonSuggestions = false;

  const relatedCards = REL_TITLES.map((title, i) => ({
    image: images[i % Math.max(images.length, 1)],
    title,
    price:   REL_PRICES[i],
    rating:  REL_RATINGS[i],
    reviews: REL_REVIEWS[i],
  }));

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">Loading Preview...</div>;
  }

  const breadcrumb = caseType === 1
    ? ['Clothing, Shoes & Jewelry', 'Men', 'Clothing', 'Shirts', 'Casual Button-Down Shirts']
    : ['Home & Kitchen', 'Kitchen & Dining', 'Storage & Organization'];

  return (
    <div className="font-amazon min-h-screen bg-[#EAEDED] text-[#111] text-[13px] relative">
      <Header caseType={caseType} />

      {/* ── Breadcrumb ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1500px] mx-auto px-4 py-1.5 text-xs text-[#565959] flex gap-1.5 flex-wrap">
          {breadcrumb.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-gray-400">›</span>}
              <span className={i === breadcrumb.length - 1 ? 'text-gray-800' : 'text-[#007185] cursor-pointer hover:text-orange-600 hover:underline'}>
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          [1] MAIN PRODUCT — Gallery | Info | BuyBox
          🔴 IMAGE zone   🟢 TEXT zone
         ══════════════════════════════════════════════════ */}
      <div className="bg-white">
        <div className="max-w-[1500px] mx-auto px-4 py-5">
          {/* Mobile: title / store / rating above the gallery (real Amazon mobile order) */}
          <div className="md:hidden mb-3">
            <EditableZone zone="TEXT" onCommentClick={handleZoneComment}>
              <ProductTitleBlock {...productData} />
            </EditableZone>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-7 relative overflow-visible">

            {/* Gallery — 🔴 IMAGE zone (sticky) */}
            <div className="md:col-span-5 overflow-visible md:sticky md:top-2 self-start">
              <EditableZone zone="IMAGE" onCommentClick={handleZoneComment}>
                <ProductGallery images={images} videos={videos} caseType={caseType} onCommentClick={handleZoneComment} />
              </EditableZone>
            </div>

            {/* Info — 🟢 TEXT zone (title + details) + About this item */}
            <div className="md:col-span-4 space-y-4">
              <EditableZone zone="TEXT" onCommentClick={handleZoneComment}>
                <ProductInfo {...productData} caseType={caseType} />
              </EditableZone>

              {/* About this item — 🟢 separate TEXT zone (uploadable bullets) */}
              {productData.bulletPoints && productData.bulletPoints.length > 0 && (
                <EditableZone zone="TEXT" onCommentClick={handleZoneComment}>
                  <div className="px-1 pt-2 border-t border-gray-200">
                    <h3 className="text-base font-bold mb-2">About this item</h3>
                    <ul className="list-disc pl-5 space-y-2 text-[13px] text-gray-900">
                      {productData.bulletPoints.map((point, idx) => {
                        const m = String(point).match(/^([^–—:]{3,60}[–—:])\s*(.*)$/);
                        return (
                          <li key={idx} className="leading-relaxed">
                            {m ? <><strong>{m[1]}</strong> {m[2]}</> : point}
                          </li>
                        );
                      })}
                    </ul>
                    <a href="#" className="text-[13px] text-[#007185] hover:text-[#c45500] hover:underline inline-block mt-2">˅ See more</a>
                  </div>
                </EditableZone>
              )}

              {/* Collapsible rows — static chrome (matches reference) */}
              <div className="px-1">
                {['Style', 'Item details'].map((label) => (
                  <div key={label} className="border-t border-gray-200 py-3.5 flex items-center justify-between cursor-pointer">
                    <span className="text-base font-bold">{label}</span>
                    <ChevronDown size={18} className="text-gray-500" />
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-3.5">
                  <span className="inline-block border border-[#d5d9d9] rounded-lg px-3.5 py-2 text-[13px] cursor-pointer shadow-sm hover:bg-gray-50">
                    See all product specifications
                  </span>
                </div>
              </div>
            </div>

            {/* BuyBox — sticky */}
            <div className="md:col-span-3 flex md:justify-end md:sticky md:top-2 self-start">
              <BuyBox price={basePrice} brand={productData.brand} />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky in-page section tabs — mobile only (Top / Details / Explore / Reviews) */}
      <MobileSectionNav />

      {/* ══════════════════════════════════════════════════
          [2] PRODUCT DESCRIPTION — A+ content  (anchor: Details)
          Featured-content carousel (measured 1293×530) + stacked static
          banners. Both data-driven & placeholder-scaffolded — no hardcoded art.
         ══════════════════════════════════════════════════ */}
      <div id="amz-details" className="bg-white mt-3 scroll-mt-12">
        <div className="max-w-[1500px] mx-auto px-4 py-5">
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">Product description</h2>
          <AplusCarousel slides={productData.aPlusSlides || []} onCommentClick={handleZoneComment} />
          <AplusContent banners={productData.aPlusBanners || []} onCommentClick={handleZoneComment} />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          [4] PRODUCT INFORMATION TABLE — static
         ══════════════════════════════════════════════════ */}
      <div className="bg-white mt-3">
        <div className="max-w-[1500px] mx-auto px-4 py-5">
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">Product information</h2>
          <div className="max-w-4xl">
            {[
              ['Brand',                    productData.brand || '—'],
              ['Fabric type',              productData.fabricType || '—'],
              ['Care instructions',        productData.careInstructions || '—'],
              ['Country/Region of Origin', productData.origin || '—'],
              ['Department',               caseType === 1 ? 'Mens' : 'Kitchen & Dining'],
              ['Pattern',                  'Graphic / Custom'],
              ['Fit Type',                 'Regular'],
              ['Item Weight',              '5.6 ounces'],
              ['ASIN',                     'B0CX52S9B1'],
              ['Date First Available',     'January 1, 2024'],
            ].map(([k, v], i) => (
              <div key={i} className={`flex py-2 px-4 text-sm ${i % 2 === 0 ? 'bg-[#F7F7F7]' : 'bg-white'}`}>
                <span className="w-56 flex-shrink-0 font-bold text-gray-700">{k}</span>
                <span className="text-gray-800">{v}</span>
              </div>
            ))}
            <div className="flex py-2 px-4 bg-[#F7F7F7] text-sm items-center">
              <span className="w-56 flex-shrink-0 font-bold text-gray-700">Customer Reviews</span>
              <span className="flex items-center gap-2">
                <Stars value={productData.rating || 4.5} size={13} />
                <span className="font-bold">{Number(productData.rating || 4.5).toFixed(1)}</span>
                <span className="text-[#007185] cursor-pointer">
                  {Number(String(productData.reviewsCount || 0).replace(/,/g, '')).toLocaleString()} ratings
                </span>
              </span>
            </div>
            <div className="flex py-2 px-4 bg-white text-sm">
              <span className="w-56 flex-shrink-0 font-bold text-gray-700">Best Sellers Rank</span>
              <span className="text-[#007185] leading-relaxed">
                #1,024 in Clothing, Shoes &amp; Jewelry
                <br />
                #12 in Men's Casual Button-Down Shirts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* [5] COMPARE WITH SIMILAR ITEMS — filler, hidden behind flag */}
      {showAmazonSuggestions && (
      <div className="bg-white mt-3">
        <div className="max-w-[1500px] mx-auto px-4 py-5">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Compare with similar items</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-xs">
              <thead>
                <tr>
                  <th className="w-32"></th>
                  {relatedCards.slice(0, 4).map((c, i) => (
                    <th key={i} className={`p-3 align-top text-left font-normal ${i === 0 ? 'bg-[#F7FAFA] ring-1 ring-[#D5D9D9]' : ''}`}>
                      <div className="w-full aspect-square bg-gray-100 mb-2 overflow-hidden rounded">
                        {c.image && <img src={c.image} alt="" className="w-full h-full object-cover" />}
                      </div>
                      {i === 0 && <span className="inline-block text-[10px] font-bold text-white bg-[#007185] px-1.5 py-0.5 rounded mb-1">This item</span>}
                      <p className="text-[#007185] line-clamp-2 leading-snug">{c.title}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Customer Rating', relatedCards.slice(0, 4).map(c => <span key={c.title} className="flex items-center gap-1"><Stars value={c.rating} size={11} /><span className="text-gray-500">({c.reviews.toLocaleString()})</span></span>)],
                  ['Price', relatedCards.slice(0, 4).map(c => <span key={c.title} className="font-bold text-[#B12704]">${c.price.toFixed(2)}</span>)],
                  ['Sold By', ['HappyCreative', 'AlohaWear', 'Custom Prints Co', 'Beach Style'].map(s => <span key={s}>{s}</span>)],
                  ['Material', ['100% Cotton', 'Polyester Blend', '100% Cotton', 'Rayon'].map(m => <span key={m}>{m}</span>)],
                  ['Customizable', ['Yes — face & name', 'No', 'Yes — photo', 'No'].map(m => <span key={m}>{m}</span>)],
                ].map(([label, cells], ri) => (
                  <tr key={ri} className="border-t border-gray-200">
                    <td className="p-3 font-bold text-gray-700 align-top">{label}</td>
                    {cells.map((cell, ci) => (
                      <td key={ci} className={`p-3 align-top ${ci === 0 ? 'bg-[#F7FAFA]' : ''}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* ══════════════════════════════════════════════════
          [6] PRODUCT VIDEOS — 🟣 VIDEO zone
         ══════════════════════════════════════════════════ */}
      {/* Always shown as a scaffold — video slot or upload placeholder (VIDEO zone) */}
      <div className="bg-white mt-3">
          <div className="max-w-[1500px] mx-auto px-4 py-5">
            <EditableZone zone="VIDEO" onCommentClick={handleZoneComment}>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Product Videos</h2>

              {/* Large 16:9 player — video or upload placeholder */}
              <div className="relative bg-black rounded-md overflow-hidden mx-auto"
                style={{ maxWidth: 1000, aspectRatio: '16/9' }}>
                {videos.length > 0 ? (
                  <>
                    <video
                      key={videos[activeVideo]}
                      src={videos[activeVideo]}
                      controls
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-3 left-4 text-white pointer-events-none drop-shadow">
                      <div className="text-sm font-bold leading-tight">{productData.brand || 'HappyCreative'}</div>
                      <div className="text-xs opacity-90 leading-tight line-clamp-1 max-w-[240px]">
                        {productData.title || 'Product video'}
                      </div>
                    </div>
                    <button className="absolute top-3 right-4 text-white/90 hover:text-white" aria-label="Report">
                      <Flag size={18} />
                    </button>
                    <button className="absolute bottom-14 right-4 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center" aria-label="Share">
                      <Share2 size={16} />
                    </button>
                  </>
                ) : (
                  <UploadPlaceholder zone="VIDEO" radius={6} label="Upload video sản phẩm (16:9)" />
                )}
              </div>

              {/* Product cards row — filler, hidden behind flag */}
              {showAmazonSuggestions && (
              <div className="relative mt-4">
                <div ref={videoRowRef} className="flex gap-3 overflow-x-auto pb-1 pr-10" style={{ scrollbarWidth: 'none' }}>
                  {relatedCards.slice(0, 6).map((c, idx) => (
                    <div key={idx} className="flex-shrink-0 w-[300px] border border-[#d5d9d9] rounded-lg p-2.5 flex gap-3 cursor-pointer hover:shadow-md transition-shadow">
                      <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                        {c.image && <img src={c.image} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] text-[#007185] leading-snug line-clamp-2">{c.title}</p>
                        <div className="flex items-start mt-1">
                          <span className="text-[11px] relative top-0.5">$</span>
                          <span className="text-[15px] leading-none">{Math.floor(c.price)}</span>
                          <span className="text-[11px] relative top-0.5">{(c.price % 1).toFixed(2).substring(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Scroll-right arrow */}
                <button
                  onClick={() => videoRowRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-16 bg-white border border-gray-300 rounded shadow-md flex items-center justify-center hover:bg-gray-50"
                  aria-label="Scroll right"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              )}

              {/* Multi-video selector */}
              {videos.length > 1 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
                  {videos.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveVideo(idx)}
                      className={`relative flex-shrink-0 rounded overflow-hidden bg-gray-900 transition-all
                        ${activeVideo === idx ? 'ring-2 ring-[#007185]' : 'opacity-60 hover:opacity-100'}`}
                      style={{ width: 120, height: 68 }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">
                          <Play size={14} className="text-gray-900 ml-0.5" />
                        </div>
                      </div>
                      <span className="absolute bottom-1 right-1.5 text-white text-[10px]">{idx + 1}/{videos.length}</span>
                    </button>
                  ))}
                </div>
              )}
            </EditableZone>
          </div>
        </div>

      {/* ══════════════════════════════════════════════════
          [7] PRODUCT DETAILS — compact list (matches real Amazon)
         ══════════════════════════════════════════════════ */}
      <div className="bg-white mt-3">
        <div className="max-w-[1500px] mx-auto px-4 py-5">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Product details</h2>
          <div className="text-sm space-y-2">
            {[
              ['Department', caseType === 1 ? 'unisex-adult' : 'Kitchen & Dining'],
              ['Date First Available', 'March 5, 2024'],
              ['Manufacturer', productData.brand || 'HappyCreative'],
              ['ASIN', 'B0CX4GFW4T'],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span className="font-bold text-gray-800 flex-shrink-0">{k}</span>
                <span className="text-gray-500">:</span>
                <span className="text-gray-700">{v}</span>
              </div>
            ))}

            {/* Best Sellers Rank — with sub-categories */}
            <div className="flex gap-2">
              <span className="font-bold text-gray-800 flex-shrink-0">Best Sellers Rank</span>
              <span className="text-gray-500">:</span>
              <div className="text-gray-700 leading-relaxed">
                <span className="text-[#007185] cursor-pointer hover:underline">#307,526 in Clothing, Shoes &amp; Jewelry</span>
                <span className="text-gray-400 text-xs ml-1">
                  (<span className="text-[#007185] cursor-pointer hover:underline">See Top 100 in Clothing, Shoes &amp; Jewelry</span>)
                </span>
                <br />
                <span className="text-[#007185] cursor-pointer hover:underline">#10,447 in Men's Novelty Clothing</span>
                <br />
                <span className="text-[#007185] cursor-pointer hover:underline">#58,397 in Women's Novelty Clothing</span>
              </div>
            </div>

            {/* Customer Reviews row */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-800 flex-shrink-0">Customer Reviews</span>
              <span className="text-gray-500">:</span>
              <Stars value={productData.rating || 4.6} size={13} />
              <span className="text-sm font-medium">{Number(productData.rating || 4.6).toFixed(1)}</span>
              <span className="text-xs text-[#007185] cursor-pointer hover:underline">
                ({Number(String(productData.reviewsCount || 143).replace(/,/g, '')).toLocaleString()})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          [8] SIMILAR BRANDS — static carousel
         ══════════════════════════════════════════════════ */}
      <div id="amz-explore" className="scroll-mt-12">
        {showAmazonSuggestions && <Carousel title="Similar brands on Amazon" cards={relatedCards} />}
      </div>

      {/* ══════════════════════════════════════════════════
      {/* ══════════════════════════════════════════════════
          [8] CUSTOMER REVIEWS — static  (anchor: Reviews)
         ══════════════════════════════════════════════════ */}
      <div id="amz-reviews" className="bg-white mt-3 scroll-mt-12">
        <div className="max-w-[1500px] mx-auto px-4 py-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5 pb-2 border-b border-gray-200">Customer reviews</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT: rating summary */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Stars value={productData.rating || 4.5} size={20} />
                <span className="text-lg font-medium text-gray-900">
                  {Number(productData.rating || 4.5).toFixed(1)} out of 5
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                {Number(String(productData.reviewsCount || 0).replace(/,/g, '')).toLocaleString()} global ratings
              </p>

              {/* Star bars */}
              <div className="flex flex-col gap-1.5 mb-3">
                {[[5, 84], [4, 6], [3, 3], [2, 6], [1, 1]].map(([s, p]) => (
                  <div key={s} className="flex items-center gap-2 text-xs">
                    <span className="text-[#007185] cursor-pointer hover:underline whitespace-nowrap w-12">{s} star</span>
                    <div className="flex-1 h-4 bg-[#F0F2F2] border border-[#D5D9D9] rounded-sm overflow-hidden">
                      <div className="h-full bg-[#FFA41C] rounded-sm" style={{ width: `${p}%` }} />
                    </div>
                    <span className="text-[#007185] w-8 text-right">{p}%</span>
                  </div>
                ))}
              </div>

              {/* How ratings work link */}
              <p className="text-xs text-[#007185] cursor-pointer hover:underline mb-5 flex items-center gap-1">
                How customer reviews and ratings work
                <ChevronDown size={12} />
              </p>

              {/* Review this product */}
              <div className="border-t border-gray-200 pt-4">
                <p className="font-bold text-sm mb-1">Review this product</p>
                <p className="text-xs text-gray-500 mb-3">Share your thoughts with other customers</p>
                <button className="w-full border border-[#D5D9D9] rounded-full px-5 py-2 text-sm bg-white hover:bg-gray-50 transition-colors shadow-sm">
                  Write a customer review
                </button>
              </div>
            </div>

            {/* RIGHT: customers say + reviews with images + review list */}
            <div className="lg:col-span-2">

              {/* ── Customers say (AI summary) ── */}
              <div className="mb-6 pb-5 border-b border-gray-200">
                <h3 className="font-bold text-base mb-2">Customers say</h3>
                <p className="text-sm text-gray-700 leading-relaxed mb-2">
                  Customers find the Hawaiian shirt to be of excellent quality, with pictures coming out beautifully and a
                  perfect fit. They appreciate its appearance, humor, and material, with one customer noting it's not scratchy,
                  and consider it a great Father's Day gift. Regarding size, while some customers say it's true to size, others
                  mention it runs a bit big.
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mb-4">
                  <span>🤖</span> Generated from the text of customer reviews
                </p>

                {/* Topic tags */}
                <p className="text-xs font-bold text-gray-800 mb-2">Select to learn more</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Quality', count: 59 },
                    { label: 'Print quality', count: 21 },
                    { label: 'Appearance', count: 16 },
                    { label: 'Fit', count: 9 },
                    { label: 'Humor', count: 8 },
                    { label: 'Gift', count: 7 },
                    { label: 'Material', count: 7 },
                    { label: 'Size', count: 14, isNeutral: true },
                  ].map(tag => (
                    <button
                      key={tag.label}
                      className="flex items-center gap-1 text-xs border border-gray-300 rounded-full px-2.5 py-1 bg-white hover:bg-gray-50 text-[#007185]"
                    >
                      {tag.isNeutral ? '〜' : '↗'} {tag.label} ({tag.count})
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Reviews with images ── */}
              {images.length > 0 && (
                <div className="mb-6 pb-5 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-base">Reviews with images</h3>
                    <span className="text-xs text-[#007185] cursor-pointer hover:underline">See all photos »</span>
                  </div>
                  <div className="relative">
                    <button className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-gray-300 rounded-full shadow flex items-center justify-center hover:bg-gray-50">
                      <ChevronLeft size={16} />
                    </button>
                    <div className="flex gap-2 overflow-x-auto px-10 pb-1" style={{ scrollbarWidth: 'none' }}>
                      {images.concat(images).slice(0, 7).map((img, i) => (
                        <div key={i} className="flex-shrink-0 w-[120px] h-[120px] rounded overflow-hidden border border-gray-200 cursor-pointer">
                          <img src={img} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                        </div>
                      ))}
                    </div>
                    <button className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-gray-300 rounded-full shadow flex items-center justify-center hover:bg-gray-50">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* ── Review list ── */}
              <h3 className="font-bold text-base mb-4">Top reviews from the United States</h3>
              {STATIC_REVIEWS.map((r, i) => (
                <div key={i} className="border-b border-gray-100 pb-6 mb-6 last:border-0">
                  {/* Reviewer name + avatar */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {r.name[0]}
                    </div>
                    <span className="font-medium text-sm">{r.name}</span>
                  </div>

                  {/* Stars + title */}
                  <div className="flex items-center gap-2 mb-1">
                    <Stars value={r.rating} size={13} />
                    <span className="font-bold text-sm text-gray-900">{r.title}</span>
                  </div>

                  {/* Date + color + verified */}
                  <p className="text-xs text-gray-500 mb-2">
                    Reviewed in the United States on {r.date}
                  </p>
                  {r.verified && (
                    <p className="text-xs text-gray-500 mb-2">
                      Color: Style A &nbsp;|&nbsp;
                      <span className="text-[#C45500]">Verified Purchase</span>
                    </p>
                  )}

                  {/* Body */}
                  <p className="text-sm text-gray-700 leading-relaxed">{r.body}</p>

                  {/* Thumb image below body (first review only) */}
                  {i === 0 && images[0] && (
                    <div className="mt-3 w-14 h-14 rounded overflow-hidden border border-gray-200 cursor-pointer">
                      <img src={images[0]} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                    </div>
                  )}

                  {/* Helpful row */}
                  <div className="flex items-center gap-3 mt-3">
                    <button className="flex items-center gap-1.5 text-xs border border-[#D5D9D9] rounded-full px-3 py-1 bg-white hover:bg-gray-50">
                      <ThumbsUp size={12} /> Helpful
                    </button>
                    <span className="text-xs text-gray-400">|</span>
                    <span className="text-xs text-gray-500 cursor-pointer hover:underline">Report</span>
                    <span className="text-xs text-gray-400 ml-2">{r.helpful} people found this helpful</span>
                  </div>
                </div>
              ))}

              <button className="border border-[#D5D9D9] rounded-lg px-6 py-2.5 text-sm bg-white hover:bg-gray-50 transition-colors shadow-sm">
                See more reviews →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* [9] BOTTOM CAROUSELS — filler, hidden behind flag */}
      {showAmazonSuggestions && (
        <>
          <Carousel title="Based on your recent shopping trends" cards={[...relatedCards].reverse()} />
          <Carousel title="Best Sellers in Men's Casual Button-Down Shirts" cards={relatedCards} />
        </>
      )}

      {/* ══════════════════════════════════════════════════
          FOOTER
         ══════════════════════════════════════════════════ */}
      <footer className="mt-6">
        {/* Back to top */}
        <div className="bg-[#37475A] text-white text-xs py-3.5 text-center cursor-pointer hover:bg-[#485769] select-none">
          Back to top
        </div>

        {/* Main footer columns */}
        <div className="bg-[#232F3E] text-white py-10">
          <div className="max-w-[1500px] mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-xs">
            {[
              {
                heading: 'Get to Know Us',
                links: [
                  'Careers', 'Amazon Newsletter', 'About Amazon', 'Accessibility',
                  'Sustainability', 'Press Center', 'Investor Relations',
                  'Amazon Devices', 'Amazon Science',
                ],
              },
              {
                heading: 'Make Money with Us',
                links: [
                  'Sell on Amazon', 'Sell apps on Amazon', 'Supply to Amazon',
                  'Protect & Build Your Brand', 'Become an Affiliate',
                  'Become a Delivery Driver', 'Start a Package Delivery Business',
                  'Advertise Your Products', 'Self-Publish with Us',
                  'Become an Amazon Hub Partner', '› See More Ways to Make Money',
                ],
              },
              {
                heading: 'Amazon Payment Products',
                links: [
                  'Amazon Visa', 'Amazon Store Card', 'Amazon Secured Card',
                  'Amazon Business Card', 'Shop with Points',
                  'Credit Card Marketplace', 'Reload Your Balance',
                  'Gift Cards', 'Amazon Currency Converter',
                ],
              },
              {
                heading: 'Let Us Help You',
                links: [
                  'Your Account', 'Your Orders', 'Shipping Rates & Policies',
                  'Amazon Prime', 'Returns & Replacements',
                  'Manage Your Content and Devices',
                  'Recalls and Product Safety Alerts',
                  'Registry & Gift List', 'Help',
                ],
              },
            ].map((col, i) => (
              <div key={i}>
                <h3 className="font-bold text-[13px] mb-3 text-white">{col.heading}</h3>
                <ul className="space-y-2">
                  {col.links.map((link, j) => (
                    <li key={j} className="text-[#DDD] hover:text-white hover:underline cursor-pointer leading-snug">
                      {link}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar — logo + language + country */}
        <div className="bg-[#131A22] text-gray-400 py-8">
          <div className="max-w-[1500px] mx-auto px-4 flex flex-col items-center gap-5">
            {/* Logo */}
            <AmazonLogo className="h-8 w-auto" />

            {/* Language & Country selectors */}
            <div className="flex flex-wrap justify-center gap-3">
              {/* Language */}
              <div className="flex items-center gap-1.5 border border-gray-500 rounded px-3 py-1.5 cursor-pointer hover:border-gray-300 text-white text-[13px] select-none">
                <span className="text-[14px]">🌐</span>
                <span>English</span>
                <svg className="w-3 h-3 ml-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {/* Country */}
              <div className="flex items-center gap-1.5 border border-gray-500 rounded px-3 py-1.5 cursor-pointer hover:border-gray-300 text-white text-[13px] select-none">
                <span className="text-[14px]">🇺🇸</span>
                <span>United States</span>
                <svg className="w-3 h-3 ml-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Legal links */}
            <div className="flex gap-5 flex-wrap justify-center text-xs">
              {['Conditions of Use', 'Privacy Notice', 'Consumer Health Data Privacy', 'Your Ads Privacy Choices'].map(l => (
                <span key={l} className="cursor-pointer hover:text-white hover:underline">{l}</span>
              ))}
            </div>
            <p className="text-xs">©2026 Happy Creative LLC — Internal Preview Tool</p>
          </div>
        </div>
      </footer>

      {/* Spacer so the sticky CTA never covers the footer bottom (mobile) */}
      <div className="h-16 md:hidden bg-[#131A22]" />

      {/* ── Sticky bottom CTA — mobile only ── */}
      <MobileStickyCTA price={basePrice} />

      {/* ── Floating Comment FAB (sits above the sticky CTA on mobile) ── */}
      <button
        onClick={() => setCommentPanelOpen(prev => !prev)}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-3 rounded-full shadow-xl transition-all"
      >
        <MessageCircle size={18} />
        Comments
      </button>

      {/* ── Comment slide-in panel ── */}
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

      {commentPanelOpen && (
        <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setCommentPanelOpen(false)} />
      )}
    </div>
  );
};

export default AmazonPreviewPage;
