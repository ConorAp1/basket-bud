'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getReceipts, Receipt } from '@/lib/api';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatCurrency(amount: number) {
  return `£${Number(amount).toFixed(2)}`;
}

function Spinner() {
  return (
    <div className="flex justify-center items-center py-16">
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function HomePage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getReceipts()
      .then(setReceipts)
      .catch((err) => setError(err.message || 'Could not load receipts'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Receipts</h1>
          <p className="text-gray-500 text-sm mt-1">All your scanned grocery receipts</p>
        </div>
        <Link
          href="/scan"
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          + Scan New Receipt
        </Link>
      </div>

      {loading && <Spinner />}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && receipts.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-4">🧺</p>
          <p className="text-lg font-medium">No receipts yet</p>
          <p className="text-sm mt-1">
            <Link href="/scan" className="text-green-600 hover:underline">
              Scan your first receipt
            </Link>{' '}
            to get started.
          </p>
        </div>
      )}

      {!loading && !error && receipts.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {receipts.map((receipt) => (
            <Link key={receipt.id} href={`/receipts/${receipt.id}`}>
              <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 hover:shadow-md hover:border-green-200 transition-all cursor-pointer">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {receipt.shop_name || receipt.shop?.name || 'Unknown Shop'}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {formatDate(receipt.scanned_at || receipt.created_at)}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(receipt.total_amount)}
                  </span>
                </div>
                {receipt.item_count != null && (
                  <p className="text-xs text-gray-400 mt-3">
                    {receipt.item_count} item{receipt.item_count !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
