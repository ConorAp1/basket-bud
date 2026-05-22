import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CATEGORY_COLOURS = {
  Dairy: '#4a90d9',
  Produce: '#52c41a',
  Bakery: '#fa8c16',
  Meat: '#eb2f96',
  Seafood: '#1890ff',
  Frozen: '#13c2c2',
  Drinks: '#722ed1',
  Snacks: '#faad14',
  Household: '#8c8c8c',
  Uncategorised: '#bfbfbf',
};

export default function CategoryTag({ category }) {
  const colour = CATEGORY_COLOURS[category] || '#8c8c8c';
  return (
    <View style={[styles.tag, { backgroundColor: colour + '22', borderColor: colour }]}>
      <Text style={[styles.text, { color: colour }]}>{category || 'Uncategorised'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 11, fontWeight: '600' },
});
