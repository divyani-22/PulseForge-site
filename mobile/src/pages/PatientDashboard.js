import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../context/I18nContext';
import { api } from '../api';
import VitalsChart from '../components/VitalsChart';
import AlertsPanel from '../components/AlertsPanel';
import { Heart, Wind, Thermometer, FileText, Activity, Shield, User } from '../components/Icons';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../constants/theme';

export default function PatientDashboard({ onNavigate }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [patient, setPatient] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  const patientId = user?.patient_link_id;

  useEffect(() => {
    loadData();
  }, [patientId]);

  const loadData = async () => {
    if (!patientId) {
      setLoading(false);
      return;
    }
    try {
      const [p, v] = await Promise.all([api.getPatient(patientId), api.getVitals(patientId)]);
      setPatient(p);
      setVitals(v || []);
      if (v && v.length > 0) {
        try {
          const pred = await api.predict(patientId);
          setPrediction(pred);
        } catch {}
      }
      if (v && v.length >= 2) {
        try {
          const tr = await api.getTrends(patientId);
          setTrends(tr);
        } catch {}
      }
    } catch (err) {
      console.error('Failed to load patient dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.emerald600} />
        <Text style={styles.loadingText}>Loading your health data...</Text>
      </View>
    );
  }

  if (!patientId) {
    return (
      <View style={styles.noProfileContainer}>
        <User size={48} color={COLORS.slate300} />
        <Text style={styles.noProfileTitle}>No Health Profile Found</Text>
        <Text style={styles.noProfileSub}>
          Your patient profile hasn't been linked yet. Please contact your doctor.
        </Text>
      </View>
    );
  }

  const latest = vitals.length > 0 ? vitals[vitals.length - 1] : null;
  const latestAssessment = latest?.assessment;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Patient Header Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerTop}>
          <View style={styles.bannerInfo}>
            <View style={styles.bannerSub}>
              <Shield size={14} color="rgba(255,255,255,0.85)" />
              <Text style={styles.bannerSubText}>{t('patientPortal', 'My Health Dashboard')}</Text>
            </View>
            <Text style={styles.patientName}>{user.name}</Text>
            <Text style={styles.patientMeta}>
              {patient?.age}y {patient?.gender === 'M' ? t('male', 'Male') : t('female', 'Female')} | BMI: {patient?.bmi}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.btnReport}
            onPress={() => onNavigate('ReportView', { patientId })}
            activeOpacity={0.85}
          >
            <FileText size={16} color={COLORS.white} />
            <Text style={styles.btnReportText}>{t('generateReport', 'My Report')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {latest ? (
        <>
          {/* 4 Vital Cards Grid */}
          <View style={styles.vitalsGrid}>
            <View style={styles.vitalCard}>
              <View style={styles.vitalCardHeader}>
                <View style={[styles.vitalIconWrap, { backgroundColor: COLORS.red50 }]}>
                  <Heart size={16} color={COLORS.red500} />
                </View>
                <Text style={styles.vitalLabel}>{t('heartRate', 'Heart Rate')}</Text>
              </View>
              <Text style={styles.vitalNum}>{latest.heart_rate || latest.heartRate}</Text>
              <Text style={styles.vitalUnit}>{t('bpmUnit', 'BPM')}</Text>
            </View>

            <View style={styles.vitalCard}>
              <View style={styles.vitalCardHeader}>
                <View style={[styles.vitalIconWrap, { backgroundColor: COLORS.blue50 }]}>
                  <Wind size={16} color={COLORS.blue500} />
                </View>
                <Text style={styles.vitalLabel}>{t('spo2', 'SpO2')}</Text>
              </View>
              <Text style={styles.vitalNum}>{latest.spo2 || latest.spO2}</Text>
              <Text style={styles.vitalUnit}>%</Text>
            </View>

            <View style={styles.vitalCard}>
              <View style={styles.vitalCardHeader}>
                <View style={[styles.vitalIconWrap, { backgroundColor: COLORS.orange50 }]}>
                  <Thermometer size={16} color={COLORS.orange500} />
                </View>
                <Text style={styles.vitalLabel}>{t('temperature', 'Temperature')}</Text>
              </View>
              <Text style={styles.vitalNum}>{Number(latest.temperature).toFixed(1)}</Text>
              <Text style={styles.vitalUnit}>°C</Text>
            </View>

            <View style={styles.vitalCard}>
              <View style={styles.vitalCardHeader}>
                <View style={[styles.vitalIconWrap, { backgroundColor: COLORS.indigo50 }]}>
                  <Activity size={16} color={COLORS.indigo600} />
                </View>
                <Text style={styles.vitalLabel}>{t('mewsScore', 'NEWS2')}</Text>
              </View>
              <Text
                style={[
                  styles.vitalNum,
                  {
                    color:
                      latest.news2_score >= 5
                        ? COLORS.red600
                        : latest.news2_score >= 1
                        ? COLORS.amber600
                        : COLORS.emerald600,
                  },
                ]}
              >
                {latest.news2_score || 0}
              </Text>
              <Text style={styles.vitalUnit}>/ 8 Risk</Text>
            </View>
          </View>

          {/* AI Prediction Card */}
          {prediction && (
            <View
              style={[
                styles.predictionCard,
                {
                  backgroundColor:
                    prediction.prediction === 'healthy'
                      ? COLORS.emerald50
                      : ['critical', 'cardiac_event', 'sepsis'].includes(prediction.prediction)
                      ? COLORS.red50
                      : COLORS.amber50,
                  borderColor:
                    prediction.prediction === 'healthy'
                      ? COLORS.emerald100
                      : ['critical', 'cardiac_event', 'sepsis'].includes(prediction.prediction)
                      ? COLORS.red100
                      : COLORS.amber100,
                },
              ]}
            >
              <Text style={styles.predSub}>CURRENT AI HEALTH STATUS</Text>
              <Text
                style={[
                  styles.predTitle,
                  {
                    color:
                      prediction.prediction === 'healthy'
                        ? COLORS.emerald600
                        : ['critical', 'cardiac_event', 'sepsis'].includes(prediction.prediction)
                        ? COLORS.red600
                        : COLORS.amber600,
                  },
                ]}
              >
                {prediction.prediction.replace(/_/g, ' ')}
              </Text>
              <View style={styles.predDetailsRow}>
                <Text style={styles.predDetailText}>
                  AI Confidence: {(prediction.confidence * 100).toFixed(1)}%
                </Text>
                <Text style={styles.predDetailText}>
                  SIRS: {prediction.derived_parameters?.sirs_flag ? 'Positive' : 'Negative'}
                </Text>
              </View>
            </View>
          )}

          {/* Alerts Panel */}
          {latestAssessment?.alerts?.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Health Alerts</Text>
              <AlertsPanel
                alerts={[
                  ...(latestAssessment.alerts || []),
                  ...(trends?.trend_alerts || []),
                ]}
              />
            </View>
          )}

          {/* Health Trends Summary */}
          {trends && (
            <View style={styles.trendsCard}>
              <Text style={styles.sectionTitle}>Health Trends</Text>
              <View style={styles.trendGrid}>
                {[
                  { label: 'Heart Rate', value: trends.hr_trend },
                  { label: 'SpO2', value: trends.spo2_trend },
                  { label: 'Temperature', value: trends.temp_trend },
                  { label: 'Overall', value: trends.deterioration_trend },
                ].map((item, idx) => (
                  <View key={idx} style={styles.trendBox}>
                    <Text style={styles.trendLabel}>{item.label}</Text>
                    <Text style={[styles.trendValue, item.value === 'improving' ? styles.trendGood : styles.trendNeutral]}>
                      {item.value || 'Stable'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Vitals Trend Chart */}
          <VitalsChart vitals={vitals} />
        </>
      ) : (
        <View style={styles.noReadingsCard}>
          <Activity size={36} color={COLORS.slate300} />
          <Text style={styles.noReadingsTitle}>No Readings Yet</Text>
          <Text style={styles.noReadingsSub}>
            Your doctor will record your vitals, or they will stream automatically from your connected ESP32 wearable.
          </Text>
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
  noProfileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
    gap: SPACING.sm,
  },
  noProfileTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.slate700,
  },
  noProfileSub: {
    fontSize: 13,
    color: COLORS.slate400,
    textAlign: 'center',
    lineHeight: 18,
  },
  banner: {
    backgroundColor: COLORS.emerald600,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  bannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerInfo: {
    flex: 1,
  },
  bannerSub: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bannerSubText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
  },
  patientName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 2,
  },
  patientMeta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
  btnReport: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  btnReportText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  vitalCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  vitalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  vitalIconWrap: {
    width: 26,
    height: 26,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vitalLabel: {
    fontSize: 11,
    color: COLORS.slate500,
    fontWeight: '600',
  },
  vitalNum: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.slate800,
  },
  vitalUnit: {
    fontSize: 11,
    color: COLORS.slate400,
    marginTop: -2,
  },
  predictionCard: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  predSub: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.slate500,
    letterSpacing: 0.5,
  },
  predTitle: {
    fontSize: 18,
    fontWeight: '800',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  predDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  predDetailText: {
    fontSize: 11,
    color: COLORS.slate600,
    fontWeight: '600',
  },
  sectionBlock: {
    gap: SPACING.xs,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.slate800,
    marginBottom: 4,
  },
  trendsCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  trendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  trendBox: {
    width: '48%',
    backgroundColor: COLORS.slate50,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  trendLabel: {
    fontSize: 11,
    color: COLORS.slate500,
  },
  trendValue: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  trendGood: {
    color: COLORS.emerald600,
  },
  trendNeutral: {
    color: COLORS.slate700,
  },
  noReadingsCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  noReadingsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.slate700,
    marginTop: SPACING.sm,
  },
  noReadingsSub: {
    fontSize: 12,
    color: COLORS.slate400,
    textAlign: 'center',
    lineHeight: 17,
  },
});
