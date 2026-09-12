import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import {
  Activity, Heart, Shield, Brain, Stethoscope, Wifi, FileText,
  ArrowRight, CheckCircle, ChevronRight, Thermometer, Wind
} from '../components/Icons';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../constants/theme';

export default function Home({ onNavigate }) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ── Hero Section ── */}
      <View style={styles.heroSection}>
        <View style={styles.aiBadge}>
          <Activity size={14} color={COLORS.primary100} />
          <Text style={styles.aiBadgeText}>AI-Powered Health Monitoring</Text>
        </View>

        <Text style={styles.heroTitle}>
          Smart Health{'\n'}
          <Text style={styles.heroTitleAccent}>Monitoring System</Text>
        </Text>

        <Text style={styles.heroSubtitle}>
          Real-time patient vital monitoring with AI-powered clinical predictions. Track heart rate,
          SpO2, and temperature with instant health assessments.
        </Text>

        {/* Hero CTA Buttons */}
        <View style={styles.ctaButtonGroup}>
          <TouchableOpacity
            style={styles.btnHeroPrimary}
            onPress={() => onNavigate('Register')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnHeroPrimaryText}>Get Started</Text>
            <ArrowRight size={16} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnHeroSecondary}
            onPress={() => onNavigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnHeroSecondaryText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Mock Live Monitor Card */}
        <View style={styles.mockMonitorCard}>
          <View style={styles.mockHeader}>
            <View style={styles.mockDotRed} />
            <View style={styles.mockDotYellow} />
            <View style={styles.mockDotGreen} />
            <Text style={styles.mockTitle}>Live Patient Monitor</Text>
          </View>

          <View style={styles.mockVitalsGrid}>
            <View style={styles.mockTile}>
              <Heart size={20} color={COLORS.red100} />
              <Text style={styles.mockVal}>78</Text>
              <Text style={styles.mockUnit}>BPM</Text>
            </View>
            <View style={styles.mockTile}>
              <Wind size={20} color={COLORS.cyan100} />
              <Text style={styles.mockVal}>98</Text>
              <Text style={styles.mockUnit}>SpO2 %</Text>
            </View>
            <View style={styles.mockTile}>
              <Thermometer size={20} color={COLORS.orange100} />
              <Text style={styles.mockVal}>36.6</Text>
              <Text style={styles.mockUnit}>Temp °C</Text>
            </View>
          </View>

          <View style={styles.mockStatusRow}>
            <CheckCircle size={18} color={COLORS.emerald100} />
            <View>
              <Text style={styles.mockStatusText}>Status: Healthy</Text>
              <Text style={styles.mockStatusSub}>Risk Score: 4.5/100 | LOW | MEWS: 0</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── About Section ── */}
      <View style={styles.section}>
        <Text style={styles.sectionOverline}>ABOUT THE PLATFORM</Text>
        <Text style={styles.sectionHeading}>
          Intelligent Health Monitoring for Better Patient Outcomes
        </Text>
        <Text style={styles.sectionParagraph}>
          Our system combines IoT wearable sensors with advanced machine learning to provide real-time
          clinical decision support for healthcare professionals and patients.
        </Text>

        <View style={styles.aboutCards}>
          {[
            {
              icon: Stethoscope,
              color: COLORS.primary50,
              iconColor: COLORS.primary,
              title: 'Wearable IoT Device',
              desc: 'ESP32-S3 powered device with MAX30102 (Heart Rate & SpO2) and LM35 (Temperature) sensors for continuous monitoring.',
            },
            {
              icon: Brain,
              color: COLORS.cyan100,
              iconColor: COLORS.cyan600,
              title: 'AI Clinical Prediction',
              desc: 'Random Forest classifier with 21 features including Shock Index, MEWS, ODI, and MAP — detects 12 clinical scenarios.',
            },
            {
              icon: FileText,
              color: COLORS.emerald50,
              iconColor: COLORS.emerald600,
              title: 'Professional Health Reports',
              desc: 'Auto-generated clinical reports with MEWS scoring, composite risk assessment (0-100), and SIRS screening.',
            },
          ].map((item, i) => (
            <View key={i} style={styles.aboutCard}>
              <View style={[styles.iconWrapper, { backgroundColor: item.color }]}>
                <item.icon size={22} color={item.iconColor} />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc}>{item.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── How It Works ── */}
      <View style={[styles.section, styles.sectionLight]}>
        <Text style={styles.sectionOverline}>HOW IT WORKS</Text>
        <Text style={styles.sectionHeading}>From Sensor to Diagnosis in Seconds</Text>

        <View style={styles.stepsList}>
          {[
            { step: '01', icon: Wifi, title: 'Sensor Capture', desc: 'MAX30102 and LM35 sensors read heart rate, SpO2, and temperature from the patient.' },
            { step: '02', icon: Activity, title: 'Data Transmission', desc: 'ESP32-S3 sends readings to Firebase in real-time over WiFi every 10 seconds.' },
            { step: '03', icon: Brain, title: 'AI Analysis', desc: 'ML model computes 8 derived parameters (Shock Index, ODI, MEWS, MAP, STRS, RPP, RR Proxy, BSA).' },
            { step: '04', icon: FileText, title: 'Clinical Report', desc: 'Risk scoring (0-100), clinical protocols, and vital-sign guidance are generated instantly.' },
          ].map((s, idx) => (
            <View key={idx} style={styles.stepCard}>
              <Text style={styles.stepNum}>{s.step}</Text>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepDesc}>{s.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ── Dual Portal Features ── */}
      <View style={styles.section}>
        <Text style={styles.sectionOverline}>DUAL PORTALS IN ONE APP</Text>
        <Text style={styles.sectionHeading}>Built for Healthcare Professionals & Patients</Text>

        {/* Doctor Features */}
        <View style={styles.doctorFeatureCard}>
          <View style={styles.featureHeader}>
            <Stethoscope size={24} color={COLORS.white} />
            <Text style={styles.featureTitleWhite}>For Doctors</Text>
          </View>
          {[
            'Dashboard with all your patients at a glance',
            'Real-time vital monitoring with live device feeds',
            'AI prediction with 8 derived parameters (SI, ODI, MEWS, MAP)',
            'MEWS scoring + composite risk assessment (0-100)',
            'SIRS / Sepsis automated screening',
            'Continuous monitoring simulator with 8 scenarios',
          ].map((text, i) => (
            <View key={i} style={styles.bulletRow}>
              <CheckCircle size={16} color={COLORS.cyan100} />
              <Text style={styles.bulletTextWhite}>{text}</Text>
            </View>
          ))}
        </View>

        {/* Patient Features */}
        <View style={styles.patientFeatureCard}>
          <View style={styles.featureHeader}>
            <Shield size={24} color={COLORS.emerald600} />
            <Text style={styles.featureTitleDark}>For Patients</Text>
          </View>
          {[
            'Personal health dashboard with latest vitals',
            'View your AI health status and gentle clinical alerts',
            'Track vital sign trends over time with visual charts',
            'Access your comprehensive health report anytime',
            'Understand risk score (0-100) with clear categories',
            'Direct AI Health Assistant chat support 24/7',
          ].map((text, i) => (
            <View key={i} style={styles.bulletRow}>
              <CheckCircle size={16} color={COLORS.emerald500} />
              <Text style={styles.bulletTextDark}>{text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── 12 Clinical Scenarios ── */}
      <View style={[styles.section, styles.sectionLight]}>
        <Text style={styles.sectionOverline}>AI CAPABILITIES</Text>
        <Text style={styles.sectionHeading}>12 Clinical Scenarios Detected</Text>
        <Text style={styles.sectionParagraph}>
          Trained on clinical guidelines from AHA, WHO, SSC, GOLD, GINA, and ESC.
        </Text>

        <View style={styles.scenariosGrid}>
          {[
            { name: 'Healthy', color: COLORS.emerald50, text: COLORS.emerald600, border: COLORS.emerald100 },
            { name: 'Fever', color: COLORS.amber50, text: COLORS.amber600, border: COLORS.amber100 },
            { name: 'Pneumonia', color: COLORS.orange50, text: COLORS.orange600, border: COLORS.orange100 },
            { name: 'Sepsis / SIRS', color: COLORS.red50, text: COLORS.red600, border: COLORS.red100 },
            { name: 'Cardiac Event', color: COLORS.red50, text: COLORS.red600, border: COLORS.red100 },
            { name: 'Hypoxia', color: COLORS.blue50, text: COLORS.blue600, border: COLORS.blue100 },
            { name: 'Respiratory Distress', color: COLORS.orange50, text: COLORS.orange600, border: COLORS.orange100 },
            { name: 'COPD Exacerbation', color: COLORS.amber50, text: COLORS.amber600, border: COLORS.amber100 },
            { name: 'Asthma Exacerbation', color: COLORS.yellow50, text: COLORS.yellow500, border: COLORS.yellow100 },
            { name: 'Heart Failure', color: COLORS.red50, text: COLORS.red600, border: COLORS.red100 },
            { name: 'Hypertension Crisis', color: COLORS.orange50, text: COLORS.orange600, border: COLORS.orange100 },
            { name: 'Critical Condition', color: COLORS.red50, text: COLORS.red600, border: COLORS.red100 },
          ].map((s, i) => (
            <View key={i} style={[styles.scenarioBadge, { backgroundColor: s.color, borderColor: s.border }]}>
              <Text style={[styles.scenarioBadgeText, { color: s.text }]}>{s.name}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <View style={styles.footerBrand}>
          <Activity size={20} color={COLORS.primary200} />
          <Text style={styles.footerTitle}>PulseForge</Text>
        </View>
        <Text style={styles.footerDesc}>
          AI-powered smart portable patient monitoring system using MAX30102 and LM35 sensors.
        </Text>
        <Text style={styles.footerCopy}>
          Clinical Decision Support System | Group 15
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  heroSection: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xxxl,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.md,
  },
  aiBadgeText: {
    color: COLORS.primary100,
    fontSize: 12,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  heroTitleAccent: {
    color: COLORS.cyan100,
  },
  heroSubtitle: {
    color: COLORS.primary100,
    fontSize: 14,
    lineHeight: 20,
    marginTop: SPACING.md,
  },
  ctaButtonGroup: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  btnHeroPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    ...SHADOWS.md,
  },
  btnHeroPrimaryText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  btnHeroSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
  },
  btnHeroSecondaryText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  mockMonitorCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    marginTop: SPACING.xl,
  },
  mockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.md,
  },
  mockDotRed: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#f87171' },
  mockDotYellow: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#facc15' },
  mockDotGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' },
  mockTitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '600',
  },
  mockVitalsGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  mockTile: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  mockVal: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  mockUnit: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
  },
  mockStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  },
  mockStatusText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  mockStatusSub: {
    color: COLORS.primary100,
    fontSize: 10,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xxl,
  },
  sectionLight: {
    backgroundColor: COLORS.slate50,
  },
  sectionOverline: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primaryLight,
    letterSpacing: 0.8,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.slate800,
    marginTop: 4,
    lineHeight: 26,
  },
  sectionParagraph: {
    fontSize: 13,
    color: COLORS.slate500,
    marginTop: SPACING.xs,
    lineHeight: 18,
  },
  aboutCards: {
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  aboutCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.slate800,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: COLORS.slate500,
    lineHeight: 18,
  },
  stepsList: {
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  stepNum: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.primary200,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.slate800,
  },
  stepDesc: {
    fontSize: 12,
    color: COLORS.slate500,
    lineHeight: 16,
    marginTop: 2,
  },
  doctorFeatureCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  patientFeatureCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  featureTitleWhite: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
  },
  featureTitleDark: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.slate800,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  bulletTextWhite: {
    flex: 1,
    color: COLORS.primary100,
    fontSize: 12,
    lineHeight: 17,
  },
  bulletTextDark: {
    flex: 1,
    color: COLORS.slate600,
    fontSize: 12,
    lineHeight: 17,
  },
  scenariosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  scenarioBadge: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  scenarioBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    backgroundColor: COLORS.slate900,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xxl,
    gap: SPACING.sm,
  },
  footerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  footerTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  footerDesc: {
    color: COLORS.slate400,
    fontSize: 12,
    lineHeight: 17,
  },
  footerCopy: {
    color: COLORS.slate500,
    fontSize: 11,
    marginTop: SPACING.md,
  },
});
