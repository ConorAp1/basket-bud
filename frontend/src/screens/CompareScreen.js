import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, TextInput,
  FlatList, TouchableOpacity, Alert, ScrollView,
} from 'react-native';
import { useProductCompare } from '../hooks/useProducts';
import PriceComparisonTable from '../components/PriceComparisonTable';
import CategoryTag from '../components/CategoryTag';
import { searchProducts, getMerges, mergeProduct, deleteMerge } from '../services/api';

export default function CompareScreen({ route }) {
  const initialProductId = route.params?.productId;
  const [selectedProductId, setSelectedProductId] = useState(initialProductId);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [merges, setMerges] = useState([]);
  const [mergePanelOpen, setMergePanelOpen] = useState(false);
  const [mergeQuery, setMergeQuery] = useState('');
  const [mergeResults, setMergeResults] = useState([]);
  const [mergeSearching, setMergeSearching] = useState(false);

  const { product, comparison, loading, error, fetchComparison } = useProductCompare(selectedProductId);

  const loadMerges = useCallback(async () => {
    if (!selectedProductId) return;
    try {
      const data = await getMerges(selectedProductId);
      setMerges(data);
    } catch {
      setMerges([]);
    }
  }, [selectedProductId]);

  useEffect(() => {
    if (selectedProductId) {
      fetchComparison();
      loadMerges();
    }
    setMergePanelOpen(false);
    setMergeQuery('');
    setMergeResults([]);
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

  async function handleMergeSearch(q) {
    setMergeQuery(q);
    if (q.length < 2) { setMergeResults([]); return; }
    setMergeSearching(true);
    try {
      const results = await searchProducts(q);
      const excluded = new Set(merges.map((m) => m.other_product_id));
      excluded.add(selectedProductId);
      setMergeResults(results.filter((r) => !excluded.has(r.id)));
    } catch {
      setMergeResults([]);
    } finally {
      setMergeSearching(false);
    }
  }

  async function handleMerge(targetProduct) {
    try {
      await mergeProduct(selectedProductId, targetProduct.id);
      setMergeQuery('');
      setMergeResults([]);
      setMergePanelOpen(false);
      await Promise.all([fetchComparison(), loadMerges()]);
    } catch (err) {
      Alert.alert('Merge failed', err.message);
    }
  }

  async function handleUnmerge(mergeId) {
    Alert.alert(
      'Remove merge',
      'Price history for this product will be shown separately again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMerge(selectedProductId, mergeId);
              await Promise.all([fetchComparison(), loadMerges()]);
            } catch (err) {
              Alert.alert('Unmerge failed', err.message);
            }
          },
        },
      ]
    );
  }

  function toggleMergePanel() {
    setMergePanelOpen((o) => !o);
    setMergeQuery('');
    setMergeResults([]);
  }

  return (
    <View style={styles.container}>
      {/* Product search */}
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
              onPress={() => {
                setSelectedProductId(item.id);
                setSearchResults([]);
                setSearchQuery('');
              }}
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
          <Text style={styles.emptySubtitle}>
            Search for a product to see its price history at every shop you've visited.
          </Text>
        </View>
      )}

      {loading && <ActivityIndicator size="large" color="#2d6a4f" style={styles.loader} />}

      {product && !loading && (
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.content}>
          <View style={styles.productHeader}>
            <Text style={styles.productName}>{product.name}</Text>
            {product.category && <CategoryTag category={product.category} />}
          </View>

          {/* Merged products chips */}
          {merges.length > 0 && (
            <View style={styles.mergesSection}>
              <Text style={styles.mergesLabel}>Also includes:</Text>
              <View style={styles.mergesRow}>
                {merges.map((m) => (
                  <View key={m.id} style={styles.mergeChip}>
                    <Text style={styles.mergeChipText} numberOfLines={1}>{m.other_product_name}</Text>
                    <TouchableOpacity
                      onPress={() => handleUnmerge(m.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.mergeChipRemove}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Mark as same product */}
          <TouchableOpacity style={styles.mergeBtn} onPress={toggleMergePanel} activeOpacity={0.7}>
            <Text style={styles.mergeBtnText}>
              {mergePanelOpen ? 'Cancel' : '⊕  Mark as same product'}
            </Text>
          </TouchableOpacity>

          {/* Merge search panel */}
          {mergePanelOpen && (
            <View style={styles.mergePanel}>
              <TextInput
                style={styles.mergeInput}
                placeholder="Search product to merge with…"
                value={mergeQuery}
                onChangeText={handleMergeSearch}
                placeholderTextColor="#aaa"
                autoFocus
              />
              {mergeSearching && (
                <ActivityIndicator size="small" color="#2d6a4f" style={styles.mergeLoader} />
              )}
              {mergeResults.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.mergeResult}
                  onPress={() => handleMerge(item)}
                >
                  <Text style={styles.mergeResultName}>{item.name}</Text>
                  {item.category && (
                    <Text style={styles.mergeResultCategory}>{item.category}</Text>
                  )}
                </TouchableOpacity>
              ))}
              {mergeQuery.length >= 2 && !mergeSearching && mergeResults.length === 0 && (
                <Text style={styles.mergeNoResults}>No products found</Text>
              )}
            </View>
          )}

          <PriceComparisonTable comparison={comparison} />
        </ScrollView>
      )}

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  searchBox: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  searchInput: {
    backgroundColor: '#f5f7fa', borderRadius: 12, padding: 12,
    fontSize: 15, borderWidth: 1, borderColor: '#ddd',
  },
  searchList: { maxHeight: 200, backgroundColor: '#fff' },
  searchResult: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  searchResultName: { fontSize: 15, color: '#1a1a2e' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e', textAlign: 'center', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },
  loader: { marginTop: 40 },
  scrollArea: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  productHeader: { marginBottom: 10 },
  productName: { fontSize: 20, fontWeight: '700', color: '#1a1a2e', marginBottom: 6 },

  // Merge chips
  mergesSection: { marginBottom: 10 },
  mergesLabel: { fontSize: 12, color: '#888', marginBottom: 6, fontWeight: '500' },
  mergesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  mergeChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#eaf4ef', borderRadius: 14,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: '#2d6a4f',
    maxWidth: 200,
  },
  mergeChipText: { fontSize: 13, color: '#2d6a4f', fontWeight: '500', flex: 1, marginRight: 4 },
  mergeChipRemove: { fontSize: 16, color: '#2d6a4f', fontWeight: '700' },

  // Merge toggle button
  mergeBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 18, borderWidth: 1, borderColor: '#2d6a4f',
    marginBottom: 14,
  },
  mergeBtnText: { fontSize: 13, color: '#2d6a4f', fontWeight: '600' },

  // Merge search panel
  mergePanel: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1,
    borderColor: '#ddd', padding: 12, marginBottom: 14,
  },
  mergeInput: {
    backgroundColor: '#f5f7fa', borderRadius: 10, padding: 10,
    fontSize: 14, borderWidth: 1, borderColor: '#ddd', marginBottom: 8,
  },
  mergeLoader: { marginVertical: 8 },
  mergeResult: {
    paddingVertical: 10, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  mergeResultName: { fontSize: 14, color: '#1a1a2e', flex: 1 },
  mergeResultCategory: { fontSize: 12, color: '#888', marginLeft: 8 },
  mergeNoResults: { fontSize: 13, color: '#aaa', textAlign: 'center', paddingVertical: 12 },

  error: { color: '#e74c3c', textAlign: 'center', margin: 20 },
});
