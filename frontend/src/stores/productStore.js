import { create } from 'zustand';

/* Known-good image URLs (all load reliably in dev) */
const IMG = {
  a: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
  b: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80',
  c: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80',
  d: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
  e: 'https://images.unsplash.com/photo-1489987707023-afc624154e85?auto=format&fit=crop&w=800&q=80',
};

// Initial demo data — mirrors the reference Amazon listing (Custom Hawaiian Shirt)
// so the preview frame looks populated before real content is uploaded.
// Only the colored EditableZones (image/text/video/A+) are replaced on upload.
const initialData = {
  images: [IMG.a, IMG.b, IMG.c, IMG.d, IMG.e, IMG.a, IMG.b],
  videos: ['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'],

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
    { name: 'Aloha Blue',      image: IMG.a, price: 29.95 },
    { name: 'Sunset Hibiscus', image: IMG.b, price: 29.95 },
    { name: 'Palm Green',      image: IMG.c, price: 29.95 },
    { name: 'Pineapple Gold',  image: IMG.d, price: 31.95 },
    { name: 'Ocean Wave',      image: IMG.e, price: 29.95 },
    { name: 'Classic Red',     image: IMG.a, price: 29.95 },
    { name: 'Tropical Night',  image: IMG.b, price: 32.95 },
    { name: 'Golden Coast',    image: IMG.c, price: 29.95 },
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

  aPlusImages: [
    'https://images.unsplash.com/photo-1489987707023-afc624154e85?auto=format&fit=crop&w=970&q=80',
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=970&q=80',
  ],

  fabricType: '100% Breathable Rayon',
  careInstructions: 'Machine Wash Cold, Hang Dry',
  origin: 'Made in USA',
  tags: ['hawaiian shirt', 'custom face', 'personalized gift', 'aloha', 'beach party'],
};

export const useProductStore = create((set) => ({
  ...initialData,

  // Design Team Actions
  setImages: (images) => set({ images }),
  addImage: (image) => set((state) => ({ images: [...state.images, image] })),
  removeImage: (index) => set((state) => ({ images: state.images.filter((_, i) => i !== index) })),
  reorderImages: (newImages) => set({ images: newImages }),

  addAPlusImage: (image) => set((state) => ({ aPlusImages: [...state.aPlusImages, image] })),
  removeAPlusImage: (index) => set((state) => ({ aPlusImages: state.aPlusImages.filter((_, i) => i !== index) })),

  // Media Team Actions
  setVideos: (videos) => set({ videos }),
  addVideo: (video) => set((state) => ({ videos: [...state.videos, video] })),
  removeVideo: (index) => set((state) => ({ videos: state.videos.filter((_, i) => i !== index) })),

  // Seller Team Actions
  setTextInfo: (info) => set((state) => ({ ...state, ...info })),
  addBulletPoint: (point) => set((state) => ({ bulletPoints: [...state.bulletPoints, point] })),
  updateBulletPoint: (index, newPoint) => set((state) => {
    const newPoints = [...state.bulletPoints];
    newPoints[index] = newPoint;
    return { bulletPoints: newPoints };
  }),
  removeBulletPoint: (index) => set((state) => ({ bulletPoints: state.bulletPoints.filter((_, i) => i !== index) })),

  // Variations Actions
  addColor: (color) => set((state) => ({ colors: [...state.colors, color] })),
  removeColor: (index) => set((state) => ({ colors: state.colors.filter((_, i) => i !== index) })),
  addSize: (size) => set((state) => ({ sizes: [...state.sizes, size] })),
  removeSize: (index) => set((state) => ({ sizes: state.sizes.filter((_, i) => i !== index) })),

  // Global Action
  resetData: () => set(initialData)
}));
