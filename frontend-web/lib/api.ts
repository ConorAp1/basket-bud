const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// --- Types ---

export interface Shop {
  id: number;
  name: string;
  location?: string;
  created_at: string;
}

export interface ReceiptItem {
  id?: number;
  name?: string;
  rawName?: string;
  raw_name?: string;
  price?: number;
  rawPrice?: number;
  raw_price?: number;
  quantity: number;
  unitType?: string;
  unit_type?: string;
  normalised_price_per_unit?: number;
  category?: string;
  suggestedCategory?: string;
}

export interface Receipt {
  id: number;
  shop_id?: number;
  shop_name?: string;
  shop?: Shop;
  scanned_at: string;
  image_path?: string;
  raw_ocr_text?: string;
  total_amount: number;
  item_count?: number;
  items?: ReceiptItem[];
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  brand?: string;
  category?: string;
  tags?: string[];
  canonical_unit?: string;
  created_at: string;
}

export interface ProductComparison {
  shop_name: string;
  normalised_price_per_unit: number;
  unit_type: string;
  scanned_at: string;
  raw_price: number;
}

export interface AnalyticsSummary {
  total_spend: number;
  receipts_scanned: number;
  products_tracked: number;
  shops_visited: number;
}

export interface ShopSpend {
  shop_name: string;
  total_spend: number;
}

export interface CategorySpend {
  category: string;
  total_spend: number;
}

export interface TopProduct {
  name: string;
  total_spend: number;
}

export interface ScanResult {
  items: ReceiptItem[];
  raw_text?: string;
}

export interface ConfirmPayload {
  shopName: string;
  items: {
    rawName: string;
    rawPrice: number;
    quantity: number;
    unitType: string;
    suggestedCategory: string;
  }[];
  scannedAt: string;
}

// --- API helpers ---

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

async function postFormData<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

// --- Endpoint functions ---

export async function getReceipts(): Promise<Receipt[]> {
  return get<Receipt[]>('/receipts');
}

export async function getReceipt(id: string): Promise<Receipt> {
  return get<Receipt>(`/receipts/${id}`);
}

export async function scanReceipt(formData: FormData): Promise<ScanResult> {
  return postFormData<ScanResult>('/receipts/scan', formData);
}

export async function confirmReceipt(payload: ConfirmPayload): Promise<Receipt> {
  return post<Receipt>('/receipts', payload);
}

export async function getShops(): Promise<Shop[]> {
  return get<Shop[]>('/shops');
}

export async function searchProducts(q: string): Promise<Product[]> {
  return get<Product[]>('/products/search', { q });
}

export async function getProductComparison(id: number): Promise<ProductComparison[]> {
  return get<ProductComparison[]>(`/products/${id}/compare`);
}

export async function getAnalyticsSummary(start?: string, end?: string): Promise<AnalyticsSummary> {
  const params: Record<string, string> = {};
  if (start) params.start = start;
  if (end) params.end = end;
  return get<AnalyticsSummary>('/analytics/summary', params);
}

export async function getAnalyticsByShop(start?: string, end?: string): Promise<ShopSpend[]> {
  const params: Record<string, string> = {};
  if (start) params.start = start;
  if (end) params.end = end;
  return get<ShopSpend[]>('/analytics/by-shop', params);
}

export async function getAnalyticsByCategory(start?: string, end?: string): Promise<CategorySpend[]> {
  const params: Record<string, string> = {};
  if (start) params.start = start;
  if (end) params.end = end;
  return get<CategorySpend[]>('/analytics/by-category', params);
}

export async function getTopProducts(start?: string, end?: string): Promise<TopProduct[]> {
  const params: Record<string, string> = {};
  if (start) params.start = start;
  if (end) params.end = end;
  return get<TopProduct[]>('/analytics/top-products', params);
}
