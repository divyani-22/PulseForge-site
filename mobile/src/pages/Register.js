import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../context/I18nContext';
import { api } from '../api';
import { Activity, UserPlus } from '../components/Icons';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../constants/theme';

const COMORBIDITIES = [
  'asthma', 'hypertension', 'diabetes', 'copd',
  'heart_disease', 'obesity', 'chronic_kidney_disease',
];

export default function Register({ onNavigate }) {
  const { t } = useI18n();
  const [role, setRole] = useState('doctor');
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    specialization: '',
    age: '',
    gender: 'M',
    bmi: '',
    comorbidities: [],
    activity_level: 'light',
    doctor_id: '',
  });
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    api.listDoctors()
      .then((d) => setDoctors(d || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (role === 'patient' && (!form.age || !form.bmi)) {
      setError('Please provide Age and BMI for patient profile');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const payload = {
        email: form.email.trim(),
        password: form.password,
        name: form.name.trim(),
        role,
      };

      if (role === 'doctor') {
        payload.specialization = form.specialization.trim();
      } else {
        payload.age = parseInt(form.age);
        payload.gender = form.gender;
        payload.bmi = parseFloat(form.bmi);
        payload.comorbidities = form.comorbidities.join(',');
        payload.activity_level = form.activity_level;
        if (form.doctor_id) payload.doctor_id = parseInt(form.doctor_id);
      }

      const user = await api.register(payload);
      await login(user);
      onNavigate('Dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const toggleComorb = (c) => {
    setForm((f) => ({
      ...f,
      comorbidities: f.comorbidities.includes(c)
        ? f.comorbidities.filter((x) => x !== c)
        : [...f.comorbidities, c],
    }));
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {/* Brand Header */}
          <View style={styles.brandHeader}>
            <Activity size={32} color={COLORS.primary} />
            <Text style={styles.brandTitle}>PulseForge</Text>
            <Text style={styles.brandSubtitle}>Create your account</Text>
          </View>

          {/* Role Selector Tabs */}
          <View style={styles.roleTabs}>
            <TouchableOpacity
              style={[styles.roleTab, role === 'doctor' && styles.roleTabActive]}
              onPress={() => setRole('doctor')}
            >
              <Text style={[styles.roleTabText, role === 'doctor' && styles.roleTabTextActive]}>
                Doctor
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleTab, role === 'patient' && styles.roleTabActive]}
              onPress={() => setRole('patient')}
            >
              <Text style={[styles.roleTabText, role === 'patient' && styles.roleTabTextActive]}>
                Patient
              </Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorAlert}>{error}</Text> : null}

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('fullName', 'Full Name')} *</Text>
              <TextInput
                style={styles.input}
                placeholder={t('enterFullName', 'Enter your full name')}
                placeholderTextColor={COLORS.slate400}
                value={form.name}
                onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('email', 'Email Address')} *</Text>
              <TextInput
                style={styles.input}
                placeholder={t('enterEmail', 'Enter your email address')}
                placeholderTextColor={COLORS.slate400}
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('password', 'Password')} *</Text>
              <TextInput
                style={styles.input}
                placeholder={t('enterPassword', 'Enter password (min 6 characters)')}
                placeholderTextColor={COLORS.slate400}
                secureTextEntry
                value={form.password}
                onChangeText={(v) => setForm((f) => ({ ...f, password: v }))}
              />
            </View>

            {role === 'doctor' ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('specialization', 'Specialization (optional)')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('enterSpecialization', 'Enter medical specialization')}
                  placeholderTextColor={COLORS.slate400}
                  value={form.specialization}
                  onChangeText={(v) => setForm((f) => ({ ...f, specialization: v }))}
                />
              </View>
            ) : (
              <>
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>{t('age', 'Age')} *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={t('enterAge', 'Enter age')}
                      placeholderTextColor={COLORS.slate400}
                      keyboardType="number-pad"
                      value={form.age}
                      onChangeText={(v) => setForm((f) => ({ ...f, age: v }))}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>{t('gender', 'Gender')}</Text>
                    <View style={styles.genderToggle}>
                      <TouchableOpacity
                        style={[styles.genderBtn, form.gender === 'M' && styles.genderBtnActive]}
                        onPress={() => setForm((f) => ({ ...f, gender: 'M' }))}
                      >
                        <Text style={[styles.genderBtnText, form.gender === 'M' && styles.genderBtnTextActive]}>
                          {t('male', 'Male')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.genderBtn, form.gender === 'F' && styles.genderBtnActive]}
                        onPress={() => setForm((f) => ({ ...f, gender: 'F' }))}
                      >
                        <Text style={[styles.genderBtnText, form.gender === 'F' && styles.genderBtnTextActive]}>
                          {t('female', 'Female')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>{t('bmi', 'BMI (kg/m²)')} *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={t('enterBmi', 'Enter BMI')}
                      placeholderTextColor={COLORS.slate400}
                      keyboardType="decimal-pad"
                      value={form.bmi}
                      onChangeText={(v) => setForm((f) => ({ ...f, bmi: v }))}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>{t('activityLevel', 'Activity')}</Text>
                    <View style={styles.genderToggle}>
                      {['light', 'active'].map((act) => (
                        <TouchableOpacity
                          key={act}
                          style={[styles.genderBtn, form.activity_level === act && styles.genderBtnActive]}
                          onPress={() => setForm((f) => ({ ...f, activity_level: act }))}
                        >
                          <Text style={[styles.genderBtnText, form.activity_level === act && styles.genderBtnTextActive]}>
                            {act}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                {doctors.length > 0 && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Assign to Doctor (optional)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.docScroll}>
                      <TouchableOpacity
                        style={[styles.docChip, !form.doctor_id && styles.docChipActive]}
                        onPress={() => setForm((f) => ({ ...f, doctor_id: '' }))}
                      >
                        <Text style={[styles.docChipText, !form.doctor_id && styles.docChipTextActive]}>
                          None
                        </Text>
                      </TouchableOpacity>
                      {doctors.map((d) => (
                        <TouchableOpacity
                          key={d.id}
                          style={[styles.docChip, form.doctor_id === String(d.id) && styles.docChipActive]}
                          onPress={() => setForm((f) => ({ ...f, doctor_id: String(d.id) }))}
                        >
                          <Text style={[styles.docChipText, form.doctor_id === String(d.id) && styles.docChipTextActive]}>
                            Dr. {d.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Comorbidities</Text>
                  <View style={styles.chipsRow}>
                    {COMORBIDITIES.map((c) => {
                      const sel = form.comorbidities.includes(c);
                      return (
                        <TouchableOpacity
                          key={c}
                          style={[styles.chip, sel && styles.chipSelected]}
                          onPress={() => toggleComorb(c)}
                        >
                          <Text style={[styles.chipText, sel && styles.chipTextSelected]}>
                            {c.replace(/_/g, ' ')}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <View style={styles.btnContent}>
                  <UserPlus size={18} color={COLORS.white} />
                  <Text style={styles.submitBtnText}>
                    Register as {role === 'doctor' ? 'Doctor' : 'Patient'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Switch to Login */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => onNavigate('Login')}>
              <Text style={styles.switchLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.slate50,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.lg,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  brandSubtitle: {
    fontSize: 13,
    color: COLORS.slate500,
    marginTop: 2,
  },
  roleTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.slate100,
    borderRadius: RADIUS.md,
    padding: 3,
    marginBottom: SPACING.lg,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  roleTabActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  roleTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.slate600,
  },
  roleTabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  errorAlert: {
    backgroundColor: COLORS.red50,
    color: COLORS.red600,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    fontSize: 12,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.red100,
  },
  form: {
    gap: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  inputGroup: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.slate700,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: 14,
    color: COLORS.slate800,
    backgroundColor: COLORS.slate50,
  },
  genderToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.slate100,
    borderRadius: RADIUS.md,
    padding: 2,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  genderBtnActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  genderBtnText: {
    fontSize: 12,
    color: COLORS.slate600,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  genderBtnTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  docScroll: {
    flexDirection: 'row',
  },
  docChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.slate50,
    marginRight: 6,
  },
  docChipActive: {
    backgroundColor: COLORS.primary50,
    borderColor: COLORS.primaryLight,
  },
  docChipText: {
    fontSize: 12,
    color: COLORS.slate600,
  },
  docChipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: COLORS.slate50,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  chipSelected: {
    backgroundColor: COLORS.primary50,
    borderColor: COLORS.primaryLight,
  },
  chipText: {
    fontSize: 11,
    color: COLORS.slate600,
  },
  chipTextSelected: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xs,
    ...SHADOWS.sm,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  switchText: {
    fontSize: 13,
    color: COLORS.slate500,
  },
  switchLink: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
