import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { formatNormalisedPrice } from '../utils/unitHelpers';
import { formatCurrency } from '../utils/formatCurrency';

export default function ProductRow({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.nameCol}>
        <Text style={styles.name} numberOfLines={2}>{item.rawName || item.name}</Text>
        {item.unitType && item.unitType !== 'unknown' && (
          <Text style={styles.unitType}>{item.unitType.replace(/_/g, ' ')}</Text>
        )}
      </View>
      <View style={styles.priceCol}>
        <Text style={styles.rawPrice}>{formatCurrency(item.rawPrice || item.raw_price)}</Text>
        {item.normalisedPrice && (
          <Text style={styles.normPrice}>{formatNormalisedPrice(item.normalisedPrice, item.unitType)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  nameCol: { flex: 1, paddingRight: 12 },
  name: { fontSize: 15, color: '#1a1a2e', fontWeight: '500' },
  unitType: { fontSize: 12, color: '#888', marginTop: 2, textTransform: 'capitalize' },
  priceCol: { alignItems: 'flex-end' },
  rawPrice: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  normPrice: { fontSize: 12, color: '#2d6a4f', marginTop: 2 },
});
