'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getShops, scanReceipt, confirmReceipt, Shop, ReceiptItem } from '@/lib/api';

const CATEGORIES = [
  'Dairy',
  'Drinks',
  'Produce',
  'Household',
  'Bakery',
  'Meat',
  'Seafood',
  'Frozen',
  'Snacks',
] as const;

type Category = (typeof CATEGORIES)[number];

interface EditableItem {
  rawName: string;
  rawPrice: number;
  quantity: number;
  unitType: string;
  suggestedCategory: Category | '';
}

function blankItem(): EditableItem {
  return { rawName: '', rawPrice: 0, quantity: 1, unitType: 'per_item', suggestedCategory: '' };
}

function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      {label && <p className="text-sm text-gray-500">{label}</p>}
    </div>
  );
}

export default function ScanPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<string>('Unknown');
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<EditableItem[] | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    getShops()
      .then(setShops)
      .catch(() => {/* non-fatal */});
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setScanError(null);
    setItems(null);
    handleScan(file);
  }

  async function handleScan(file: File) {
    setScanning(true);
    setScanError(null);
    try {
      const formData = new FormData();
      formData.append('receipt', file);
      const result = await scanReceipt(formData);
      const mapped: EditableItem[] = (result.items ?? []).map((item: ReceiptItem) => ({
        rawName: item.rawName ?? item.name ?? item.raw_name ?? '',
        rawPrice: item.rawPrice ?? item.price ?? item.raw_price ?? 0,
        quantity: (item.quantity != null && item.quantity >= 1 && item.quantity <= 99) ? Math.round(item.quantity) : 1,
        unitType: item.unitType ?? item.unit_type ?? 'per_item',
        suggestedCategory: (item.suggestedCategory ?? item.category ?? '') as Category | '',
      }));
      setItems(mapped.length > 0 ? mapped : [blankItem()]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to scan receipt';
      setScanError(msg);
    } finally {
      setScanning(false);
    }
  }

  function updateItem(idx: number, field: keyof EditableItem, value: string | number) {
    setItems((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  function removeItem(idx: number) {
    setItems((prev) => prev?.filter((_, i) => i !== idx) ?? null);
  }

  function addRow() {
    setItems((prev) => (prev ? [...prev, blankItem()] : [blankItem()]));
  }

  async function handleSave() {
    if (!items || items.length === 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      await confirmReceipt({
        shopName: selectedShop,
        items: items.map((it) => ({
          rawName: it.rawName,
          rawPrice: Number(it.rawPrice),
          quantity: Number(it.quantity),
          unitType: it.unitType,
          suggestedCategory: it.suggestedCategory || 'Unknown',
        })),
        scannedAt: new Date().toISOString(),
      });
      router.push('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save receipt';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Scan a Receipt</h1>
      <p className="text-gray-500 text-sm mb-8">
        Upload a photo of your grocery receipt and we&apos;ll extract the items automatically.
      </p>

      {/* Upload area */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 mb-6">
        <div
          className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Receipt preview" className="max-h-64 mx-auto rounded-lg object-contain" />
          ) : (
            <>
              <p className="text-4xl mb-3">📷</p>
              <p className="text-gray-600 font-medium">Click to upload a receipt photo</p>
              <p className="text-gray-400 text-sm mt-1">JPEG, PNG or WebP accepted</p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {preview && !scanning && (
          <button
            className="mt-3 text-xs text-gray-400 hover:text-green-600 underline"
            onClick={() => fileInputRef.current?.click()}
          >
            Choose a different image
          </button>
        )}
      </div>

      {/* Scanning state */}
      {scanning && <Spinner label="Claude Vision is reading your receipt…" />}

      {/* Scan error */}
      {scanError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
          {scanError}
        </div>
      )}

      {/* Editable items table */}
      {items && !scanning && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Extracted Items</h2>
            <span className="text-xs text-gray-400">{items.length} item{items.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Shop selector */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Shop:</label>
            <select
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400"
              value={selectedShop}
              onChange={(e) => setSelectedShop(e.target.value)}
            >
              <option value="Unknown">Unknown</option>
              {shops.map((shop) => (
                <option key={shop.id} value={shop.name}>
                  {shop.name}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">Name</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Price (£)</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Category</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Qty</th>
                  <th className="px-4 py-3 font-medium text-gray-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={item.rawName}
                        onChange={(e) => updateItem(idx, 'rawName', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 min-w-[140px]"
                        placeholder="Product name"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={item.rawPrice}
                        min={0}
                        step={0.01}
                        onChange={(e) => updateItem(idx, 'rawPrice', parseFloat(e.target.value) || 0)}
                        className="w-24 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={item.suggestedCategory}
                        onChange={(e) => updateItem(idx, 'suggestedCategory', e.target.value)}
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                      >
                        <option value="">— Select —</option>
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={item.quantity}
                        min={1}
                        step={1}
                        onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                        className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => removeItem(idx)}
                        className="text-red-400 hover:text-red-600 font-bold text-lg leading-none px-1"
                        title="Remove item"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={addRow}
              className="text-sm text-green-600 hover:text-green-700 font-medium hover:underline"
            >
              + Add Row
            </button>
            <div className="flex items-center gap-3">
              {saveError && (
                <p className="text-red-600 text-xs">{saveError}</p>
              )}
              <button
                onClick={handleSave}
                disabled={saving || items.length === 0}
                className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving…' : 'Save Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
