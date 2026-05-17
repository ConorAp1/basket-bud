import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatNormalisedPrice } from '../utils/unitHelpers';

export default function PriceTrendAlerts({ data }) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          No price increases detected. Keep scanning to build a price history.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Price Trend Alerts</Text>
      <Text style={styles.subtitle}>Products where the latest price is above the 3-scan rolling average</Text>
      {data.map((item, idx) => {
        const pct = parseFloat(item.pct_change || 0);
        const severity = pct >= 20 ? 'high' : pct >= 10 ? 'medium' : 'low';
        return (
          <View key={String(item.product_id) + idx} style={styles.row}>
            <View style={styles.nameCol}>
              <Text style={styles.productName} numberOfLines={1}>{item.product_name}</Text>
              <Text style={styles.avgPrice}>
                avg {formatNormalisedPrice(parseFloat(item.avg_price), item.unit_type)}
              </Text>
            </View>
            <View style={styles.priceCol}>
              <Text style={styles.currentPrice}>
                {formatNormalisedPrice(parseFloat(item.latest_price), item.unit_type)}
              </Text>
              <View style={[styles.badge, styles[`badge_${severity}`]]}>
                <Text style={styles.badgeText}>+{pct}%</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#888', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  nameCol: { flex: 1, paddingRight: 12 },
  productName: { fontSize: 14, fontWeight: '500', color: '#1a1a2e' },
  avgPrice: { fontSize: 11, color: '#888', marginTop: 2 },
  priceCol: { alignItems: 'flex-end' },
  currentPrice: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  badge: { marginTop: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  badge_high:   { backgroundColor: '#ffeaea' },
  badge_medium: { backgroundColor: '#fff3e0' },
  badge_low:    { backgroundColor: '#fff8e1' },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#c0392b' },
  empty: { padding: 24 },
  emptyText: { color: '#aaa', fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
