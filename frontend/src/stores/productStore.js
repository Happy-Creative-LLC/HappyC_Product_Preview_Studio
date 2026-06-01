import { create } from 'zustand';

// Initial Mock Data so the page doesn't look empty at first
const initialData = {
  images: [
    'https://images.unsplash.com/photo-1512429234305-12fe5b0b0f0f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'
  ],
  videos: [],
  title: 'Apple 2023 MacBook Pro Laptop M3 Pro chip with 11‑core CPU, 14‑core GPU: 14.2-inch Liquid Retina XDR Display, 18GB Unified Memory, 512GB SSD Storage',
  brand: 'Visit the Apple Store',
  rating: '4.7',
  reviewsCount: '1,245',
  price: 1899.00,
  oldPrice: 23.98,
  discountPercent: 25,
  badges: ['Overall Pick', 'Limited time deal'],
  salesStat: '3K+ bought in past month',
  sustainabilityFeature: '1 sustainability feature',
  colors: [
    { name: 'Black/Grey/Blue Assorted - 6 Pack', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&q=80', price: 17.98 },
    { name: 'White - 6 Pack', image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=100&q=80', price: 19.99 }
  ],
  sizes: ['Small', 'Medium', 'Large', 'X-Large', 'XX-Large', '3X-Large', '4X'],
  bulletPoints: [
    'SUPERCHARGED BY M3 PRO — The Apple M3 Pro chip, with an 11-core CPU and 14-core GPU, delivers incredible performance for demanding workflows.',
    'UP TO 18 HOURS OF BATTERY LIFE — Go all day thanks to the power-efficient design of Apple silicon.',
    'BRILLIANT PRO DISPLAY — The 14.2-inch Liquid Retina XDR display features Extreme Dynamic Range, 1000 nits of sustained brightness for stunning HDR content.',
    'FULLY COMPATIBLE — All your pro apps run lightning fast—including Adobe Creative Cloud, Apple Xcode, Microsoft 365, and many more.'
  ],
  description: 'The 14-inch MacBook Pro blasts forward with M3 Pro, an incredibly advanced chip that brings even more speed and capability...',
  aPlusImages: [
    'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1200&q=80'
  ]
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
