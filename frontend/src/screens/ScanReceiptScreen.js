import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, ScrollView, TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { scanReceipt, confirmReceipt } from '../services/api';
import { normaliseItems } from '../utils/normalise';

const CATEGORIES = [
  'Dairy', 'Drinks', 'Produce', 'Bakery', 'Meat',
  'Seafood', 'Frozen', 'Snacks', 'Household',
];

export default function ScanReceiptScreen({ navigation }) {
  const [step, setStep] = useState('pick'); // pick | reviewing | saving
  const [scanResult, setScanResult] = useState(null);
  const [items, setItems] = useState([]);
  const [shopName, setShopName] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedCategoryIdx, setExpandedCategoryIdx] = useState(null);

  async function pickImage(useCamera) {
    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!perm.granted) {
      Alert.alert(
        'Permission required',
        useCamera ? 'Camera access is needed.' : 'Photo library access is needed.'
      );
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 });

    if (result.canceled) return;

    setLoading(true);
    try {
      const data = await scanReceipt(result.assets[0].uri);
      setScanResult(data);
      setItems(data.items || []);
      setStep('reviewing');
    } catch (err) {
      Alert.alert('Scan failed', err.message);
    } finally {
      setLoading(false);
    }
  }

  function updateItem(idx, field, value) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }

  function removeItem(idx) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
    if (expandedCategoryIdx === idx) setExpandedCategoryIdx(null);
  }

  function toggleCategoryPicker(idx) {
    setExpandedCategoryIdx((prev) => (prev === idx ? null : idx));
  }

  function selectCategory(idx, category) {
    updateItem(idx, 'suggestedCategory', category);
    setExpandedCategoryIdx(null);
  }

  async function confirmAndSave() {
    if (!items.length) {
      Alert.alert('No items', 'Please keep at least one item.');
      return;
    }
    setLoading(true);
    try {
      await confirmReceipt({
        shopName: shopName || null,
        scannedAt: new Date().toISOString(),
        imagePath: scanResult?.imagePath,
        rawText: scanResult?.rawText,
        items: items.map((item) => ({
          ...item,
          category: item.suggestedCategory || null,
        })),
      });
      Alert.alert('Saved!', 'Receipt saved successfully.', [
        { text: 'OK', onPress: () => navigation.navigate('Home') },
      ]);
    } catch (err) {
      Alert.alert('Save failed', err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centred}>
        <ActivityIndicator size="large" color="#2d6a4f" />
        <Text style={styles.loadingText}>
          {step === 'pick' ? 'Processing receipt…' : 'Saving…'}
        </Text>
      </View>
    );
  }

  if (step === 'reviewing') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Review Items</Text>
        <Text style={styles.hint}>
          OCR confidence: {scanResult?.confidence}%. Edit items, assign categories, then save.
        </Text>

        <TextInput
          style={styles.shopInput}
          placeholder="Shop name (e.g. Tesco, Aldi)"
          value={shopName}
          onChangeText={setShopName}
          placeholderTextColor="#aaa"
        />

        {items.map((item, idx) => (
          <View key={idx} style={styles.itemCard}>
            {/* Product name */}
            <TextInput
              style={styles.itemName}
              value={item.rawName}
              onChangeText={(v) => updateItem(idx, 'rawName', v)}
              placeholder="Product name"
            />

            {/* Price + unit + remove */}
            <View style={styles.itemRow}>
              <TextInput
                style={styles.itemPrice}
                value={String(item.rawPrice)}
                onChangeText={(v) => updateItem(idx, 'rawPrice', parseFloat(v) || 0)}
                keyboardType="decimal-pad"
                placeholder="Price"
              />
              <Text style={styles.itemUnit}>{item.unitType?.replace(/_/g, ' ')}</Text>
              <TouchableOpacity onPress={() => removeItem(idx)} style={styles.removeBtn}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Category picker */}
            <TouchableOpacity
              style={styles.categoryRow}
              onPress={() => toggleCategoryPicker(idx)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.categoryChip,
                item.suggestedCategory ? styles.categoryChipFilled : styles.categoryChipEmpty,
              ]}>
                <Text style={[
                  styles.categoryChipText,
                  item.suggestedCategory ? styles.categoryChipTextFilled : styles.categoryChipTextEmpty,
                ]}>
                  {item.suggestedCategory || 'Tap to categorise'}
                </Text>
                <Text style={styles.categoryChevron}>
                  {expandedCategoryIdx === idx ? '▲' : '▼'}
                </Text>
              </View>
              {item.suggestedCategory && !expandedCategoryIdx && (
                <Text style={styles.suggestedLabel}> suggested</Text>
              )}
            </TouchableOpacity>

            {/* Expanded category options */}
            {expandedCategoryIdx === idx && (
              <View style={styles.categoryOptions}>
                <TouchableOpacity
                  style={styles.categoryOptionClear}
                  onPress={() => selectCategory(idx, null)}
                >
                  <Text style={styles.categoryOptionClearText}>Clear</Text>
                </TouchableOpacity>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryOption,
                      item.suggestedCategory === cat && styles.categoryOptionActive,
                    ]}
                    onPress={() => selectCategory(idx, cat)}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      item.suggestedCategory === cat && styles.categoryOptionTextActive,
                    ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.confirmBtn} onPress={confirmAndSave}>
          <Text style={styles.confirmBtnText}>Save Receipt ({items.length} items)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => setStep('pick')}>
          <Text style={styles.cancelBtnText}>Scan Again</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.centred}>
        <Text style={styles.icon}>🧾</Text>
        <Text style={styles.title}>Scan a Receipt</Text>
        <Text style={styles.subtitle}>Take a photo or choose from your library.</Text>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => pickImage(true)}>
          <Text style={styles.primaryBtnText}>📷  Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => pickImage(false)}>
          <Text style={styles.secondaryBtnText}>🖼  Choose from Library</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  centred: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  icon: { fontSize: 72, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a2e', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#888', textAlign: 'center', marginBottom: 32 },
  primaryBtn: {
    backgroundColor: '#2d6a4f', paddingHorizontal: 32, paddingVertical: 16,
    borderRadius: 28, marginBottom: 12, width: '100%', alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: '#fff', borderWidth: 2, borderColor: '#2d6a4f',
    paddingHorizontal: 32, paddingVertical: 16, borderRadius: 28,
    width: '100%', alignItems: 'center',
  },
  secondaryBtnText: { color: '#2d6a4f', fontSize: 17, fontWeight: '700' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#555' },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e', marginBottom: 8 },
  hint: { fontSize: 13, color: '#888', marginBottom: 16 },
  shopInput: {
    backgroundColor: '#fff', borderRadius: 10, padding: 12, fontSize: 15,
    marginBottom: 16, borderWidth: 1, borderColor: '#ddd',
  },
  itemCard: {
    backgroundColor: '#fff', borderRadius: 10, padding: 12,
    marginBottom: 10, borderWidth: 1, borderColor: '#eee',
  },
  itemName: { fontSize: 15, color: '#1a1a2e', marginBottom: 8, fontWeight: '500' },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  itemPrice: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6, width: 80, fontSize: 14, marginRight: 8,
  },
  itemUnit: { flex: 1, fontSize: 12, color: '#888', textTransform: 'capitalize' },
  removeBtn: { padding: 8 },
  removeBtnText: { color: '#e74c3c', fontWeight: '700', fontSize: 16 },
  categoryRow: { flexDirection: 'row', alignItems: 'center' },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 16, borderWidth: 1,
  },
  categoryChipFilled: { backgroundColor: '#eaf4ef', borderColor: '#2d6a4f' },
  categoryChipEmpty:  { backgroundColor: '#f9f9f9', borderColor: '#ddd' },
  categoryChipText: { fontSize: 13, fontWeight: '500', marginRight: 4 },
  categoryChipTextFilled: { color: '#2d6a4f' },
  categoryChipTextEmpty:  { color: '#aaa' },
  categoryChevron: { fontSize: 9, color: '#888' },
  suggestedLabel: { fontSize: 11, color: '#aaa', marginLeft: 4 },
  categoryOptions: {
    flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 6,
  },
  categoryOption: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 14, borderWidth: 1, borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  categoryOptionActive: { backgroundColor: '#2d6a4f', borderColor: '#2d6a4f' },
  categoryOptionText: { fontSize: 12, color: '#555', fontWeight: '500' },
  categoryOptionTextActive: { color: '#fff' },
  categoryOptionClear: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 14, borderWidth: 1, borderColor: '#fcc', backgroundColor: '#fff5f5',
  },
  categoryOptionClearText: { fontSize: 12, color: '#e74c3c' },
  confirmBtn: {
    backgroundColor: '#2d6a4f', borderRadius: 24, paddingVertical: 16,
    alignItems: 'center', marginTop: 16, marginBottom: 12,
  },
  confirmBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelBtnText: { color: '#888', fontSize: 15 },
});
