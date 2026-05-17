import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAnalytics } from '../hooks/useAnalytics';
import SpendingChart from '../components/SpendingChart';
import TopProductsChart from '../components/TopProductsChart';
import ShopComparisonTable from '../components/ShopComparisonTable';
import PriceTrendAlerts from '../components/PriceTrendAlerts';
import { formatCurrency } from '../utils/formatCurrency';
import { useAnalyticsStore } from '../store';

const DATE_RANGE_OPTIONS = [
  { label: '30 days', value: '30' },
  { label: '3 months', value: '90' },
  { label: 'All time', value: '3650' },
];

export default function DashboardScreen() {
  const {
    summary, byShop, byCategory, topProducts, shopComparison, priceAlerts,
    dateRange, loading, error, fetchAll,
  } = useAnalytics();
  const { setDateRange } = useAnalyticsStore();

  useEffect(() => {
    fetchAll(parseInt(dateRange, 10));
  }, [dateRange]);

  const hasData = summary && (summary.total_receipts > 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Analytics</Text>

      <View style={styles.rangeRow}>
        {DATE_RANGE_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.rangeChip, dateRange === opt.value && styles.rangeChipActive]}
            onPress={() => setDateRange(opt.value)}
          >
            <Text style={[styles.rangeChipText, dateRange === opt.value && styles.rangeChipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && <ActivityIndicator size="large" color="#2d6a4f" style={styles.loader} />}
      {error && <Text style={styles.error}>{error}</Text>}

      {!loading && !hasData && !error && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>No data yet</Text>
          <Text style={styles.emptySubtitle}>Scan some receipts to see your spending analytics.</Text>
        </View>
      )}

      {summary && hasData && (
        <>
          {/* ── Summary stats ── */}
          <View style={styles.summaryGrid}>
            <StatCard label="Total Spend" value={formatCurrency(summary.total_spend)} />
            <StatCard label="Receipts" value={summary.total_receipts} />
            <StatCard label="Products" value={summary.unique_products} />
            <StatCard label="Shops" value={summary.shops_visited} />
          </View>

          {/* ── Spend by Shop ── */}
          {byShop.length > 0 && (
            <View style={styles.chartCard}>
              <SpendingChart data={byShop} title="Spend by Shop" />
            </View>
          )}

          {/* ── Spend by Category ── */}
          {byCategory.length > 0 && (
            <View style={styles.chartCard}>
              <SpendingChart
                data={byCategory}
                title="Spend by Category"
                labelKey="category"
                color="#52796f"
              />
            </View>
          )}

          {/* ── Top Products by Spend ── */}
          <View style={styles.chartCard}>
            <TopProductsChart data={topProducts} />
          </View>

          {/* ── Shop Comparison Score ── */}
          <View style={styles.chartCard}>
            <ShopComparisonTable data={shopComparison} />
          </View>

          {/* ── Price Trend Alerts ── */}
          <View style={styles.chartCard}>
            <PriceTrendAlerts data={priceAlerts} />
          </View>
        </>
      )}
    </ScrollView>
  );
}

function StatCard({ label, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value ?? '—'}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  content: { padding: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#1a1a2e', marginBottom: 16 },
  rangeRow: { flexDirection: 'row', marginBottom: 20, gap: 8 },
  rangeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0' },
  rangeChipActive: { backgroundColor: '#2d6a4f' },
  rangeChipText: { fontSize: 13, color: '#555', fontWeight: '500' },
  rangeChipTextActive: { color: '#fff' },
  loader: { marginVertical: 40 },
  error: { color: '#e74c3c', textAlign: 'center', marginVertical: 16 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    flex: 1, minWidth: '45%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2, alignItems: 'center',
  },
  statValue: { fontSize: 24, fontWeight: '800', color: '#2d6a4f' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4, fontWeight: '500' },
  chartCard: {
    backgroundColor: '#fff', borderRadius: 14, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2, overflow: 'hidden',
  },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center' },
});
