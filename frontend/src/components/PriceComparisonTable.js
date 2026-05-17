import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { formatNormalisedPrice } from '../utils/unitHelpers';
import ShopBadge from './ShopBadge';

export default function PriceComparisonTable({ comparison }) {
  if (!comparison || comparison.length === 0) {
    return <Text style={styles.empty}>No price data available.</Text>;
  }

  const sorted = [...comparison].sort((a, b) => (a.bestPrice || Infinity) - (b.bestPrice || Infinity));
  const cheapest = sorted[0]?.shopName;

  return (
    <View style={styles.container}>
      {sorted.map((shop, idx) => (
        <View key={shop.shopName} style={[styles.row, idx === 0 && styles.cheapestRow]}>
          <View style={styles.shopCol}>
            <ShopBadge shopName={shop.shopName} />
          </View>
          <View style={styles.priceCol}>
            <Text style={[styles.price, idx === 0 && styles.cheapestPrice]}>
              {shop.bestPrice ? formatNormalisedPrice(shop.bestPrice, shop.prices?.[0]?.unitType) : '—'}
            </Text>
            {idx === 0 && <Text style={styles.bestLabel}>Best price</Text>}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', marginVertical: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cheapestRow: { backgroundColor: '#f0faf4' },
  shopCol: { flex: 1 },
  priceCol: { alignItems: 'flex-end' },
  price: { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  cheapestPrice: { color: '#2d6a4f' },
  bestLabel: { fontSize: 11, color: '#2d6a4f', fontWeight: '600', marginTop: 2 },
  empty: { textAlign: 'center', color: '#888', padding: 20 },
});
