import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import ReceiptCard from '../components/ReceiptCard';
import { useReceipts } from '../hooks/useReceipts';

export default function HomeScreen({ navigation }) {
  const { receipts, loading, error, fetchReceipts } = useReceipts();

  useEffect(() => {
    fetchReceipts();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchReceipts);
    return unsubscribe;
  }, [navigation]);

  if (error) {
    Alert.alert('Error', error);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Receipts</Text>
        <TouchableOpacity
          style={styles.scanBtn}
          onPress={() => navigation.navigate('ScanReceipt')}
        >
          <Text style={styles.scanBtnText}>+ Scan</Text>
        </TouchableOpacity>
      </View>

      {loading && receipts.length === 0 ? (
        <ActivityIndicator size="large" color="#2d6a4f" style={styles.loader} />
      ) : receipts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🧾</Text>
          <Text style={styles.emptyTitle}>No receipts yet</Text>
          <Text style={styles.emptySubtitle}>Scan your first grocery receipt to start comparing prices.</Text>
          <TouchableOpacity
            style={styles.emptyCta}
            onPress={() => navigation.navigate('ScanReceipt')}
          >
            <Text style={styles.emptyCtaText}>Scan a Receipt</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={receipts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ReceiptCard
              receipt={item}
              onPress={() => navigation.navigate('ReceiptReview', { receiptId: item.id })}
            />
          )}
          refreshing={loading}
          onRefresh={fetchReceipts}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#1a1a2e' },
  scanBtn: { backgroundColor: '#2d6a4f', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  scanBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  loader: { marginTop: 60 },
  list: { paddingVertical: 8 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#1a1a2e', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  emptyCta: { backgroundColor: '#2d6a4f', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  emptyCtaText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
