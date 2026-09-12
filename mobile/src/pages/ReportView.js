import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { api } from '../api';
import { ArrowLeft, FileText, Shield, Stethoscope, Activity, TrendingUp, AlertTriangle } from '../components/Icons';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../constants/theme';

export default function ReportView({ routeParams, onNavigate }) {
  const patientId = routeParams?.patientId;
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!patientId) {
      setLoading(false);
      return;
    }
    api.getReport(patientId)
      .then(setReport)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [patientId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Generating clinical health report...</Text>
      </View>
    );
  }

  if (error || !report) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Unable to generate report'}</Text>
        <TouchableOpacity style={styles.btnBack} onPress={() => onNavigate('Dashboard')}>
          <Text style={styles.btnBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const pred = report.prediction || {};
  const risk = pred.risk || {};
  const derived = pred.derived_vitals || {};
  const recs = pred.recommendations || {};
  const protocol = recs.scenario_protocol || {};
  const guidance = recs.vital_guidance || [];
  const patient = report.patient || {};
  const vitals = report.vitals_summary || {};
  const trends = report.trends;

  const getRiskBg = (category) => {
    switch (category) {
      case 'CRITICAL':
        return COLORS.red600;
      case 'HIGH':
        return COLORS.orange500;
      case 'MEDIUM':
        return COLORS.amber500;
      default:
        return COLORS.emerald600;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => onNavigate('Dashboard')}>
          <ArrowLeft size={20} color={COLORS.slate700} />
        </TouchableOpacity>
        <View style={styles.topTitleGroup}>
          <Text style={styles.topTitle}>Clinical Health Report</Text>
          <Text style={styles.topSub}>
            ID: {report.report_id} | {new Date(report.generated_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Patient Profile Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Shield size={18} color={COLORS.primary} />
          <Text style={styles.cardTitle}>Patient Information</Text>
        </View>
        <View style={styles.patientGrid}>
          <View style={styles.gridItem}>
            <Text style={styles.itemLabel}>Name</Text>
            <Text style={styles.itemVal}>{patient.name}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.itemLabel}>Patient ID</Text>
            <Text style={styles.itemVal}>#{patient.id}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.itemLabel}>Demographics</Text>
            <Text style={styles.itemVal}>{patient.age}y ({patient.gender === 'M' ? 'Male' : 'Female'})</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.itemLabel}>BMI</Text>
            <Text style={styles.itemVal}>{patient.bmi}</Text>
          </View>
          <View style={[styles.gridItem, { width: '100%' }]}>
            <Text style={styles.itemLabel}>Comorbidities</Text>
            <Text style={styles.itemVal}>{patient.comorbidities || 'None reported'}</Text>
          </View>
        </View>
      </View>

      {/* Risk Score Banner */}
      <View style={[styles.riskBanner, { backgroundColor: getRiskBg(risk.category) }]}>
        <View style={styles.riskTop}>
          <View>
            <Text style={styles.riskOverline}>COMPOSITE RISK CATEGORY</Text>
            <Text style={styles.riskCategory}>{risk.category || 'LOW'}</Text>
            <Text style={styles.riskDesc}>{risk.description}</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreNum}>{risk.numeric_score || 0}</Text>
            <Text style={styles.scoreSub}>/100 score</Text>
          </View>
        </View>

        {risk.flags && risk.flags.length > 0 && (
          <View style={styles.flagsRow}>
            {risk.flags.map((f, i) => (
              <View key={i} style={styles.flagPill}>
                <Text style={styles.flagText}>{f}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* AI Clinical Prediction */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Stethoscope size={18} color={COLORS.primary} />
          <Text style={styles.cardTitle}>AI Clinical Assessment</Text>
        </View>

        <View style={styles.predResultBox}>
          <View>
            <Text style={styles.predName}>{pred.prediction?.replace(/_/g, ' ')}</Text>
            <Text style={styles.predConf}>
              Confidence: {(pred.confidence * 100).toFixed(1)}%
            </Text>
          </View>
          <View style={styles.urgencyPill}>
            <Text style={styles.urgencyText}>{recs.overall_urgency || 'ROUTINE'}</Text>
          </View>
        </View>

        {pred.probabilities && (
          <View style={styles.probSection}>
            <Text style={styles.probTitle}>Differential Scenarios</Text>
            {Object.entries(pred.probabilities)
              .slice(0, 4)
              .map(([sc, prob]) => (
                <View key={sc} style={styles.probRow}>
                  <Text style={styles.probLabel}>{sc.replace(/_/g, ' ')}</Text>
                  <View style={styles.probTrack}>
                    <View style={[styles.probFill, { width: `${Math.min(prob * 100, 100)}%` }]} />
                  </View>
                  <Text style={styles.probVal}>{(prob * 100).toFixed(1)}%</Text>
                </View>
              ))}
          </View>
        )}
      </View>

      {/* 8 Derived Parameters Grid */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Activity size={18} color={COLORS.primary} />
          <Text style={styles.cardTitle}>Vitals & Derived Parameters</Text>
        </View>

        <View style={styles.derivedGrid}>
          {[
            { label: 'Shock Index', val: derived.shock_index, ref: 'Allgower 1967', warn: derived.shock_index >= 1.0 },
            { label: 'Oxygen Delivery', val: derived.odi, ref: 'Vincent 2004', warn: derived.odi < 60 },
            { label: 'STRS', val: derived.strs, ref: 'SpO2-Temp Risk', warn: derived.strs > 15 },
            { label: 'MAP (mmHg)', val: derived.map_est, ref: 'SSC 2021', warn: derived.map_est < 65 },
            { label: 'MEWS Score', val: derived.mews, ref: 'Subbe 2001', warn: derived.mews >= 5 },
            { label: 'RR Proxy', val: derived.rr_proxy, ref: 'Tarassenko 2006' },
            { label: 'RPP', val: derived.rpp, ref: 'Robinson 1967', warn: derived.rpp > 12 },
            { label: 'BSA (m²)', val: derived.bsa, ref: 'DuBois 1916' },
          ].map((item, idx) => (
            <View key={idx} style={[styles.derivedCard, item.warn && styles.derivedCardWarn]}>
              <Text style={styles.derivedLabel}>{item.label}</Text>
              <Text style={[styles.derivedVal, item.warn && styles.derivedValWarn]}>
                {item.val || 'N/A'}
              </Text>
              <Text style={styles.derivedRef}>{item.ref}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Scenario Protocol */}
      {protocol.scenario && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Clinical Protocol — {protocol.scenario.replace(/_/g, ' ')}
          </Text>
          <View style={styles.protocolSteps}>
            {protocol.steps?.map((st, i) => (
              <View key={i} style={styles.stepItem}>
                <View style={styles.stepNumBubble}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{st}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.protocolRef}>Ref: {protocol.reference}</Text>
        </View>
      )}

      {/* Vital Sign Guidance Alerts */}
      {guidance.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <AlertTriangle size={18} color={COLORS.amber500} />
            <Text style={styles.cardTitle}>Vital Sign Guidance</Text>
          </View>
          <View style={styles.guidanceList}>
            {guidance.map((g, i) => (
              <View key={i} style={styles.guidanceItem}>
                <Text style={styles.guidanceMsg}>{g.message}</Text>
                <Text style={styles.guidanceAction}>{g.action}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Medical Disclaimer */}
      <View style={styles.disclaimerCard}>
        <Text style={styles.disclaimerText}>
          <Text style={{ fontWeight: '700' }}>Clinical Disclaimer: </Text>
          {recs.disclaimer || report.disclaimer || 'This report is generated for clinical decision support. Always consult a qualified physician.'}
        </Text>
      </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
    gap: SPACING.md,
  },
  errorText: {
    color: COLORS.red600,
    fontSize: 14,
    textAlign: 'center',
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconBtn: {
    padding: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  topTitleGroup: {
    flex: 1,
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.slate800,
  },
  topSub: {
    fontSize: 11,
    color: COLORS.slate500,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    ...SHADOWS.sm,
    gap: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.slate800,
  },
  patientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  gridItem: {
    width: '48%',
  },
  itemLabel: {
    fontSize: 10,
    color: COLORS.slate400,
    textTransform: 'uppercase',
  },
  itemVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.slate800,
    marginTop: 1,
  },
  riskBanner: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  riskTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskOverline: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.5,
  },
  riskCategory: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
    marginTop: 2,
  },
  riskDesc: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  scoreBox: {
    alignItems: 'center',
  },
  scoreNum: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.white,
  },
  scoreSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
  },
  flagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  flagPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  flagText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  predResultBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.slate50,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  predName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.slate800,
    textTransform: 'capitalize',
  },
  predConf: {
    fontSize: 11,
    color: COLORS.slate500,
    marginTop: 2,
  },
  urgencyPill: {
    backgroundColor: COLORS.red50,
    borderWidth: 1,
    borderColor: COLORS.red100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.red600,
    textTransform: 'uppercase',
  },
  probSection: {
    gap: 6,
  },
  probTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.slate600,
  },
  probRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  probLabel: {
    width: 100,
    fontSize: 11,
    color: COLORS.slate600,
    textTransform: 'capitalize',
  },
  probTrack: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.slate100,
    borderRadius: 3,
    overflow: 'hidden',
  },
  probFill: {
    height: '100%',
    backgroundColor: COLORS.primaryLight,
  },
  probVal: {
    width: 42,
    fontSize: 11,
    color: COLORS.slate500,
    textAlign: 'right',
  },
  derivedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  derivedCard: {
    width: '48%',
    backgroundColor: COLORS.slate50,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
  },
  derivedCardWarn: {
    backgroundColor: COLORS.red50,
    borderColor: COLORS.red100,
  },
  derivedLabel: {
    fontSize: 10,
    color: COLORS.slate500,
  },
  derivedVal: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.slate800,
    marginTop: 2,
  },
  derivedValWarn: {
    color: COLORS.red600,
  },
  derivedRef: {
    fontSize: 9,
    color: COLORS.slate400,
    marginTop: 2,
  },
  protocolSteps: {
    gap: SPACING.sm,
  },
  stepItem: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'flex-start',
  },
  stepNumBubble: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  stepText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.slate700,
    lineHeight: 16,
  },
  protocolRef: {
    fontSize: 10,
    color: COLORS.slate400,
    marginTop: 2,
  },
  guidanceList: {
    gap: SPACING.sm,
  },
  guidanceItem: {
    backgroundColor: COLORS.amber50,
    borderWidth: 1,
    borderColor: COLORS.amber100,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
  },
  guidanceMsg: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.amber600,
  },
  guidanceAction: {
    fontSize: 11,
    color: COLORS.slate700,
    marginTop: 2,
  },
  disclaimerCard: {
    backgroundColor: COLORS.slate100,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  disclaimerText: {
    fontSize: 10,
    color: COLORS.slate500,
    lineHeight: 14,
  },
});
