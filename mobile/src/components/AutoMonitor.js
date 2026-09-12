import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';
import { gatePrediction } from '../utils/predictionGate';
import { Play, Square, Heart, Wind, Thermometer, Settings, ShieldCheck, ShieldAlert, AlertCircle, SignalHigh, SignalMedium, SignalLow, Activity } from './Icons';
import { COLORS, SHADOWS, RADIUS, SPACING, STATUS_COLORS } from '../constants/theme';

function generateVitals(profile, prevVitals, readingNum) {
  const { scenario } = profile;

  const scenarios = {
    healthy: { hr: [68, 82], spo2: [96, 99], temp: [36.3, 37.0] },
    mild_fever: { hr: [85, 100], spo2: [95, 98], temp: [37.5, 38.5] },
    high_fever: { hr: [100, 120], spo2: [93, 96], temp: [38.5, 39.8] },
    respiratory: { hr: [95, 125], spo2: [86, 93], temp: [37.0, 38.5] },
    cardiac: { hr: [45, 65], spo2: [90, 95], temp: [36.5, 37.2] },
    deteriorating: { hr: [75, 90], spo2: [94, 98], temp: [36.5, 37.5] },
    sepsis: { hr: [105, 130], spo2: [91, 96], temp: [38.5, 40.2] },
    recovering: { hr: [90, 105], spo2: [93, 96], temp: [37.5, 38.2] },
  };

  let base = scenarios[scenario] || scenarios.healthy;

  if (scenario === 'deteriorating') {
    const progress = Math.min(readingNum / 15, 1);
    base = {
      hr: [75 + progress * 35, 90 + progress * 40],
      spo2: [94 - progress * 8, 98 - progress * 6],
      temp: [36.5 + progress * 2, 37.5 + progress * 2.5],
    };
  }

  if (scenario === 'recovering') {
    const progress = Math.min(readingNum / 15, 1);
    base = {
      hr: [105 - progress * 25, 115 - progress * 25],
      spo2: [92 + progress * 5, 95 + progress * 4],
      temp: [38.5 - progress * 1.5, 39.0 - progress * 1.5],
    };
  }

  const noise = () => (Math.random() - 0.5) * 2;
  const drift = 0.7;
  const randInRange = (lo, hi) => lo + Math.random() * (hi - lo);

  let hr, spo2, temp;
  if (prevVitals) {
    hr = Math.round(prevVitals.hr * drift + randInRange(base.hr[0], base.hr[1]) * (1 - drift) + noise() * 2);
    spo2 = Math.round((prevVitals.spo2 * drift + randInRange(base.spo2[0], base.spo2[1]) * (1 - drift) + noise() * 0.5) * 10) / 10;
    temp = Math.round((prevVitals.temp * drift + randInRange(base.temp[0], base.temp[1]) * (1 - drift) + noise() * 0.1) * 10) / 10;
  } else {
    hr = Math.round(randInRange(base.hr[0], base.hr[1]));
    spo2 = Math.round(randInRange(base.spo2[0], base.spo2[1]) * 10) / 10;
    temp = Math.round(randInRange(base.temp[0], base.temp[1]) * 10) / 10;
  }

  hr = Math.max(30, Math.min(200, hr));
  spo2 = Math.max(75, Math.min(100, spo2));
  temp = Math.max(34, Math.min(41, temp));

  return { hr, spo2, temp };
}

const SCENARIOS = [
  { value: 'healthy', label: 'Routine Checkup' },
  { value: 'mild_fever', label: 'Mild Fever' },
  { value: 'high_fever', label: 'High Fever / Infection' },
  { value: 'respiratory', label: 'Respiratory Distress' },
  { value: 'cardiac', label: 'Cardiac Irregularity' },
  { value: 'deteriorating', label: 'Gradual Deterioration' },
  { value: 'sepsis', label: 'Sepsis Pattern' },
  { value: 'recovering', label: 'Post-Treatment Recovery' },
];

