'use client';

import { useEffect, useRef, useState } from 'react';
import { searchProducts, getProductComparison, Product, ProductComparison } from '@/lib/api';

function formatCurrency(amount: number) {
  return `£${Number(amount).toFixed(2)}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function Spinner() {
  return (
    <div className="flex justify-center items-center py-8">
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function ComparePage() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [comparisons, setComparisons] = useState<ProductComparison[]>([]);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [compareError, setCompareError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    setSearchError(null);
    debounceRef.current = setTimeout(() => {
      searchProducts(query)
        .then(setSearchResults)
        .catch((err) => setSearchError(err.message || 'Search failed'))
        .finally(() => setSearching(false));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  async function handleSelectProduct(product: Product) {
    setSelectedProduct(product);
    setSearchResults([]);
    setQuery(product.name);
    setLoadingComparison(true);
    setCompareError(null);
    try {
      const data = await getProductComparison(product.id);
      setComparisons(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load comparison';
      setCompareError(msg);
    } finally {
      setLoadingComparison(false);
    }
  }

  const cheapest = comparisons.reduce<ProductComparison | null>((best, row) => {
    if (!best) return row;
    return row.normalised_price_per_unit < best.normalised_price_per_unit ? row : best;
  }, null);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Price Comparison</h1>
      <p className="text-gray-500 text-sm mb-8">
        Search for a product to compare its price across all shops.
      </p>

      {/* Search */}
      <div className="relative mb-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex items-center px-4 gap-2">
          <span className="text-gray-400">🔍</span>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedProduct(null);
              setComparisons([]);
            }}
            placeholder="Search products (e.g. semi-skimmed milk)…"
            className="flex-1 py-3 text-sm text-gray-800 focus:outline-none placeholder:text-gray-400"
          />
          {searching && (
            <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {/* Dropdown results */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 overflow-hidden">
            {searchResults.map((product) => (
              <button
                key={product.id}
                className="w-full text-left px-4 py-3 hover:bg-green-50 text-sm transition-colors border-b border-gray-50 last:border-0"
                onClick={() => handleSelectProduct(product)}
              >
                <span className="font-medium text-gray-900">{product.name}</span>
                {product.brand && (
                  <span className="ml-2 text-gray-400">{product.brand}</span>
                )}
                {product.category && (
                  <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                    {product.category}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {searchError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
          {searchError}
        </div>
      )}

      {/* Comparison results */}
      {loadingComparison && <Spinner />}

      {compareError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {compareError}
        </div>
      )}

      {selectedProduct && !loadingComparison && comparisons.length === 0 && !compareError && (
        <div className="text-center py-12 text-gray-400 bg-white border border-gray-100 rounded-xl">
          <p className="text-2xl mb-2">📊</p>
          <p>No price data found for <strong>{selectedProduct.name}</strong>.</p>
          <p className="text-sm mt-1">Scan a receipt that contains this product to see comparisons.</p>
        </div>
      )}

      {comparisons.length > 0 && selectedProduct && !loadingComparison && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">{selectedProduct.name}</h2>
            {selectedProduct.brand && (
              <p className="text-sm text-gray-400">{selectedProduct.brand}</p>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-6 py-3 font-medium text-gray-500">Shop</th>
                  <th className="px-6 py-3 font-medium text-gray-500 text-right">
                    Price per unit
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500">Unit type</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Date scanned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {comparisons.map((row, idx) => {
                  const isCheapest = cheapest && row.shop_name === cheapest.shop_name &&
                    row.normalised_price_per_unit === cheapest.normalised_price_per_unit;
                  return (
                    <tr
                      key={idx}
                      className={isCheapest ? 'bg-green-50' : 'hover:bg-gray-50'}
                    >
                      <td className="px-6 py-3 font-medium text-gray-900">
                        {row.shop_name}
                        {isCheapest && (
                          <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                            Best price
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right font-semibold text-gray-900">
                        {formatCurrency(row.normalised_price_per_unit)}
                      </td>
                      <td className="px-6 py-3 text-gray-600">{row.unit_type}</td>
                      <td className="px-6 py-3 text-gray-500">{formatDate(row.scanned_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {cheapest && (
            <div className="px-6 py-4 border-t border-gray-100 bg-green-50 text-sm text-green-800">
              <strong>{cheapest.shop_name}</strong> is the cheapest at{' '}
              <strong>{formatCurrency(cheapest.normalised_price_per_unit)}</strong> per unit.
            </div>
          )}
        </div>
      )}

      {!query && !selectedProduct && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-4">🏷️</p>
          <p>Start typing to search for a product.</p>
        </div>
      )}
    </div>
  );
}
