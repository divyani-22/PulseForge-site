import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { api } from '../api';
import VitalsChart from '../components/VitalsChart';
import AutoMonitor from '../components/AutoMonitor';
import LiveMonitor from '../components/LiveMonitor';
import WifiManager from '../components/WifiManager';
import AIChat from '../components/AIChat';
import { ArrowLeft, FileText, User, Radio, HeartPulse, TrendingUp, MessageCircle } from '../components/Icons';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../constants/theme';

export default function PatientDetail({ routeParams, onNavigate }) {
  const patientId = routeParams?.patientId;
  const [patient, setPatient] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [trends, setTrends] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('live');

  const loadPatient = useCallback(async () => {
    if (!patientId) return;
    try {
      const [p, v] = await Promise.all([api.getPatient(patientId), api.getVitals(patientId)]);
      setPatient(p);
      setVitals(v || []);
      if (v && v.length >= 2) {
        try {
          const tr = await api.getTrends(patientId);
          setTrends(tr);
        } catch {}
      }
      if (v && v.length > 0) {
        try {
          const pr = await api.predict(patientId);
          setPrediction(pr);
        } catch {}
      }
    } catch (err) {
      console.error('Error loading patient detail:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadPatient();
  }, [loadPatient]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading patient record...</Text>
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Patient not found</Text>
        <TouchableOpacity style={styles.btnBack} onPress={() => onNavigate('Dashboard')}>
          <Text style={styles.btnBackText}>Return to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const lastVital = vitals.length > 0 ? vitals[vitals.length - 1] : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Top Action Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.btnIconBack} onPress={() => onNavigate('Dashboard')}>
          <ArrowLeft size={20} color={COLORS.slate700} />
        </TouchableOpacity>
        <View style={styles.headerTitleGroup}>
          <View style={styles.patientNameRow}>
            <User size={20} color={COLORS.blue600} />
            <Text style={styles.patientName}>{patient.name}</Text>
          </View>
          <Text style={styles.patientMeta}>
            {patient.age}y {patient.gender === 'M' ? 'Male' : 'Female'} | BMI: {patient.bmi}
            {patient.comorbidities ? ` | ${patient.comorbidities}` : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.btnReport}
          onPress={() => onNavigate('ReportView', { patientId })}
        >
          <FileText size={16} color={COLORS.white} />
          <Text style={styles.btnReportText}>Report</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats Grid */}
      {lastVital && (
        <View style={styles.quickStatsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statPillLabel}>HR</Text>
            <Text style={styles.statPillVal}>{lastVital.heart_rate || lastVital.heartRate} BPM</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statPillLabel}>SpO2</Text>
            <Text style={styles.statPillVal}>{lastVital.spo2 || lastVital.spO2}%</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statPillLabel}>Temp</Text>
            <Text style={styles.statPillVal}>{Number(lastVital.temperature).toFixed(1)}°C</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statPillLabel}>Risk</Text>
            <Text
              style={[
                styles.statPillVal,
                { color: (lastVital.news2_score || 0) >= 5 ? COLORS.red600 : COLORS.emerald600 },
              ]}
            >
              {lastVital.news2_score || 0}/100
            </Text>
          </View>
        </View>
      )}

      {/* Proxy CVD Risk */}
      {trends?.cvd_risk && (
        <View style={styles.cvdCard}>
          <Text style={styles.cvdTitle}>
            Proxy CVD Risk Level:{' '}
            <Text style={{ color: trends.cvd_risk.risk_level === 'High' ? COLORS.red600 : COLORS.emerald600 }}>
              {trends.cvd_risk.risk_level}
            </Text>
          </Text>
          <Text style={styles.cvdSub}>{trends.cvd_risk.disclaimer}</Text>
        </View>
      )}

      {/* 4 Interactive Sub-Tabs */}
      <View style={styles.tabBar}>
        {[
          { key: 'live', label: 'Live Device', icon: Radio },
          { key: 'continuous', label: 'Continuous', icon: HeartPulse },
          { key: 'trends', label: 'Trends', icon: TrendingUp },
          { key: 'assistant', label: 'Assistant', icon: MessageCircle },
        ].map(({ key, label, icon: Icon }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tabBtn, activeTab === key && styles.tabBtnActive]}
            onPress={() => setActiveTab(key)}
          >
            <Icon size={14} color={activeTab === key ? COLORS.primary : COLORS.slate500} />
            <Text style={[styles.tabBtnText, activeTab === key && styles.tabBtnTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sub-Tab Contents */}
      {activeTab === 'live' && (
        <View style={styles.tabContent}>
          <LiveMonitor patientId={patientId} deviceId={patient?.device_id} onNewReading={loadPatient} />
          {patient?.device_id ? <WifiManager deviceId={patient.device_id} /> : null}
        </View>
      )}

      {activeTab === 'continuous' && (
        <View style={styles.tabContent}>
          <AutoMonitor patientId={patientId} patient={patient} onNewReading={loadPatient} />
        </View>
      )}

      {activeTab === 'trends' && (
        <View style={styles.tabContent}>
          <VitalsChart vitals={vitals} />

          {trends ? (
            <View style={styles.trendDetailsCard}>
              <Text style={styles.sectionTitle}>Detailed Trend Metrics</Text>
              <View style={styles.trendGrid}>
                {[
                  { label: 'HR Trend', value: trends.hr_trend },
                  { label: 'SpO2 Trend', value: trends.spo2_trend },
                  { label: 'Temp Trend', value: trends.temp_trend },
                  { label: 'Deterioration', value: trends.deterioration_trend },
                  { label: 'HRV (SDNN)', value: trends.hrv_sdnn ? `${trends.hrv_sdnn} ms` : 'N/A' },
                  { label: 'Temp Rate', value: `${trends.temp_rate_of_change}°C/hr` },
                  { label: 'Desaturation', value: trends.spo2_desaturation_flag ? 'DETECTED' : 'None' },
                ].map((item, i) => (
                  <View key={i} style={styles.trendItemBox}>
                    <Text style={styles.trendItemLabel}>{item.label}</Text>
                    <Text
                      style={[
                        styles.trendItemVal,
                        item.value === 'DETECTED' || item.value === 'deteriorating'
                          ? { color: COLORS.red600 }
                          : {},
                      ]}
                    >
                      {item.value}
                    </Text>
                  </View>
                ))}
              </View>

              {trends.baseline_deviations && (
                <View style={styles.deviationsBox}>
                  <Text style={styles.deviationsTitle}>Baseline Deviations</Text>
                  <View style={styles.devRow}>
                    <Text style={styles.devItem}>
                      HR:{' '}
                      {trends.baseline_deviations.hr_deviation > 0 ? '+' : ''}
                      {trends.baseline_deviations.hr_deviation} bpm
                    </Text>
                    <Text style={styles.devItem}>
                      SpO2:{' '}
                      {trends.baseline_deviations.spo2_deviation > 0 ? '+' : ''}
                      {trends.baseline_deviations.spo2_deviation}%
                    </Text>
                    <Text style={styles.devItem}>
                      Temp:{' '}
                      {trends.baseline_deviations.temp_deviation > 0 ? '+' : ''}
                      {trends.baseline_deviations.temp_deviation}°C
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ) : vitals.length < 2 ? (
            <View style={styles.emptyTrendsCard}>
              <Text style={styles.emptyTrendsText}>
                Record at least 2 vital readings to see temporal trend analysis.
              </Text>
            </View>
          ) : null}
        </View>
      )}

      {activeTab === 'assistant' && (
        <View style={[styles.tabContent, { height: 480 }]}>
          <AIChat patientId={patientId} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate50,
  },
  content: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.slate500,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
    gap: SPACING.md,
  },
  notFoundText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.red600,
  },
  btnBack: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  btnBackText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  btnIconBack: {
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitleGroup: {
    flex: 1,
  },
  patientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.slate800,
  },
  patientMeta: {
    fontSize: 11,
    color: COLORS.slate500,
    marginTop: 1,
  },
  btnReport: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.indigo600,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
  },
  btnReportText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  statPill: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  statPillLabel: {
    fontSize: 10,
    color: COLORS.slate400,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statPillVal: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.slate800,
    marginTop: 2,
  },
  cvdCard: {
    backgroundColor: COLORS.slate100,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cvdTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.slate800,
  },
  cvdSub: {
    fontSize: 10,
    color: COLORS.slate500,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.slate100,
    borderRadius: RADIUS.md,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  tabBtnActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  tabBtnText: {
    fontSize: 11,
    color: COLORS.slate600,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  tabContent: {
    gap: SPACING.md,
  },
  trendDetailsCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    ...SHADOWS.sm,
    gap: SPACING.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.slate800,
  },
  trendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  trendItemBox: {
    width: '48%',
    backgroundColor: COLORS.slate50,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  },
  trendItemLabel: {
    fontSize: 10,
    color: COLORS.slate500,
  },
  trendItemVal: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.slate800,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  deviationsBox: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  deviationsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.slate700,
    marginBottom: 4,
  },
  devRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  devItem: {
    fontSize: 11,
    color: COLORS.slate600,
    fontWeight: '600',
  },
  emptyTrendsCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyTrendsText: {
    fontSize: 12,
    color: COLORS.slate400,
    textAlign: 'center',
  },
});
