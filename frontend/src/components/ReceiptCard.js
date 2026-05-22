import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { formatCurrency } from '../utils/formatCurrency';

export default function ReceiptCard({ receipt, onPress }) {
  const date = new Date(receipt.scanned_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.row}>
        <Text style={styles.shopName}>{receipt.shop_name || 'Unknown Shop'}</Text>
        <Text style={styles.amount}>{formatCurrency(receipt.total_amount)}</Text>
      </View>
      <Text style={styles.date}>{date}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shopName: { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  amount: { fontSize: 16, fontWeight: '700', color: '#2d6a4f' },
  date: { fontSize: 13, color: '#888', marginTop: 4 },
});
