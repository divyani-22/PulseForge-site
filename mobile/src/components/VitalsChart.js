import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, Polyline, Circle, Rect, Text as SvgText, G } from 'react-native-svg';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = Math.min(SCREEN_WIDTH - 48, 480);
const CHART_HEIGHT = 160;
const PADDING = 28;

function SimpleLineChart({ data, seriesA, seriesB, title }) {
  if (!data || data.length === 0) return null;

  const validData = data.slice(-15);
  const count = validData.length;

  const minA = Math.min(...validData.map((d) => d[seriesA.key]));
  const maxA = Math.max(...validData.map((d) => d[seriesA.key])) || minA + 1;
  const rangeA = maxA - minA || 1;

  const minB = Math.min(...validData.map((d) => d[seriesB.key]));
  const maxB = Math.max(...validData.map((d) => d[seriesB.key])) || minB + 1;
  const rangeB = maxB - minB || 1;

  const pointsA = validData.map((d, i) => {
    const x = PADDING + (i / Math.max(count - 1, 1)) * (CHART_WIDTH - 2 * PADDING);
    const y = CHART_HEIGHT - PADDING - ((d[seriesA.key] - minA) / rangeA) * (CHART_HEIGHT - 2 * PADDING);
    return { x, y, val: d[seriesA.key] };
  });

  const pointsB = validData.map((d, i) => {
    const x = PADDING + (i / Math.max(count - 1, 1)) * (CHART_WIDTH - 2 * PADDING);
    const y = CHART_HEIGHT - PADDING - ((d[seriesB.key] - minB) / rangeB) * (CHART_HEIGHT - 2 * PADDING);
    return { x, y, val: d[seriesB.key] };
  });

  const polylineStrA = pointsA.map((p) => `${p.x},${p.y}`).join(' ');
  const polylineStrB = pointsB.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{title}</Text>

      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: seriesA.color }]} />
          <Text style={styles.legendText}>{seriesA.label}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: seriesB.color }]} />
          <Text style={styles.legendText}>{seriesB.label}</Text>
        </View>
      </View>

      <Svg width={CHART_WIDTH} height={CHART_HEIGHT} style={styles.svg}>
        {/* Grid lines */}
        <Line x1={PADDING} y1={PADDING} x2={CHART_WIDTH - PADDING} y2={PADDING} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4,4" />
        <Line x1={PADDING} y1={CHART_HEIGHT / 2} x2={CHART_WIDTH - PADDING} y2={CHART_HEIGHT / 2} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4,4" />
        <Line x1={PADDING} y1={CHART_HEIGHT - PADDING} x2={CHART_WIDTH - PADDING} y2={CHART_HEIGHT - PADDING} stroke="#e2e8f0" strokeWidth="1" />

        {/* Polylines */}
        <Polyline points={polylineStrA} fill="none" stroke={seriesA.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <Polyline points={polylineStrB} fill="none" stroke={seriesB.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots */}
        {pointsA.map((p, i) => (
          <Circle key={`a-${i}`} cx={p.x} cy={p.y} r="3.5" fill={seriesA.color} stroke="#ffffff" strokeWidth="1.5" />
        ))}
        {pointsB.map((p, i) => (
          <Circle key={`b-${i}`} cx={p.x} cy={p.y} r="3.5" fill={seriesB.color} stroke="#ffffff" strokeWidth="1.5" />
        ))}
      </Svg>

      {/* Latest values row */}
      <View style={styles.statsFooter}>
        <Text style={[styles.statBadge, { color: seriesA.color }]}>
          Latest {seriesA.label}: {validData[validData.length - 1][seriesA.key]}
        </Text>
        <Text style={[styles.statBadge, { color: seriesB.color }]}>
          Latest {seriesB.label}: {validData[validData.length - 1][seriesB.key]}
        </Text>
      </View>
    </View>
  );
}

export default function VitalsChart({ vitals }) {
  if (!vitals || vitals.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No vitals data to display</Text>
      </View>
    );
  }

  const chartData = vitals.map((v, idx) => ({
    idx: idx + 1,
    heartRate: Number(v.heart_rate || v.heartRate || 0),
    spO2: Number(v.spo2 || v.spO2 || 0),
    temperature: Number(v.temperature || 0),
    news2: Number(v.news2_score || 0),
  }));

  return (
    <View style={styles.container}>
      <SimpleLineChart
        data={chartData}
        title="Heart Rate & SpO2 Trend"
        seriesA={{ key: 'heartRate', label: 'Heart Rate (BPM)', color: '#ef4444' }}
        seriesB={{ key: 'spO2', label: 'SpO2 (%)', color: '#3b82f6' }}
      />
      <SimpleLineChart
        data={chartData}
        title="Temperature & NEWS2 Score"
        seriesA={{ key: 'temperature', label: 'Temp (°C)', color: '#f97316' }}
        seriesB={{ key: 'news2', label: 'NEWS2 Score', color: '#8b5cf6' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },
  chartCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.slate800,
    marginBottom: SPACING.xs,
  },
  legendContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: COLORS.slate500,
    fontWeight: '600',
  },
  svg: {
    alignSelf: 'center',
    marginVertical: SPACING.xs,
  },
  statsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate100,
  },
  statBadge: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.slate400,
    fontSize: 13,
  },
});
