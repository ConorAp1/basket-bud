import { create } from 'zustand';

export const useReceiptStore = create((set, get) => ({
  receipts: [],
  currentScan: null,
  isScanning: false,

  setReceipts: (receipts) => set({ receipts }),
  addReceipt: (receipt) => set((s) => ({ receipts: [receipt, ...s.receipts] })),
  setCurrentScan: (scan) => set({ currentScan: scan }),
  setIsScanning: (isScanning) => set({ isScanning }),
  clearCurrentScan: () => set({ currentScan: null }),
}));

export const useProductStore = create((set) => ({
  products: [],
  setProducts: (products) => set({ products }),
  updateProduct: (id, data) =>
    set((s) => ({
      products: s.products.map((p) => (p.id === id ? { ...p, ...data } : p)),
    })),
}));

export const useShopStore = create((set) => ({
  shops: [],
  setShops: (shops) => set({ shops }),
  addShop: (shop) => set((s) => ({ shops: [...s.shops, shop] })),
}));

export const useAnalyticsStore = create((set) => ({
  summary: null,
  byShop: [],
  byCategory: [],
  topProducts: [],
  shopComparison: [],
  priceAlerts: [],
  dateRange: '30',

  setSummary: (summary) => set({ summary }),
  setByShop: (byShop) => set({ byShop }),
  setByCategory: (byCategory) => set({ byCategory }),
  setTopProducts: (topProducts) => set({ topProducts }),
  setShopComparison: (shopComparison) => set({ shopComparison }),
  setPriceAlerts: (priceAlerts) => set({ priceAlerts }),
  setDateRange: (dateRange) => set({ dateRange }),
}));
