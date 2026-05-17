import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { useProductCompare } from '../hooks/useProducts';
import PriceComparisonTable from '../components/PriceComparisonTable';
import CategoryTag from '../components/CategoryTag';
import { searchProducts } from '../services/api';

export default function CompareScreen({ route }) {
  const initialProductId = route.params?.productId;
  const [selectedProductId, setSelectedProductId] = useState(initialProductId);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const { product, comparison, loading, error, fetchComparison } = useProductCompare(selectedProductId);

  useEffect(() => {
    if (selectedProductId) fetchComparison();
  }, [selectedProductId]);

  async function handleSearch(q) {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const results = await searchProducts(q);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a product…"
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#aaa"
        />
      </View>

      {searchResults.length > 0 && (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.searchResult}
              onPress={() => { setSelectedProductId(item.id); setSearchResults([]); setSearchQuery(''); }}
            >
              <Text style={styles.searchResultName}>{item.name}</Text>
            </TouchableOpacity>
          )}
          style={styles.searchList}
        />
      )}

      {!selectedProductId && !searchResults.length && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>Compare prices across shops</Text>
          <Text style={styles.emptySubtitle}>Search for a product to see its price history at every shop you've visited.</Text>
        </View>
      )}

      {loading && <ActivityIndicator size="large" color="#2d6a4f" style={styles.loader} />}

      {product && !loading && (
        <View style={styles.content}>
          <View style={styles.productHeader}>
            <Text style={styles.productName}>{product.name}</Text>
            {product.category && <CategoryTag category={product.category} />}
          </View>
          <PriceComparisonTable comparison={comparison} />
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  searchBox: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  searchInput: {
    backgroundColor: '#f5f7fa', borderRadius: 12, padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#ddd',
  },
  searchList: { maxHeight: 200, backgroundColor: '#fff' },
  searchResult: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  searchResultName: { fontSize: 15, color: '#1a1a2e' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e', textAlign: 'center', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },
  loader: { marginTop: 40 },
  content: { padding: 16 },
  productHeader: { marginBottom: 12 },
  productName: { fontSize: 20, fontWeight: '700', color: '#1a1a2e', marginBottom: 6 },
  error: { color: '#e74c3c', textAlign: 'center', margin: 20 },
});
