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
import Stars from '../components/shared/Stars';
import { MessageCircle, Play, ChevronLeft, ChevronRight, ThumbsUp } from 'lucide-react';

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
  const caseType = task?.category ? Number(task.category) : 1;

  const [previewData, setPreviewData] = useState(null);
  const [isLoading, setIsLoading]     = useState(!!previewId);
  const [activeVideo, setActiveVideo] = useState(0);
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
  const images  = productData.images      || [];
  const videos  = productData.videos      || [];
  const aPlus   = productData.aPlusImages || [];
  const basePrice = Number(productData.price) || 24.99;

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
    <div className="min-h-screen bg-[#EAEDED] text-black font-[Arial,sans-serif] text-sm relative">
      <Header />

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
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-7 relative overflow-visible">

            {/* Gallery — 🔴 IMAGE zone */}
            <div className="md:col-span-5 overflow-visible">
              <EditableZone zone="IMAGE" onCommentClick={handleZoneComment}>
                <ProductGallery images={images} videos={videos} caseType={caseType} />
              </EditableZone>
            </div>

            {/* Info — 🟢 TEXT zone */}
            <div className="md:col-span-4">
              <EditableZone zone="TEXT" onCommentClick={handleZoneComment}>
                <ProductInfo {...productData} caseType={caseType} />
              </EditableZone>
            </div>

            {/* BuyBox — static */}
            <div className="md:col-span-3 flex md:justify-end">
              <BuyBox price={basePrice} brand={productData.brand} />
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          [2] PRODUCT DESCRIPTION — 🟢 TEXT zone
         ══════════════════════════════════════════════════ */}
      {productData.description && (
        <div className="bg-white mt-3">
          <div className="max-w-[1500px] mx-auto px-4 py-5">
            <EditableZone zone="TEXT" onCommentClick={handleZoneComment}>
              <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b border-gray-200">Product description</h2>
              <p className="text-sm text-gray-800 leading-relaxed max-w-4xl whitespace-pre-wrap">
                {productData.description}
              </p>
            </EditableZone>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          [3] FROM THE BRAND (A+ Content) — 🔴 APLUS zone
          Full-width stacked brand marketing images
         ══════════════════════════════════════════════════ */}
      {aPlus.length > 0 && (
        <div className="bg-white mt-3">
          <div className="max-w-[1500px] mx-auto px-4 pt-5 pb-2">
            <EditableZone zone="APLUS" onCommentClick={handleZoneComment}>
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">From the brand</h2>
              <div className="flex flex-col items-center">
                {aPlus.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`A+ Content ${idx + 1}`}
                    className="w-full max-w-[970px] h-auto block"
                    loading="lazy"
                  />
                ))}
              </div>
            </EditableZone>
          </div>
        </div>
      )}

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
                  {Number(productData.reviewsCount || 0).toLocaleString()} ratings
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

      {/* ══════════════════════════════════════════════════
          [5] COMPARE WITH SIMILAR ITEMS — static table
         ══════════════════════════════════════════════════ */}
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

      {/* ══════════════════════════════════════════════════
          [6] PRODUCT VIDEOS — 🟣 VIDEO zone
         ══════════════════════════════════════════════════ */}
      {videos.length > 0 && (
        <div className="bg-white mt-3">
          <div className="max-w-[1500px] mx-auto px-4 py-5">
            <EditableZone zone="VIDEO" onCommentClick={handleZoneComment}>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Videos for this product
                <span className="ml-2 text-sm font-normal text-gray-500">({videos.length})</span>
              </h2>

              <div className="flex gap-6 items-start flex-wrap">
                {/* Player */}
                <div className="flex-shrink-0 bg-black rounded overflow-hidden"
                  style={{ width: 620, maxWidth: '100%', aspectRatio: '16/9' }}>
                  <video
                    key={videos[activeVideo]}
                    src={videos[activeVideo]}
                    controls
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Related product images beside video */}
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-semibold text-gray-700">Product images in this video</p>
                  <div className="grid grid-cols-3 gap-2">
                    {images.slice(0, 6).map((img, idx) => (
                      <div key={idx} className="w-16 h-16 border border-gray-200 overflow-hidden rounded cursor-pointer hover:border-[#007185] transition-colors">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">
                    {images.length} image{images.length !== 1 ? 's' : ''} · {videos.length} video{videos.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Thumbnail strip when >1 video */}
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
      )}

      {/* ══════════════════════════════════════════════════
          [7] SIMILAR BRANDS — static carousel
         ══════════════════════════════════════════════════ */}
      <Carousel title="Similar brands on Amazon" cards={relatedCards} />

      {/* ══════════════════════════════════════════════════
          [8] CUSTOMER REVIEWS — static
         ══════════════════════════════════════════════════ */}
      <div className="bg-white mt-3">
        <div className="max-w-[1500px] mx-auto px-4 py-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5 pb-2 border-b border-gray-200">Customer reviews</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT: rating summary */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Stars value={productData.rating || 4.5} size={20} />
                <span className="text-lg font-medium text-gray-900">
                  {Number(productData.rating || 4.5).toFixed(1)} out of 5
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                {Number(productData.reviewsCount || 0).toLocaleString()} global ratings
              </p>

              <div className="flex flex-col gap-1.5 mb-6">
                {[[5, 72], [4, 15], [3, 7], [2, 3], [1, 3]].map(([s, p]) => (
                  <div key={s} className="flex items-center gap-2 text-xs">
                    <span className="text-[#007185] cursor-pointer hover:underline whitespace-nowrap w-12">{s} star</span>
                    <div className="flex-1 h-4 bg-[#F0F2F2] border border-[#D5D9D9] rounded-sm overflow-hidden">
                      <div className="h-full bg-[#FFA41C] rounded-sm" style={{ width: `${p}%` }} />
                    </div>
                    <span className="text-[#007185] w-8 text-right">{p}%</span>
                  </div>
                ))}
              </div>

              {/* Reviews with images strip */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-bold text-sm mb-3">Reviews with images</h3>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.concat(images).slice(0, 6).map((img, i) => (
                    <div key={i} className="w-16 h-16 flex-shrink-0 rounded overflow-hidden border border-gray-200 cursor-pointer">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 mt-4 pt-4">
                <p className="font-bold text-sm mb-1">Review this product</p>
                <p className="text-xs text-gray-500 mb-2">Share your thoughts with other customers</p>
                <button className="w-full border border-[#D5D9D9] rounded-lg px-5 py-2 text-sm bg-white hover:bg-gray-50 transition-colors shadow-sm">
                  Write a customer review
                </button>
              </div>
            </div>

            {/* RIGHT: review list */}
            <div className="lg:col-span-2">
              <h3 className="font-bold text-base mb-4">Top reviews from the United States</h3>
              {STATIC_REVIEWS.map((r, i) => (
                <div key={i} className="border-b border-gray-100 pb-5 mb-5 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#146EB4] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {r.name[0]}
                    </div>
                    <span className="font-medium text-sm">{r.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Stars value={r.rating} size={13} />
                    <span className="font-bold text-sm text-gray-900">{r.title}</span>
                  </div>
                  <p className="text-xs text-[#C45500] font-medium mb-2">
                    Reviewed in the United States on {r.date}
                    {r.verified && <span className="ml-2">· Verified Purchase</span>}
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">{r.body}</p>
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

      {/* ══════════════════════════════════════════════════
          [9] BOTTOM CAROUSELS — static
         ══════════════════════════════════════════════════ */}
      <Carousel title="Based on your recent shopping trends" cards={[...relatedCards].reverse()} />
      <Carousel title="Best Sellers in Men's Casual Button-Down Shirts" cards={relatedCards} />

      {/* ══════════════════════════════════════════════════
          FOOTER
         ══════════════════════════════════════════════════ */}
      <footer className="mt-6">
        <div className="bg-[#37475A] text-white text-xs py-3.5 text-center cursor-pointer hover:bg-[#485769] select-none">
          Back to top
        </div>
        <div className="bg-[#232F3E] text-white py-10">
          <div className="max-w-[1500px] mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-xs">
            {[
              { heading: 'Get to Know Us', links: ['Careers', 'Blog', 'About Amazon', 'Investor Relations', 'Amazon Devices'] },
              { heading: 'Make Money with Us', links: ['Sell products on Amazon', 'Sell on Amazon Business', 'Become an Affiliate', 'Advertise Your Products'] },
              { heading: 'Amazon Payment Products', links: ['Amazon Business Card', 'Shop with Points', 'Reload Your Balance', 'Currency Converter'] },
              { heading: 'Let Us Help You', links: ['Your Account', 'Your Orders', 'Shipping Rates & Policies', 'Returns & Replacements', 'Help'] },
            ].map((col, i) => (
              <div key={i}>
                <h3 className="font-bold text-sm mb-3">{col.heading}</h3>
                <ul className="space-y-2">
                  {col.links.map((link, j) => (
                    <li key={j} className="text-[#DDD] hover:text-white hover:underline cursor-pointer">{link}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#131A22] text-gray-400 text-xs py-6">
          <div className="max-w-[1500px] mx-auto px-4 flex flex-col items-center gap-3">
            <span className="text-white text-xl font-bold tracking-tight">
              shop<span style={{ color: '#ff9900' }}>·</span>preview
            </span>
            <div className="flex gap-5 flex-wrap justify-center">
              {['Conditions of Use', 'Privacy Notice', 'Consumer Health Data Privacy', 'Your Ads Privacy Choices'].map(l => (
                <span key={l} className="cursor-pointer hover:text-white hover:underline">{l}</span>
              ))}
            </div>
            <p>© 2024 Happy Creative — Internal Preview Tool</p>
          </div>
        </div>
      </footer>

      {/* ── Floating Comment FAB ── */}
      <button
        onClick={() => setCommentPanelOpen(prev => !prev)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-3 rounded-full shadow-xl transition-all"
      >
        <MessageCircle size={18} />
        Comments
      </button>

      {/* ── Comment slide-in panel ── */}
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

      {commentPanelOpen && (
        <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setCommentPanelOpen(false)} />
      )}
    </div>
  );
};

export default AmazonPreviewPage;
