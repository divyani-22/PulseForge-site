import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle, AlertCircle, Info } from './Icons';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

export default function AlertsPanel({ alerts }) {
  if (!alerts || alerts.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>
          No active alerts. All vitals within acceptable parameters.
        </Text>
      </View>
    );
  }

  const getAlertStyle = (level) => {
    switch (level) {
      case 'critical':
        return {
          bg: COLORS.red50,
          border: COLORS.red100,
          text: COLORS.red600,
          icon: <AlertTriangle size={18} color={COLORS.red600} />,
        };
      case 'warning':
        return {
          bg: COLORS.amber50,
          border: COLORS.amber100,
          text: COLORS.amber600,
          icon: <AlertCircle size={18} color={COLORS.amber600} />,
        };
      default:
        return {
          bg: COLORS.blue50,
          border: COLORS.blue100,
          text: COLORS.blue600,
          icon: <Info size={18} color={COLORS.blue600} />,
        };
    }
  };

  return (
    <View style={styles.container}>
      {alerts.map((alert, idx) => {
        const style = getAlertStyle(alert.level);
        return (
          <View key={idx} style={[styles.alertCard, { backgroundColor: style.bg, borderColor: style.border }]}>
            <View style={styles.iconContainer}>{style.icon}</View>
            <View style={styles.contentContainer}>
              <Text style={[styles.alertLevel, { color: style.text }]}>
                {alert.level || 'INFO'}
              </Text>
              <Text style={styles.alertMessage}>{alert.message}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  emptyCard: {
    backgroundColor: COLORS.emerald50,
    borderWidth: 1,
    borderColor: COLORS.emerald100,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  emptyText: {
    color: COLORS.emerald600,
    fontSize: 13,
    lineHeight: 18,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  iconContainer: {
    marginTop: 2,
  },
  contentContainer: {
    flex: 1,
  },
  alertLevel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 13,
    color: COLORS.slate700,
    lineHeight: 17,
  },
});
