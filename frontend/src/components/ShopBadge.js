import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SHOP_COLOURS = {
  tesco: '#00539f',
  aldi: '#00529b',
  lidl: '#0050aa',
  sainsbury: '#f06c00',
  asda: '#78be20',
  morrisons: '#ffd700',
  waitrose: '#6db33f',
  coop: '#00b5e2',
};

function getColour(shopName) {
  const key = (shopName || '').toLowerCase().split(' ')[0];
  return SHOP_COLOURS[key] || '#2d6a4f';
}

export default function ShopBadge({ shopName, style }) {
  const bg = getColour(shopName);
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={styles.text}>{shopName || 'Unknown'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
