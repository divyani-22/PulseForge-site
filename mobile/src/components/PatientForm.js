import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useI18n } from '../context/I18nContext';
import { api } from '../api';
import { UserPlus } from './Icons';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../constants/theme';

const COMORBIDITIES = [
  'asthma', 'hypertension', 'diabetes', 'copd',
  'heart_disease', 'obesity', 'chronic_kidney_disease',
];

export default function PatientForm({ onCreated, onCancel, doctorId }) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: 'M',
    bmi: '',
    comorbidities: [],
    activity_level: 'light',
    device_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.name || !form.age || !form.bmi) {
      setError('Please fill in Name, Age, and BMI');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        age: parseInt(form.age),
        bmi: parseFloat(form.bmi),
        comorbidities: form.comorbidities.join(','),
        doctor_id: doctorId || undefined,
      };
      const patient = await api.createPatient(payload);
      onCreated(patient);
    } catch (err) {
      setError(err.message);
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
    <View style={styles.card}>
      <View style={styles.header}>
        <UserPlus size={20} color={COLORS.blue600} />
        <Text style={styles.headerTitle}>Register New Patient</Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('fullName', 'Full Name')} *</Text>
        <TextInput
          style={styles.input}
          placeholder={t('enterFullName', 'Enter patient full name')}
          placeholderTextColor={COLORS.slate400}
          value={form.name}
          onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.label}>{t('age', 'Age (years)')} *</Text>
          <TextInput
            style={styles.input}
            placeholder={t('enterAge', 'Enter age')}
            placeholderTextColor={COLORS.slate400}
            keyboardType="number-pad"
            value={form.age}
            onChangeText={(v) => setForm((f) => ({ ...f, age: v }))}
          />
        </View>

        <View style={[styles.formGroup, { flex: 1 }]}>
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
        <View style={[styles.formGroup, { flex: 1 }]}>
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
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.label}>{t('activityLevel', 'Activity Level')}</Text>
          <View style={styles.activityButtons}>
            {['light', 'moderate', 'active'].map((act) => (
              <TouchableOpacity
                key={act}
                style={[styles.actBtn, form.activity_level === act && styles.actBtnActive]}
                onPress={() => setForm((f) => ({ ...f, activity_level: act }))}
              >
                <Text style={[styles.actBtnText, form.activity_level === act && styles.actBtnTextActive]}>
                  {t(act, act[0].toUpperCase() + act.slice(1))}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('deviceId', 'ESP32 Hardware Device ID (optional)')}</Text>
        <TextInput
          style={[styles.input, styles.monoInput]}
          placeholder={t('enterDeviceId', 'Enter hardware device ID')}
          placeholderTextColor={COLORS.slate400}
          value={form.device_id}
          onChangeText={(v) => setForm((f) => ({ ...f, device_id: v }))}
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Comorbidities</Text>
        <View style={styles.chipsRow}>
          {COMORBIDITIES.map((c) => {
            const selected = form.comorbidities.includes(c);
            return (
              <TouchableOpacity
                key={c}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => toggleComorb(c)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {c.replace(/_/g, ' ')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.submitBtnText}>{t('registerNewPatient', 'Register Patient')}</Text>
          )}
        </TouchableOpacity>
        {onCancel && (
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelBtnText}>{t('cancel', 'Cancel')}</Text>
          </TouchableOpacity>
        )}
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.slate800,
  },
  errorText: {
    color: COLORS.red600,
    backgroundColor: COLORS.red50,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    fontSize: 12,
  },
  formGroup: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.slate700,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 13,
    color: COLORS.slate800,
    backgroundColor: COLORS.slate50,
  },
  monoInput: {
    fontFamily: 'monospace',
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
  },
  genderBtnTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  activityButtons: {
    flexDirection: 'row',
    gap: 3,
  },
  actBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.slate100,
    alignItems: 'center',
  },
  actBtnActive: {
    backgroundColor: COLORS.primaryLight,
  },
  actBtnText: {
    fontSize: 10,
    color: COLORS.slate600,
    fontWeight: '600',
  },
  actBtnTextActive: {
    color: COLORS.white,
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
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  submitBtn: {
    flex: 1,
    backgroundColor: COLORS.blue600,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: COLORS.slate700,
    fontSize: 13,
    fontWeight: '600',
  },
});
