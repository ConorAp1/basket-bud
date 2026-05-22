import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ShopBadge from './ShopBadge';

export default function ShopComparisonTable({ data }) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          Scan the same product from multiple shops to see who wins most often.
        </Text>
      </View>
    );
  }

  const total = data[0]?.total_products || 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shop Comparison Score</Text>
      {total > 0 && (
        <Text style={styles.subtitle}>
          Based on {total} product{total !== 1 ? 's' : ''} bought at multiple shops
        </Text>
      )}
      {data.map((row, idx) => {
        const pct = total > 0 ? Math.round((row.wins / total) * 100) : 0;
        return (
          <View key={row.shop_name} style={[styles.row, idx === 0 && styles.winnerRow]}>
            <View style={styles.rankCol}>
              <Text style={styles.rank}>{idx === 0 ? '🏆' : `#${idx + 1}`}</Text>
            </View>
            <View style={styles.shopCol}>
              <ShopBadge shopName={row.shop_name} />
            </View>
            <View style={styles.scoreCol}>
              <Text style={[styles.wins, idx === 0 && styles.winnerText]}>
                {row.wins} win{row.wins !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.pct}>{pct}%</Text>
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
  winnerRow: { backgroundColor: '#f0faf4', borderRadius: 8, paddingHorizontal: 8 },
  rankCol: { width: 32 },
  rank: { fontSize: 16 },
  shopCol: { flex: 1 },
  scoreCol: { alignItems: 'flex-end' },
  wins: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  winnerText: { color: '#2d6a4f' },
  pct: { fontSize: 11, color: '#888', marginTop: 1 },
  empty: { padding: 24 },
  emptyText: { color: '#aaa', fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
