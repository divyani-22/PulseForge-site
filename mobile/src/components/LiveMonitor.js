import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { listenToDeviceVitals } from '../firebase';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';
import { gatePrediction } from '../utils/predictionGate';
import { Radio, Heart, Wind, Thermometer, Link2, SignalHigh, SignalMedium, SignalLow, ShieldCheck, ShieldAlert, AlertCircle, Activity } from './Icons';
import { COLORS, SHADOWS, RADIUS, SPACING, STATUS_COLORS } from '../constants/theme';

export default function LiveMonitor({ patientId, deviceId, onNewReading }) {
  const { user } = useAuth();
  const role = user?.role || 'doctor';

  const [connected, setConnected] = useState(false);
  const [readings, setReadings] = useState([]);
  const [latest, setLatest] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [deviceInput, setDeviceInput] = useState('');
  const [linking, setLinking] = useState(false);
  const [history, setHistory] = useState([]);
  const [display, setDisplay] = useState(null);
  const lastProcessedRef = useRef(null);

  const handleLinkDevice = async () => {
    if (!deviceInput.trim()) return;
    setLinking(true);
    setError('');
    try {
      // In mobile app, we can update patient device_id or record directly
      setLinking(false);
      onNewReading?.();
    } catch (err) {
      setError('Failed to link device: ' + err.message);
      setLinking(false);
    }
  };

  useEffect(() => {
    if (!deviceId) return;
    setConnected(true);
    setError('');

    const unsubscribe = listenToDeviceVitals(deviceId, async (newReadings) => {
      setReadings(newReadings);
      if (!newReadings || newReadings.length === 0) return;

      const lastReading = newReadings[newReadings.length - 1];
      setLatest(lastReading);

      if (lastReading.firebaseKey !== lastProcessedRef.current && patientId) {
        lastProcessedRef.current = lastReading.firebaseKey;
        setProcessing(true);
        try {
          const result = await api.recordVitals(patientId, {
            heartRate: lastReading.heartRate,
            spO2: lastReading.spO2,
            temperature: lastReading.temperature,
          });

          setHistory((prev) => {
            const entry = {
              hr: lastReading.heartRate,
              spo2: lastReading.spO2,
              temp: lastReading.temperature,
              prediction: result.prediction?.prediction,
              riskCategory: result.prediction?.risk?.category,
              confidence: result.prediction?.confidence,
              raw: result.prediction,
            };
            const updated = [...prev, entry].slice(-20);
            const gated = gatePrediction(result.prediction, updated, role);
            setDisplay(gated);
            return updated;
          });

          onNewReading?.(result);
          setError('');
        } catch (err) {
          setError(err.message);
        } finally {
          setProcessing(false);
        }
      }
    });

    return () => {
      unsubscribe();
      setConnected(false);
    };
  }, [deviceId, patientId, onNewReading, role]);

  // If no device is linked
  if (!deviceId) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Link2 size={20} color={COLORS.primary} />
          <Text style={styles.cardTitle}>Link ESP32 Device</Text>
        </View>
        <Text style={styles.cardDesc}>
          Enter the Device ID configured in your Arduino sketch to link this patient with hardware vitals.
        </Text>
        <View style={styles.linkRow}>
          <TextInput
            placeholder="Enter hardware device ID"
            placeholderTextColor={COLORS.slate400}
            style={styles.inputMono}
            value={deviceInput}
            onChangeText={setDeviceInput}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={handleLinkDevice}
            disabled={linking || !deviceInput.trim()}
          >
            {linking ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.btnPrimaryText}>Link</Text>
            )}
          </TouchableOpacity>
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  }

  const SignalBadge = ({ quality }) => {
    if (quality === 'good') {
      return (
        <View style={styles.signalRow}>
          <SignalHigh size={16} color={COLORS.emerald500} />
          <Text style={[styles.signalText, { color: COLORS.emerald600 }]}>Signal: Good</Text>
        </View>
      );
    }
    if (quality === 'fair') {
      return (
        <View style={styles.signalRow}>
          <SignalMedium size={16} color={COLORS.amber500} />
          <Text style={[styles.signalText, { color: COLORS.amber600 }]}>Signal: Fair</Text>
        </View>
      );
    }
    return (
      <View style={styles.signalRow}>
        <SignalLow size={16} color={COLORS.red500} />
        <Text style={[styles.signalText, { color: COLORS.red600 }]}>Signal: Poor</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.statusHeader}>
          <View style={styles.statusTitleGroup}>
            <Radio size={18} color={connected && latest ? COLORS.emerald500 : COLORS.slate400} />
            <Text style={styles.cardTitle}>Live ESP32 Device</Text>
          </View>
          <View style={styles.devicePill}>
            <View style={[styles.pulseDot, connected && latest && styles.pulseDotActive]} />
            <Text style={styles.deviceIdText}>{deviceId}</Text>
          </View>
        </View>

        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

        {!latest ? (
          <View style={styles.waitingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.spinner} />
            <Text style={styles.waitingTitle}>Waiting for sensor data...</Text>
            <Text style={styles.waitingSub}>
              Power on your ESP32 and place finger on the MAX30102 sensor.
            </Text>
          </View>
        ) : (
          <View style={styles.vitalsSection}>
            {/* 3 Live Vital Tiles */}
            <View style={styles.tileGrid}>
              <View style={[styles.vitalTile, { backgroundColor: COLORS.red50, borderColor: COLORS.red100 }]}>
                <Heart size={20} color={COLORS.red500} />
                <Text style={[styles.vitalValue, { color: COLORS.red600 }]}>{latest.heartRate}</Text>
                <Text style={[styles.vitalLabel, { color: COLORS.red500 }]}>BPM</Text>
              </View>

              <View style={[styles.vitalTile, { backgroundColor: COLORS.blue50, borderColor: COLORS.blue100 }]}>
                <Wind size={20} color={COLORS.blue500} />
                <Text style={[styles.vitalValue, { color: COLORS.blue600 }]}>{latest.spO2}</Text>
                <Text style={[styles.vitalLabel, { color: COLORS.blue500 }]}>SpO2 %</Text>
              </View>

              <View style={[styles.vitalTile, { backgroundColor: COLORS.orange50, borderColor: COLORS.orange100 }]}>
                <Thermometer size={20} color={COLORS.orange500} />
                <Text style={[styles.vitalValue, { color: COLORS.orange600 }]}>
                  {Number(latest.temperature).toFixed(1)}
                </Text>
                <Text style={[styles.vitalLabel, { color: COLORS.orange500 }]}>°C</Text>
              </View>
            </View>

            {/* Future Scope: ECG & BP */}
            <View style={styles.futureGrid}>
              <View style={styles.futureCard}>
                <View style={styles.futureLeft}>
                  <Activity size={16} color={COLORS.slate400} />
                  <Text style={styles.futureText}>ECG</Text>
                </View>
                <Text style={styles.comingSoonTag}>Coming Soon</Text>
              </View>
              <View style={styles.futureCard}>
                <View style={styles.futureLeft}>
                  <Activity size={16} color={COLORS.slate400} />
                  <Text style={styles.futureText}>Blood Pressure</Text>
                </View>
                <Text style={styles.comingSoonTag}>Coming Soon</Text>
              </View>
            </View>

            {/* Signal Quality */}
            {display?.signalQuality && (
              <View style={styles.signalContainer}>
                <SignalBadge quality={display.signalQuality.quality} />
                {display.signalQuality.quality !== 'good' && (
                  <Text style={styles.signalReason}>{display.signalQuality.reason}</Text>
                )}
              </View>
            )}

            {processing && (
              <View style={styles.processingRow}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.processingText}>Running AI clinical analysis...</Text>
              </View>
            )}

            {/* Gated Clinical Prediction Display */}
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
                  <View style={styles.predContent}>
                    <Text style={styles.predSub}>HEALTH STATUS</Text>
                    <Text
                      style={[
                        styles.predMain,
                        { color: STATUS_COLORS[display.status]?.text || COLORS.emerald600 },
                      ]}
                    >
                      {display.label}
                    </Text>
                    <Text style={styles.predMsg}>{display.message}</Text>
                  </View>
                  {display.status === 'critical' ? (
                    <ShieldAlert size={36} color={COLORS.red500} />
                  ) : display.status === 'stable' ? (
                    <ShieldCheck size={36} color={COLORS.emerald500} />
                  ) : (
                    <AlertCircle size={36} color={COLORS.amber500} />
                  )}
                </View>

                {/* Doctor details */}
                {display.showDetails && display.rawPrediction && (
                  <View style={styles.doctorDetailRow}>
                    <Text style={styles.doctorDetailText}>
                      Raw ML: {display.rawPrediction.prediction} ({(display.rawPrediction.confidence * 100).toFixed(1)}%) | Risk: {display.rawPrediction.risk?.numeric_score}/100 | MEWS: {display.rawPrediction.derived_vitals?.mews}
                      {display.unconfirmed ? ' [Unconfirmed]' : ''}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <Text style={styles.readingsCountText}>
              {readings.length} readings from device {history.length > 0 ? `| ${history.length} analyzed` : ''}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.slate800,
  },
  cardDesc: {
    fontSize: 12,
    color: COLORS.slate500,
    marginBottom: SPACING.md,
    lineHeight: 16,
  },
  linkRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  inputMono: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    color: COLORS.slate800,
  },
  btnPrimary: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
  errorText: {
    color: COLORS.red600,
    fontSize: 11,
    marginTop: SPACING.xs,
  },
  errorBanner: {
    backgroundColor: COLORS.red50,
    color: COLORS.red600,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    fontSize: 12,
    marginBottom: SPACING.md,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  statusTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  devicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.slate100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.slate300,
  },
  pulseDotActive: {
    backgroundColor: COLORS.emerald500,
  },
  deviceIdText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
    color: COLORS.slate600,
  },
  waitingContainer: {
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
  },
  spinner: {
    marginBottom: SPACING.md,
  },
  waitingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.slate700,
  },
  waitingSub: {
    fontSize: 12,
    color: COLORS.slate400,
    textAlign: 'center',
    marginTop: 4,
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
    fontSize: 24,
    fontWeight: '800',
    marginVertical: 2,
  },
  vitalLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  futureGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  futureCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.slate50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 2,
    opacity: 0.7,
  },
  futureLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  futureText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.slate600,
  },
  comingSoonTag: {
    fontSize: 9,
    fontWeight: '700',
    backgroundColor: COLORS.slate200,
    color: COLORS.slate600,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  signalContainer: {
    backgroundColor: COLORS.slate50,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  signalText: {
    fontSize: 12,
    fontWeight: '700',
  },
  signalReason: {
    fontSize: 11,
    color: COLORS.slate500,
    marginTop: 2,
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.slate50,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  processingText: {
    fontSize: 12,
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
    alignItems: 'flex-start',
  },
  predContent: {
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
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  predMsg: {
    fontSize: 12,
    color: COLORS.slate700,
    marginTop: 4,
    lineHeight: 16,
  },
  doctorDetailRow: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  doctorDetailText: {
    fontSize: 10,
    color: COLORS.slate600,
    fontWeight: '600',
  },
  readingsCountText: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.slate400,
  },
});
