import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useProducts } from '../hooks/useProducts';
import CategoryTag from '../components/CategoryTag';
import { getProductCategories } from '../services/api';

export default function ProductsScreen({ navigation }) {
  const { products, loading, fetchProducts } = useProducts();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState(['All']);

  useEffect(() => {
    getProductCategories()
      .then((cats) => setCategories(['All', ...cats]))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchProducts({
      category: selectedCategory !== 'All' ? selectedCategory : undefined,
      search: search || undefined,
    });
  }, [search, selectedCategory]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search products…"
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#aaa"
      />

      <View style={styles.categoryScroll}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(c) => c}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.categoryChip, selectedCategory === item && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text style={[styles.categoryChipText, selectedCategory === item && styles.categoryChipTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.categoryList}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2d6a4f" style={styles.loader} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.productRow}
              onPress={() => navigation.navigate('Compare', { screen: 'CompareScreen', params: { productId: item.id } })}
            >
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                {item.category && <CategoryTag category={item.category} />}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No products found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  searchInput: {
    margin: 16, backgroundColor: '#fff', borderRadius: 12, padding: 12,
    fontSize: 15, borderWidth: 1, borderColor: '#ddd',
  },
  categoryScroll: { marginBottom: 8 },
  categoryList: { paddingHorizontal: 16 },
  categoryChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#f0f0f0', marginRight: 8,
  },
  categoryChipActive: { backgroundColor: '#2d6a4f' },
  categoryChipText: { fontSize: 13, color: '#555', fontWeight: '500' },
  categoryChipTextActive: { color: '#fff' },
  loader: { marginTop: 40 },
  productRow: {
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  productInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  productName: { fontSize: 15, color: '#1a1a2e', fontWeight: '500', flex: 1, marginRight: 8 },
  empty: { textAlign: 'center', color: '#aaa', margin: 40 },
});
