import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const BAR_MAX_WIDTH = width - 80;

export default function SpendingChart({ data, title }) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No data yet</Text>
      </View>
    );
  }

  const maxSpend = Math.max(...data.map((d) => parseFloat(d.total_spend || 0)));

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      {data.map((item, idx) => {
        const label = item.shop_name || item.category || `Item ${idx}`;
        const spend = parseFloat(item.total_spend || 0);
        const barWidth = maxSpend > 0 ? (spend / maxSpend) * BAR_MAX_WIDTH : 0;

        return (
          <View key={label} style={styles.row}>
            <Text style={styles.label} numberOfLines={1}>{label}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.bar, { width: barWidth }]} />
            </View>
            <Text style={styles.value}>£{spend.toFixed(2)}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  label: { width: 90, fontSize: 13, color: '#555', marginRight: 8 },
  barTrack: { flex: 1, height: 16, backgroundColor: '#f0f0f0', borderRadius: 8, overflow: 'hidden' },
  bar: { height: 16, backgroundColor: '#2d6a4f', borderRadius: 8 },
  value: { width: 54, textAlign: 'right', fontSize: 13, fontWeight: '600', color: '#2d6a4f', marginLeft: 8 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#aaa', fontSize: 14 },
});
