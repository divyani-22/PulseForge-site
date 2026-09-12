import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../context/I18nContext';
import { api } from '../api';
import PatientForm from '../components/PatientForm';
import { Users, Activity, Brain, Plus, Trash2, ChevronRight, Stethoscope, Copy } from '../components/Icons';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../constants/theme';

export default function DoctorDashboard({ onNavigate }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [patients, setPatients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [modelStatus, setModelStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [pts, ms] = await Promise.all([
        api.listPatients({ doctor_id: user.id }),
        api.modelStatus(),
      ]);
      setPatients(pts || []);
      setModelStatus(ms);
    } catch (err) {
      console.error('Failed to load doctor dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTrain = async () => {
    setTraining(true);
    try {
      const res = await api.trainModel();
      setModelStatus({ status: 'ready', classes: res.classes });
      Alert.alert('Success', `Model trained! Accuracy: ${(res.accuracy * 100).toFixed(1)}%`);
    } catch (err) {
      Alert.alert('Training Failed', err.message);
    } finally {
      setTraining(false);
    }
  };

  const handleDelete = (id, name) => {
    Alert.alert(
      'Delete Patient',
      `Delete patient "${name}" and all their vitals records?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deletePatient(id);
              setPatients((pts) => pts.filter((p) => p.id !== id));
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  const copyDoctorCode = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const renderStatusBadge = (vitals) => {
    if (!vitals?.prediction) return null;
    const pred = vitals.prediction;
    const isCritical = ['critical', 'cardiac_event', 'sepsis', 'pneumonia', 'hypoxia'].includes(pred);
    const isHealthy = pred === 'healthy';

    const bg = isHealthy ? COLORS.emerald50 : isCritical ? COLORS.red50 : COLORS.amber50;
    const text = isHealthy ? COLORS.emerald600 : isCritical ? COLORS.red600 : COLORS.amber600;

    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={[styles.badgeText, { color: text }]}>{pred.replace(/_/g, ' ')}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading doctor dashboard...</Text>
      </View>
    );
  }

  const totalReadings = patients.reduce((sum, p) => sum + (p.readings_count || 0), 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Doctor Header Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerTop}>
          <View style={styles.doctorInfo}>
            <View style={styles.roleSub}>
              <Stethoscope size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.roleSubText}>{t('clinicalDashboard', 'Doctor Dashboard')}</Text>
            </View>
            <Text style={styles.doctorName}>Dr. {user.name}</Text>
            {user.specialization ? (
              <Text style={styles.specializationText}>{user.specialization}</Text>
            ) : null}
          </View>

          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>Doctor Code</Text>
            <TouchableOpacity style={styles.codePill} onPress={copyDoctorCode}>
              <Text style={styles.codeNum}>{user.id}</Text>
              <Copy size={14} color={COLORS.white} />
            </TouchableOpacity>
            {copied ? <Text style={styles.copiedText}>Copied!</Text> : null}
          </View>
        </View>
        <Text style={styles.bannerTip}>Share this code with patients so they register under you.</Text>
      </View>

      {/* 3 Metric Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIconWrapper, { backgroundColor: COLORS.blue50 }]}>
            <Users size={18} color={COLORS.blue600} />
          </View>
          <Text style={styles.statNum}>{patients.length}</Text>
          <Text style={styles.statLabel}>{t('totalPatients', 'My Patients')}</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconWrapper, { backgroundColor: COLORS.emerald50 }]}>
            <Activity size={18} color={COLORS.emerald600} />
          </View>
          <Text style={styles.statNum}>{totalReadings}</Text>
          <Text style={styles.statLabel}>{t('activeMonitoring', 'Total Readings')}</Text>
        </View>

        <View style={styles.statCard}>
          <View
            style={[
              styles.statIconWrapper,
              { backgroundColor: modelStatus?.status === 'ready' ? COLORS.emerald50 : COLORS.amber50 },
            ]}
          >
            <Brain
              size={18}
              color={modelStatus?.status === 'ready' ? COLORS.emerald600 : COLORS.amber600}
            />
          </View>
          <Text style={styles.statStatus}>
            {modelStatus?.status === 'ready' ? 'AI Ready' : 'Untrained'}
          </Text>
          {modelStatus?.status !== 'ready' && (
            <TouchableOpacity style={styles.btnTrain} onPress={handleTrain} disabled={training}>
              <Text style={styles.btnTrainText}>{training ? '...' : 'Train'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Add Patient Button or Form */}
      {showForm ? (
        <PatientForm
          doctorId={user.id}
          onCreated={(newP) => {
            setPatients((prev) => [newP, ...prev]);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <TouchableOpacity style={styles.btnAddPatient} onPress={() => setShowForm(true)}>
          <Plus size={18} color={COLORS.white} />
          <Text style={styles.btnAddPatientText}>{t('registerNewPatient', 'Add New Patient')}</Text>
        </TouchableOpacity>
      )}

      {/* Patient List */}
      <View style={styles.listCard}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>{t('patientDirectory', 'My Patients')}</Text>
          <Text style={styles.listCount}>{patients.length} total</Text>
        </View>

        {patients.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Users size={32} color={COLORS.slate300} />
            <Text style={styles.emptyTitle}>{t('noPatientsFound', 'No patients yet')}</Text>
            <Text style={styles.emptySub}>
              Tap "Add New Patient" or share Doctor Code ({user.id}) with patients.
            </Text>
          </View>
        ) : (
          <View style={styles.divideList}>
            {patients.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.patientRow}
                activeOpacity={0.7}
                onPress={() => onNavigate('PatientDetail', { patientId: p.id })}
              >
                <View style={styles.patientInfo}>
                  <View style={styles.patientNameRow}>
                    <Text style={styles.patientName}>{p.name}</Text>
                    {renderStatusBadge(p.latest_vitals)}
                  </View>
                  <Text style={styles.patientMeta}>
                    {p.age}y {p.gender === 'M' ? 'Male' : 'Female'} | BMI: {p.bmi}
                    {p.comorbidities ? ` | ${p.comorbidities}` : ''}
                  </Text>
                  <Text style={styles.patientReadings}>
                    {p.readings_count || 0} readings {p.latest_vitals?.news2_score != null ? `| NEWS2: ${p.latest_vitals.news2_score}/8` : ''}
                  </Text>
                </View>

                <View style={styles.rowActions}>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(p.id, p.name)}
                  >
                    <Trash2 size={16} color={COLORS.slate400} />
                  </TouchableOpacity>
                  <ChevronRight size={18} color={COLORS.slate400} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
  banner: {
    backgroundColor: COLORS.indigo600,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  bannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  doctorInfo: {
    flex: 1,
  },
  roleSub: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roleSubText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 2,
  },
  specializationText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  codeBox: {
    alignItems: 'flex-end',
  },
  codeLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
  },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
    marginTop: 2,
  },
  codeNum: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
    fontFamily: 'monospace',
  },
  copiedText: {
    fontSize: 10,
    color: COLORS.emerald100,
    marginTop: 2,
  },
  bannerTip: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingTop: SPACING.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  statIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statNum: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.slate800,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.slate500,
  },
  statStatus: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.slate800,
  },
  btnTrain: {
    backgroundColor: COLORS.blue600,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    marginTop: 4,
  },
  btnTrainText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  btnAddPatient: {
    backgroundColor: COLORS.blue600,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs + 2,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    ...SHADOWS.sm,
  },
  btnAddPatientText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  listCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.slate800,
  },
  listCount: {
    fontSize: 12,
    color: COLORS.slate500,
  },
  emptyContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.slate700,
    marginTop: SPACING.sm,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.slate400,
    textAlign: 'center',
    lineHeight: 16,
  },
  divideList: {
    divideColor: COLORS.slate100,
  },
  patientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  patientInfo: {
    flex: 1,
  },
  patientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.blue600,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  patientMeta: {
    fontSize: 12,
    color: COLORS.slate500,
    marginTop: 2,
  },
  patientReadings: {
    fontSize: 11,
    color: COLORS.slate400,
    marginTop: 2,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  deleteBtn: {
    padding: 6,
  },
});
