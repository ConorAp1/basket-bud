'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { getReceipt, Receipt } from '@/lib/api';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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

export default function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getReceipt(id)
      .then(setReceipt)
      .catch((err) => setError(err.message || 'Could not load receipt'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-sm text-green-600 hover:underline">
          ← Back to receipts
        </Link>
      </div>

      {loading && <Spinner />}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {receipt && (
        <>
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {receipt.shop_name || receipt.shop?.name || 'Unknown Shop'}
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  {formatDate(receipt.scanned_at || receipt.created_at)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Total</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(receipt.total_amount)}
                </p>
              </div>
            </div>
          </div>

          {receipt.items && receipt.items.length > 0 ? (
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">
                  Line Items ({receipt.items.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-6 py-3 font-medium text-gray-500">Name</th>
                      <th className="px-6 py-3 font-medium text-gray-500">Qty</th>
                      <th className="px-6 py-3 font-medium text-gray-500">Unit</th>
                      <th className="px-6 py-3 font-medium text-gray-500 text-right">
                        Price
                      </th>
                      <th className="px-6 py-3 font-medium text-gray-500 text-right">
                        Per Unit
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {receipt.items.map((item, idx) => (
                      <tr key={item.id ?? idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3 text-gray-900 font-medium">
                          {item.name || item.raw_name}
                          {item.category && (
                            <span className="ml-2 text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">
                              {item.category}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-gray-600">{item.quantity}</td>
                        <td className="px-6 py-3 text-gray-600">{item.unit_type || '—'}</td>
                        <td className="px-6 py-3 text-gray-900 text-right">
                          {formatCurrency(item.price ?? item.raw_price ?? 0)}
                        </td>
                        <td className="px-6 py-3 text-gray-600 text-right">
                          {item.normalised_price_per_unit != null
                            ? formatCurrency(item.normalised_price_per_unit)
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400 bg-white border border-gray-100 rounded-xl">
              No line items available for this receipt.
            </div>
          )}
        </>
      )}
    </div>
  );
}
