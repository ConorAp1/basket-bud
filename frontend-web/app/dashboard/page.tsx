'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  getAnalyticsSummary,
  getAnalyticsByShop,
  getAnalyticsByCategory,
  getTopProducts,
  AnalyticsSummary,
  ShopSpend,
  CategorySpend,
  TopProduct,
} from '@/lib/api';

const PIE_COLORS = ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#166534', '#15803d'];

function getDefaultDates() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function formatCurrency(amount: number) {
  return `£${Number(amount).toFixed(2)}`;
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 animate-pulse">
      <div className="h-4 bg-gray-100 rounded mb-3 w-1/2" />
      <div className="h-8 bg-gray-100 rounded w-3/4" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 animate-pulse">
      <div className="h-5 bg-gray-100 rounded mb-6 w-1/3" />
      <div className="h-48 bg-gray-50 rounded" />
    </div>
  );
}

export default function DashboardPage() {
  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [byShop, setByShop] = useState<ShopSpend[]>([]);
  const [byCategory, setByCategory] = useState<CategorySpend[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  async function fetchAll(start: string, end: string) {
    setLoading(true);
    setError(null);
    try {
      const [s, shop, cat, top] = await Promise.all([
        getAnalyticsSummary(start, end),
        getAnalyticsByShop(start, end),
        getAnalyticsByCategory(start, end),
        getTopProducts(start, end),
      ]);
      setSummary(s);
      setByShop(shop);
      setByCategory(cat);
      setTopProducts(top);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load analytics';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll(startDate, endDate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDateChange(field: 'start' | 'end', value: string) {
    const newStart = field === 'start' ? value : startDate;
    const newEnd = field === 'end' ? value : endDate;
    if (field === 'start') setStartDate(value);
    else setEndDate(value);
    fetchAll(newStart, newEnd);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Spending insights from your scanned receipts</p>
        </div>
        {/* Date range */}
        <div className="flex items-center gap-2 text-sm">
          <label className="text-gray-500">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleDateChange('start', e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <label className="text-gray-500">to</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => handleDateChange('end', e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : summary ? (
          <>
            <SummaryCard label="Total Spend" value={formatCurrency(summary.total_spend)} />
            <SummaryCard label="Receipts Scanned" value={String(summary.receipts_scanned)} />
            <SummaryCard label="Products Tracked" value={String(summary.products_tracked)} />
            <SummaryCard label="Shops Visited" value={String(summary.shops_visited)} />
          </>
        ) : null}
      </div>

      {/* Charts */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2">
          <SkeletonChart />
          <SkeletonChart />
          <SkeletonChart />
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Top products bar chart */}
          {topProducts.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 sm:col-span-2">
              <h2 className="font-semibold text-gray-900 mb-4">Top Products by Spend</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={topProducts} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `£${v}`}
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), 'Spend']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                  />
                  <Bar dataKey="total_spend" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Spend by shop pie chart */}
          {byShop.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Spend by Shop</h2>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={byShop}
                    dataKey="total_spend"
                    nameKey="shop_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {byShop.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend
                    formatter={(value) => <span style={{ fontSize: '12px', color: '#374151' }}>{value}</span>}
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), 'Spend']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Spend by category bar chart */}
          {byCategory.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Spend by Category</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={byCategory}
                  layout="vertical"
                  margin={{ top: 4, right: 8, left: 60, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `£${v}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={false}
                    width={55}
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), 'Spend']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                  />
                  <Bar dataKey="total_spend" fill="#16a34a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {!loading && !error && topProducts.length === 0 && byShop.length === 0 && byCategory.length === 0 && (
            <div className="sm:col-span-2 text-center py-16 text-gray-400 bg-white border border-gray-100 rounded-xl">
              <p className="text-4xl mb-4">📈</p>
              <p>No analytics data yet.</p>
              <p className="text-sm mt-1">Scan some receipts to see your spending breakdown here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
