import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../context/I18nContext';
import { api } from '../api';
import { Activity, LogIn } from '../components/Icons';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../constants/theme';

export default function Login({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useI18n();

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const user = await api.login({ email: email.trim(), password: password.trim() });
      await login(user);
      onNavigate('Dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.brandHeader}>
            <Activity size={32} color={COLORS.primary} />
            <Text style={styles.brandTitle}>{t('brandName', 'PulseForge')}</Text>
            <Text style={styles.brandSubtitle}>{t('loginTitle', 'Sign in to your account')}</Text>
          </View>

          {error ? <Text style={styles.errorAlert}>{error}</Text> : null}

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('email', 'Email Address')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('enterEmail', 'Enter your email address')}
                placeholderTextColor={COLORS.slate400}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('password', 'Password')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('enterPassword', 'Enter your password')}
                placeholderTextColor={COLORS.slate400}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

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
                  <LogIn size={18} color={COLORS.white} />
                  <Text style={styles.submitBtnText}>{t('signIn', 'Sign In')}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Switch to Register */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>{t('dontHaveAccount', "Don't have an account?")} </Text>
            <TouchableOpacity onPress={() => onNavigate('Register')}>
              <Text style={styles.switchLink}>{t('register', 'Register')}</Text>
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
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingVertical: SPACING.xxl,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    ...SHADOWS.lg,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginTop: SPACING.xs,
  },
  brandSubtitle: {
    fontSize: 14,
    color: COLORS.slate500,
    marginTop: 4,
  },
  errorAlert: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    color: COLORS.red700,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    fontSize: 13,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  form: {
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
    borderColor: COLORS.slate300,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 14,
    color: COLORS.slate900,
    backgroundColor: COLORS.white,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xs,
    ...SHADOWS.sm,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  switchText: {
    fontSize: 13,
    color: COLORS.slate500,
  },
  switchLink: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
