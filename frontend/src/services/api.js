import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error || err.message || 'Network error';
    return Promise.reject(new Error(message));
  }
);

// Receipts
export async function scanReceipt(imageUri) {
  const formData = new FormData();
  const filename = imageUri.split('/').pop();
  const ext = filename.split('.').pop().toLowerCase();
  const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

  formData.append('receipt', { uri: imageUri, name: filename, type: mimeType });

  const { data } = await api.post('/receipts/scan', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
  return data;
}

export async function confirmReceipt(payload) {
  const { data } = await api.post('/receipts', payload);
  return data;
}

export async function getReceipts(params = {}) {
  const { data } = await api.get('/receipts', { params });
  return data;
}

export async function getReceiptById(id) {
  const { data } = await api.get(`/receipts/${id}`);
  return data;
}

// Products
export async function getProducts(params = {}) {
  const { data } = await api.get('/products', { params });
  return data;
}

export async function getProductById(id) {
  const { data } = await api.get(`/products/${id}`);
  return data;
}

export async function updateProduct(id, payload) {
  const { data } = await api.put(`/products/${id}`, payload);
  return data;
}

export async function compareProduct(id) {
  const { data } = await api.get(`/products/${id}/compare`);
  return data;
}

export async function searchProducts(q) {
  const { data } = await api.get('/products/search', { params: { q } });
  return data;
}

export async function getMerges(productId) {
  const { data } = await api.get(`/products/${productId}/merges`);
  return data;
}

export async function mergeProduct(productId, mergeWithProductId) {
  const { data } = await api.post(`/products/${productId}/merge`, { mergeWithProductId });
  return data;
}

export async function deleteMerge(productId, mergeId) {
  await api.delete(`/products/${productId}/merge/${mergeId}`);
}

// Shops
export async function getShops() {
  const { data } = await api.get('/shops');
  return data;
}

export async function createShop(payload) {
  const { data } = await api.post('/shops', payload);
  return data;
}

// Analytics
export async function getAnalyticsSummary(params = {}) {
  const { data } = await api.get('/analytics/summary', { params });
  return data;
}

export async function getAnalyticsByShop(params = {}) {
  const { data } = await api.get('/analytics/by-shop', { params });
  return data;
}

export async function getAnalyticsByCategory(params = {}) {
  const { data } = await api.get('/analytics/by-category', { params });
  return data;
}

export async function getCheapestShop(productId) {
  const { data } = await api.get('/analytics/cheapest-shop', { params: { productId } });
  return data;
}

export async function getTopProducts(params = {}) {
  const { data } = await api.get('/analytics/top-products', { params });
  return data;
}

export async function getShopComparison(params = {}) {
  const { data } = await api.get('/analytics/shop-comparison', { params });
  return data;
}

export async function getPriceAlerts() {
  const { data } = await api.get('/analytics/price-alerts');
  return data;
}

export default api;
