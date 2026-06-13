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
  weightGrams?: number;
  volumeMl?: number;
  normalised_price_per_unit?: number;
  normalisedPrice?: number;
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
  detectedShop?: string | null;
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

// fetch() rejects with an opaque TypeError ("Failed to fetch") when the request
// never reaches the server — wrong NEXT_PUBLIC_API_URL, CORS rejection, or the
// backend being down. Translate that into something actionable.
function unreachableError(err: unknown): Error {
  if (err instanceof TypeError) {
    return new Error(
      `Could not reach the Basket-Bud API at ${BASE_URL}. ` +
      'Check that NEXT_PUBLIC_API_URL is set for this deployment in Vercel, ' +
      'and that the backend FRONTEND_URL/CORS settings allow this site.'
    );
  }
  return err instanceof Error ? err : new Error(String(err));
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = await res.text();
    try {
      const parsed = JSON.parse(message);
      if (parsed && typeof parsed.error === 'string') message = parsed.error;
    } catch {
      // not JSON — keep raw text
    }
    throw new Error(`API error ${res.status}: ${message}`);
  }
  return res.json();
}

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  let res: Response;
  try {
    res = await fetch(url.toString(), { cache: 'no-store' });
  } catch (err) {
    throw unreachableError(err);
  }
  return parseResponse<T>(res);
}

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw unreachableError(err);
  }
  return parseResponse<T>(res);
}

async function postFormData<T>(path: string, formData: FormData): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      body: formData,
    });
  } catch (err) {
    throw unreachableError(err);
  }
  return parseResponse<T>(res);
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