export default function AutoMonitor({ patientId, patient, onNewReading }) {
  const { user } = useAuth();
  const role = user?.role || 'doctor';

  const [running, setRunning] = useState(false);
  const [scenario, setScenario] = useState('healthy');
  const [intervalSec, setIntervalSec] = useState(3);
  const [readings, setReadings] = useState([]);
  const [latest, setLatest] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [display, setDisplay] = useState(null);

  const intervalRef = useRef(null);
  const prevVitalsRef = useRef(null);
  const readingNumRef = useRef(0);

  const takeReading = useCallback(async () => {
    const vitals = generateVitals(
      { age: patient?.age || 40, scenario },
      prevVitalsRef.current,
      readingNumRef.current
    );
    prevVitalsRef.current = vitals;
    readingNumRef.current++;

    setLatest(vitals);
    setProcessing(true);

    try {
      const result = await api.recordVitals(patientId, {
        heartRate: vitals.hr,
        spO2: vitals.spo2,
        temperature: vitals.temp,
      });

      setReadings((prev) => {
        const newEntry = {
          ...vitals,
          prediction: result.prediction?.prediction,
          riskScore: result.prediction?.risk?.numeric_score,
          riskCategory: result.prediction?.risk?.category,
          confidence: result.prediction?.confidence,
          mews: result.prediction?.derived_vitals?.mews,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };
        const updated = [...prev.slice(-29), newEntry];
        const gated = gatePrediction(result.prediction, updated, role);
        setDisplay(gated);
        return updated;
      });

      onNewReading?.();
    } catch (err) {
      console.error('Failed to record:', err);
    } finally {
      setProcessing(false);
    }
  }, [patientId, patient, scenario, onNewReading, role]);

  const start = () => {
    setRunning(true);
    setShowSettings(false);
    readingNumRef.current = 0;
    prevVitalsRef.current = null;
    setReadings([]);
    takeReading();
    intervalRef.current = setInterval(takeReading, intervalSec * 1000);
  };

  const stop = () => {
    setRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Heart size={18} color={running ? COLORS.red500 : COLORS.slate400} />
          <Text style={styles.cardTitle}>Continuous Monitoring</Text>
        </View>
        <View style={styles.headerRight}>
          {running ? (
            <View style={styles.recordingPill}>
              <View style={styles.recordDot} />
              <Text style={styles.recordText}>Recording — {readings.length}</Text>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setShowSettings((s) => !s)} style={styles.settingsBtn}>
              <Settings size={18} color={COLORS.slate500} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Settings section */}
      {showSettings && !running && (
        <View style={styles.settingsBox}>
          <Text style={styles.sectionLabel}>Clinical Scenario Simulation</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scenarioScroll}>
            {SCENARIOS.map((s) => (
              <TouchableOpacity
                key={s.value}
                style={[styles.scenarioPill, scenario === s.value && styles.scenarioPillActive]}
                onPress={() => setScenario(s.value)}
              >
                <Text style={[styles.scenarioText, scenario === s.value && styles.scenarioTextActive]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.sectionLabel, { marginTop: SPACING.md }]}>
            Sampling Interval: {intervalSec}s
          </Text>
          <View style={styles.intervalButtons}>
            {[2, 3, 5, 10].map((sec) => (
              <TouchableOpacity
                key={sec}
                style={[styles.intervalBtn, intervalSec === sec && styles.intervalBtnActive]}
                onPress={() => setIntervalSec(sec)}
              >
                <Text style={[styles.intervalBtnText, intervalSec === sec && styles.intervalBtnTextActive]}>
                  {sec}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Start / Stop Button */}
      <View style={styles.actionRow}>
        {!running ? (
          <TouchableOpacity style={styles.btnStart} onPress={start}>
            <Play size={16} color={COLORS.white} />
            <Text style={styles.btnActionText}>Start Monitoring</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.btnStop} onPress={stop}>
            <Square size={16} color={COLORS.white} />
            <Text style={styles.btnActionText}>Stop Simulator</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Live vitals summary */}
      {latest && (
        <View style={styles.vitalsSection}>
          <View style={styles.tileGrid}>
            <View style={[styles.vitalTile, { backgroundColor: COLORS.red50, borderColor: COLORS.red100 }]}>
              <Heart size={18} color={COLORS.red500} />
              <Text style={[styles.vitalValue, { color: COLORS.red600 }]}>{latest.hr}</Text>
              <Text style={[styles.vitalLabel, { color: COLORS.red500 }]}>BPM</Text>
            </View>
            <View style={[styles.vitalTile, { backgroundColor: COLORS.blue50, borderColor: COLORS.blue100 }]}>
              <Wind size={18} color={COLORS.blue500} />
              <Text style={[styles.vitalValue, { color: COLORS.blue600 }]}>{latest.spo2}</Text>
              <Text style={[styles.vitalLabel, { color: COLORS.blue500 }]}>SpO2 %</Text>
            </View>
            <View style={[styles.vitalTile, { backgroundColor: COLORS.orange50, borderColor: COLORS.orange100 }]}>
              <Thermometer size={18} color={COLORS.orange500} />
              <Text style={[styles.vitalValue, { color: COLORS.orange600 }]}>{latest.temp}</Text>
              <Text style={[styles.vitalLabel, { color: COLORS.orange500 }]}>°C</Text>
            </View>
          </View>

          {/* Gated Prediction */}
          {processing && (
            <View style={styles.processingBox}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.processingText}>Evaluating vitals against clinical rules...</Text>
            </View>
          )}

          {display && !processing && (
            <View
              style={[
                styles.predictionCard,
                {
                  backgroundColor: STATUS_COLORS[display.status]?.bg || COLORS.emerald50,
                  borderColor: STATUS_COLORS[display.status]?.border || COLORS.emerald100,
                },
              ]}
            >
              <View style={styles.predTop}>
                <View style={styles.predLeft}>
                  <Text style={styles.predSub}>HEALTH STATUS</Text>
                  <Text style={[styles.predMain, { color: STATUS_COLORS[display.status]?.text || COLORS.emerald600 }]}>
                    {display.label}
                  </Text>
                  <Text style={styles.predMsg}>{display.message}</Text>
                </View>
                {display.status === 'critical' ? (
                  <ShieldAlert size={32} color={COLORS.red500} />
                ) : display.status === 'stable' ? (
                  <ShieldCheck size={32} color={COLORS.emerald500} />
                ) : (
                  <AlertCircle size={32} color={COLORS.amber500} />
                )}
              </View>
            </View>
          )}

          {/* Rolling table */}
          {readings.length > 0 && (
            <View style={styles.tableCard}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 2 }]}>Time</Text>
                <Text style={[styles.th, { flex: 1.2, textAlign: 'center' }]}>HR</Text>
                <Text style={[styles.th, { flex: 1.2, textAlign: 'center' }]}>SpO2</Text>
                <Text style={[styles.th, { flex: 1.2, textAlign: 'center' }]}>Temp</Text>
                <Text style={[styles.th, { flex: 2, textAlign: 'right' }]}>Prediction</Text>
              </View>
              {readings
                .slice(-5)
                .reverse()
                .map((r, i) => (
                  <View key={i} style={styles.tableRow}>
                    <Text style={[styles.td, { flex: 2 }]}>{r.time}</Text>
                    <Text style={[styles.td, { flex: 1.2, textAlign: 'center', fontWeight: '700' }]}>{r.hr}</Text>
                    <Text style={[styles.td, { flex: 1.2, textAlign: 'center', fontWeight: '700' }]}>{r.spo2}</Text>
                    <Text style={[styles.td, { flex: 1.2, textAlign: 'center', fontWeight: '700' }]}>{r.temp}</Text>
                    <Text style={[styles.td, { flex: 2, textAlign: 'right', textTransform: 'capitalize', color: COLORS.primary }]}>
                      {r.prediction?.replace(/_/g, ' ') || 'Normal'}
                    </Text>
                  </View>
                ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    ...SHADOWS.sm,
    gap: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.slate800,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.emerald50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  recordDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.emerald500,
  },
  recordText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.emerald600,
  },
  settingsBtn: {
    padding: 6,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.slate100,
  },
  settingsBox: {
    backgroundColor: COLORS.slate50,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.slate700,
    marginBottom: SPACING.xs,
  },
  scenarioScroll: {
    flexDirection: 'row',
  },
  scenarioPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    marginRight: 6,
  },
  scenarioPillActive: {
    borderColor: COLORS.primaryLight,
    backgroundColor: COLORS.primary50,
  },
  scenarioText: {
    fontSize: 12,
    color: COLORS.slate600,
    fontWeight: '500',
  },
  scenarioTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  intervalButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: 4,
  },
  intervalBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  intervalBtnActive: {
    backgroundColor: COLORS.primary50,
    borderColor: COLORS.primaryLight,
  },
  intervalBtnText: {
    fontSize: 12,
    color: COLORS.slate600,
    fontWeight: '600',
  },
  intervalBtnTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
  },
  btnStart: {
    flex: 1,
    backgroundColor: COLORS.emerald600,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.xs + 2,
  },
  btnStop: {
    flex: 1,
    backgroundColor: COLORS.red600,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.xs + 2,
  },
  btnActionText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  vitalsSection: {
    gap: SPACING.md,
  },
  tileGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  vitalTile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
  },
  vitalValue: {
    fontSize: 22,
    fontWeight: '800',
    marginVertical: 2,
  },
  vitalLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  processingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.slate50,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  processingText: {
    fontSize: 11,
    color: COLORS.slate500,
  },
  predictionCard: {
    borderWidth: 2,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  predTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  predLeft: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  predSub: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.slate500,
    letterSpacing: 0.5,
  },
  predMain: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  predMsg: {
    fontSize: 12,
    color: COLORS.slate700,
    marginTop: 2,
    lineHeight: 16,
  },
  tableCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.slate100,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.slate600,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate100,
    alignItems: 'center',
  },
  td: {
    fontSize: 11,
    color: COLORS.slate700,
  },
});
