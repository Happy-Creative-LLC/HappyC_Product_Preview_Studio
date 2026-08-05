import { create } from 'zustand';

/* Known-good image URLs (all load reliably in dev) */
const IMG = {
  a: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
  b: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80',
  c: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80',
  d: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
  e: 'https://images.unsplash.com/photo-1489987707023-afc624154e85?auto=format&fit=crop&w=800&q=80',
};

// Initial demo data — a "ready to upload" scaffold. Text fields are populated
// so copy/pricing render, but MEDIA (images/videos/A+/swatch images) is left
// EMPTY on purpose: the frame shows upload placeholders until real content is
// uploaded, and swaps to the real media without any layout shift.
// (IMG kept below only for quickly restoring a filled demo state if needed.)
const initialData = {
  images: [],
  videos: [],

  title: 'Custom Hawaiian Shirt Personalized Name & Photo, Custom Face Aloha Shirt for Men Women, Personalized Beach Button-Down Shirt, Gift for Boyfriend Girlfriend',
  brand: 'AlohaInk Custom',
  rating: '4.7',
  reviewsCount: '2,146',
  price: 29.95,
  oldPrice: 45.99,
  discountPercent: 35,
  badges: ["Amazon's Choice"],
  salesStat: '500+ bought in past month',
  boughtRecently: '500+ bought in past month',
  sustainabilityFeature: 'Small Business',

  // Pattern selector — rendered as image swatches (Amazon "Pattern Name:")
  variationLabel: 'Pattern Name',
  colors: [
    { name: 'Aloha Blue',      price: 29.95 },
    { name: 'Sunset Hibiscus', price: 29.95 },
    { name: 'Palm Green',      price: 29.95 },
    { name: 'Pineapple Gold',  price: 31.95 },
    { name: 'Ocean Wave',      price: 29.95 },
    { name: 'Classic Red',     price: 29.95 },
    { name: 'Tropical Night',  price: 32.95 },
    { name: 'Golden Coast',    price: 29.95 },
  ],
  sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],

  bulletPoints: [
    'PERSONALIZED JUST FOR YOU – Add any name, photo or face to create a one-of-a-kind Hawaiian shirt that stands out at any party.',
    'PREMIUM SOFT FABRIC – Lightweight, breathable material keeps you cool at the beach, luau, cruise or pool party all day long.',
    '50+ TROPICAL PATTERNS – Choose from palm leaves, hibiscus, pineapple and more vibrant aloha prints to match your style.',
    'FOR MEN, WOMEN & YOUTH – Unisex relaxed fit with matching sizes so the whole family can twin on vacation.',
    'PERFECT GIFT – Great for birthdays, anniversaries, Father\'s Day, bachelor parties, weddings and summer getaways.',
  ],
  description:
    'Turn heads with a fully personalized Hawaiian shirt made just for you. Upload a name, face or favorite photo and our team prints it onto a premium, breathable aloha shirt. Whether it is a beach wedding, a bachelor party, a family cruise or a backyard luau, this custom button-down is the ultimate statement piece. Available for men, women and youth in a relaxed unisex fit, with over 50 tropical patterns to choose from.',

  aPlusImages: [],

  // A+ content scaffold — measured from the real page: 6 carousel slides + 4
  // stacked banners. Empty slots (null) render upload placeholders; a real
  // upload replaces the null with an image URL.
  aPlusSlides: [null, null, null, null, null, null],
  aPlusBanners: [null, null, null, null],

  fabricType: '100% Breathable Rayon',
  careInstructions: 'Machine Wash Cold, Hang Dry',
  origin: 'Made in USA',
  tags: ['hawaiian shirt', 'custom face', 'personalized gift', 'aloha', 'beach party'],
};

// Store chỉ còn dùng để ĐỌC: scaffold hiển thị khi vào /amazon, /etsy, /search
// mà chưa có preview thật. Toàn bộ action ghi trước đây chỉ phục vụ ControlPanel
// (đã xoá) — nội dung thật đi qua AmazonUploadForm → API → previews.product_data.
export const useProductStore = create(() => ({ ...initialData }));
