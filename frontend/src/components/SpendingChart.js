import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText, G } from 'react-native-svg';

const MARGIN_LEFT = 112;
const MARGIN_RIGHT = 60;
const MARGIN_V = 8;
const BAR_HEIGHT = 22;
const BAR_GAP = 8;

export default function SpendingChart({ data, title, labelKey, valueKey, color = '#2d6a4f' }) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No data yet</Text>
      </View>
    );
  }

  const resolvedLabelKey = labelKey || (data[0]?.shop_name !== undefined ? 'shop_name' : 'category');
  const resolvedValueKey = valueKey || 'total_spend';

  const screenWidth = Dimensions.get('window').width - 32;
  const plotWidth = screenWidth - MARGIN_LEFT - MARGIN_RIGHT;
  const svgHeight = data.length * (BAR_HEIGHT + BAR_GAP) + MARGIN_V * 2;
  const maxVal = Math.max(...data.map((d) => parseFloat(d[resolvedValueKey] || 0)));

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <Svg width={screenWidth} height={svgHeight}>
        {data.map((item, idx) => {
          const value = parseFloat(item[resolvedValueKey] || 0);
          const rawLabel = String(item[resolvedLabelKey] || `Item ${idx + 1}`);
          const label = rawLabel.length > 15 ? rawLabel.slice(0, 14) + '…' : rawLabel;
          const barW = maxVal > 0 ? Math.max(2, (value / maxVal) * plotWidth) : 2;
          const y = MARGIN_V + idx * (BAR_HEIGHT + BAR_GAP);
          const cy = y + BAR_HEIGHT / 2 + 4;

          return (
            <G key={rawLabel + idx}>
              <SvgText
                x={MARGIN_LEFT - 6}
                y={cy}
                textAnchor="end"
                fontSize={12}
                fill="#555"
              >
                {label}
              </SvgText>
              <Rect
                x={MARGIN_LEFT}
                y={y}
                width={plotWidth}
                height={BAR_HEIGHT}
                rx={5}
                fill="#f0f0f0"
              />
              <Rect
                x={MARGIN_LEFT}
                y={y}
                width={barW}
                height={BAR_HEIGHT}
                rx={5}
                fill={color}
              />
              <SvgText
                x={MARGIN_LEFT + barW + 5}
                y={cy}
                fontSize={11}
                fill="#333"
                fontWeight="600"
              >
                {`£${value.toFixed(2)}`}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 10 },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#aaa', fontSize: 14 },
});
