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
  weightGrams?: number | null;
  volumeMl?: number | null;
  suggestedCategory: Category | '';
}

function formatUnit(unitType: string, weightGrams?: number | null, volumeMl?: number | null): string {
  if (weightGrams && weightGrams > 0) {
    return weightGrams >= 1000 ? `${weightGrams / 1000}kg` : `${weightGrams}g`;
  }
  if (volumeMl && volumeMl > 0) {
    return volumeMl >= 1000 ? `${volumeMl / 1000}L` : `${volumeMl}ml`;
  }
  if (unitType === 'per_kg') return 'per kg';
  if (unitType === 'per_litre') return 'per L';
  if (unitType === 'per_100g') return 'per 100g';
  if (unitType === 'per_100ml') return 'per 100ml';
  return 'each';
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

const inputClass =
  'border border-gray-200 rounded-lg px-2 py-1.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-400';

export default function ScanPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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
    e.target.value = '';
  }

  async function handleScan(file: File) {
    setScanning(true);
    setScanError(null);
    try {
      const formData = new FormData();
      formData.append('receipt', file);
      const result = await scanReceipt(formData);
      if (result.detectedShop) {
        setSelectedShop(result.detectedShop);
      }
      const mapped: EditableItem[] = (result.items ?? []).map((item: ReceiptItem) => ({
        rawName: item.rawName ?? item.name ?? item.raw_name ?? '',
        rawPrice: item.rawPrice ?? item.price ?? item.raw_price ?? 0,
        quantity: (item.quantity != null && item.quantity >= 1 && item.quantity <= 99) ? Math.round(item.quantity) : 1,
        unitType: item.unitType ?? item.unit_type ?? 'per_item',
        weightGrams: item.weightGrams ?? null,
        volumeMl: item.volumeMl ?? null,
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
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Scan a Receipt</h1>
      <p className="text-gray-500 text-sm mb-6 sm:mb-8">
        Take a photo of your grocery receipt and we&apos;ll extract the items automatically.
      </p>

      {/* Upload area */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 sm:p-6 mb-6">
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 sm:p-10 text-center">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Receipt preview" className="max-h-64 mx-auto rounded-lg object-contain mb-4" />
          ) : (
            <>
              <p className="text-4xl mb-3">📷</p>
              <p className="text-gray-600 font-medium mb-4">Snap or upload a receipt photo</p>
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              className="sm:hidden bg-green-600 text-white px-5 py-3 rounded-lg text-base font-medium active:bg-green-700"
              onClick={() => cameraInputRef.current?.click()}
              disabled={scanning}
            >
              📷 Take Photo
            </button>
            <button
              className="border border-green-600 text-green-700 bg-white px-5 py-3 sm:py-2 rounded-lg text-base sm:text-sm font-medium hover:bg-green-50 active:bg-green-50"
              onClick={() => fileInputRef.current?.click()}
              disabled={scanning}
            >
              {preview ? 'Choose a different image' : '🖼️ Upload Image'}
            </button>
          </div>
          <p className="text-gray-400 text-xs mt-3">JPEG, PNG or WebP accepted</p>

          {/* Camera capture (mobile) */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          {/* Library / file picker */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Scanning state */}
      {scanning && <Spinner label="Claude Vision is reading your receipt…" />}

      {/* Scan error */}
      {scanError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
          {scanError}
        </div>
      )}

      {/* Editable items */}
      {items && !scanning && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Extracted Items</h2>
            <span className="text-xs text-gray-400">{items.length} item{items.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Shop selector */}
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Shop:</label>
            <select
              className={`${inputClass} flex-1 sm:flex-none px-3 text-gray-800`}
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

          {/* Mobile: card list */}
          <div className="sm:hidden divide-y divide-gray-100">
            {items.map((item, idx) => (
              <div key={idx} className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <input
                    type="text"
                    value={item.rawName}
                    onChange={(e) => updateItem(idx, 'rawName', e.target.value)}
                    className={`${inputClass} flex-1 min-w-0`}
                    placeholder="Product name"
                  />
                  <button
                    onClick={() => removeItem(idx)}
                    className="text-red-400 active:text-red-600 font-bold text-2xl leading-none px-2 py-1"
                    title="Remove item"
                  >
                    ×
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 w-8">£</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={item.rawPrice}
                    min={0}
                    step={0.01}
                    onChange={(e) => updateItem(idx, 'rawPrice', parseFloat(e.target.value) || 0)}
                    className={`${inputClass} w-24`}
                  />
                  <label className="text-xs text-gray-500 ml-2">Qty</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={item.quantity}
                    min={1}
                    step={1}
                    onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                    className={`${inputClass} w-16`}
                  />
                  <span className="ml-auto text-xs text-gray-500 bg-gray-100 rounded px-2 py-1 whitespace-nowrap">
                    {formatUnit(item.unitType, item.weightGrams, item.volumeMl)}
                  </span>
                </div>
                <select
                  value={item.suggestedCategory}
                  onChange={(e) => updateItem(idx, 'suggestedCategory', e.target.value)}
                  className={`${inputClass} w-full`}
                >
                  <option value="">— Select category —</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">Name</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Price (£)</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Unit</th>
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
                        className={`${inputClass} w-full min-w-[140px]`}
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
                        className={`${inputClass} w-24`}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-1 whitespace-nowrap">
                        {formatUnit(item.unitType, item.weightGrams, item.volumeMl)}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={item.suggestedCategory}
                        onChange={(e) => updateItem(idx, 'suggestedCategory', e.target.value)}
                        className={inputClass}
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
                        className={`${inputClass} w-16`}
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

          <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <button
              onClick={addRow}
              className="text-sm text-green-600 hover:text-green-700 font-medium hover:underline text-left"
            >
              + Add Row
            </button>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {saveError && (
                <p className="text-red-600 text-xs">{saveError}</p>
              )}
              <button
                onClick={handleSave}
                disabled={saving || items.length === 0}
                className="w-full sm:w-auto bg-green-600 text-white px-5 py-3 sm:py-2 rounded-lg text-base sm:text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
