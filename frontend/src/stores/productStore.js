import { create } from 'zustand';

// Initial Mock Data so the page doesn't look empty at first
const initialData = {
  images: [
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80'
  ],
  videos: [],
  title: "Hanes Men's Undershirts, Moisture-Wicking Crewneck T-Shirts, Cotton Classics Multipack",
  brand: 'Visit the Hanes Store',
  rating: '4.6',
  reviewsCount: '154,245',
  price: 19.98,
  oldPrice: 26.00,
  discountPercent: 23,
  badges: ['Overall Pick'],
  salesStat: '10K+ bought in past month',
  sustainabilityFeature: 'Climate Pledge Friendly',
  colors: [
    { name: 'White - 6 Pack', image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=100&q=80', price: 19.98 },
    { name: 'Black/Grey/Blue Assorted - 6 Pack', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&q=80', price: 17.98 },
    { name: 'Black - 6 Pack', image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=100&q=80', price: 21.99 }
  ],
  sizes: ['Small', 'Medium', 'Large', 'X-Large', 'XX-Large', '3X-Large'],
  bulletPoints: [
    'COTTON CLASSICS - Soft, breathable cotton for all-day comfort.',
    'MOISTURE-WICKING - Cool Comfort technology wicks away moisture to keep you cool and dry.',
    'STAY TUCKED IN - Designed with a generous length so your hem stays exactly where it belongs.',
    'CREWNECK - Classic crewneck design lays flat and keeps its shape.',
    'TAGLESS - Tag-free design means no scratchy labels.'
  ],
  description: 'Hanes Cotton Classics men\'s crewneck undershirts deliver the comfort you need. Moisture-wicking technology helps keep you cool and dry, while the generous length ensures your shirt stays tucked in. The classic crewneck design lays flat and keeps its shape, wash after wash.',
  aPlusImages: [
    'https://images.unsplash.com/photo-1489987707023-afc624154e85?auto=format&fit=crop&w=1200&q=80'
  ],
  fabricType: '100% Cotton',
  careInstructions: 'Machine Wash, Tumble Dry Low',
  origin: 'Imported',
  tags: ['cotton', 'comfort', 'undershirt', 'multipack', 'everyday'],
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
