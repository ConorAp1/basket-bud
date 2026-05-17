import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import ProductRow from '../components/ProductRow';
import ShopBadge from '../components/ShopBadge';
import { useReceiptDetail } from '../hooks/useReceipts';
import { formatCurrency } from '../utils/formatCurrency';

export default function ReceiptReviewScreen({ route }) {
  const { receiptId } = route.params;
  const { receipt, loading, error, fetchReceipt } = useReceiptDetail(receiptId);

  useEffect(() => {
    fetchReceipt();
  }, []);

  if (loading) return <ActivityIndicator size="large" color="#2d6a4f" style={styles.loader} />;
  if (error) return <Text style={styles.error}>{error}</Text>;
  if (!receipt) return null;

  const date = new Date(receipt.scanned_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <ShopBadge shopName={receipt.shop_name} />
        <Text style={styles.date}>{date}</Text>
        <Text style={styles.total}>{formatCurrency(receipt.total_amount)}</Text>
        <Text style={styles.itemCount}>{receipt.items?.length || 0} items</Text>
      </View>

      <FlatList
        data={receipt.items || []}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <ProductRow item={item} />}
        ListEmptyComponent={<Text style={styles.empty}>No items found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  loader: { marginTop: 60 },
  error: { color: '#e74c3c', textAlign: 'center', margin: 20 },
  summaryCard: {
    backgroundColor: '#fff', padding: 20, margin: 16, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08,
    shadowRadius: 6, elevation: 3,
  },
  date: { fontSize: 14, color: '#888', marginTop: 8 },
  total: { fontSize: 32, fontWeight: '800', color: '#2d6a4f', marginTop: 4 },
  itemCount: { fontSize: 13, color: '#aaa', marginTop: 2 },
  empty: { textAlign: 'center', color: '#aaa', margin: 40 },
});
