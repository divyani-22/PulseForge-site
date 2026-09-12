import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../context/I18nContext';
import { getBaseUrl, setBaseUrl, api } from '../api';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../constants/theme';
import { Settings, Globe, Server, User, X, Check, Activity, AlertCircle } from './Icons';

export default function SettingsModal({ visible, onClose }) {
  const { user } = useAuth();
  const { lang, setLang, t } = useI18n();

  const [serverUrl, setServerUrl] = useState('');
  const [testStatus, setTestStatus] = useState(null); // 'loading' | 'success' | 'error' | null
  const [testMessage, setTestMessage] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [settings, setSettings] = useState({
    language: 'en',
    notifications: true,
    theme: 'light',
  });

  useEffect(() => {
    if (visible) {
      getBaseUrl().then((url) => {
        setServerUrl(url);
        setTestStatus(null);
        setTestMessage('');
        setSaveSuccess(false);
      });

      // 1. Silently read from local storage first
      (async () => {
        let savedLang = null;
        try {
          savedLang = await AsyncStorage.getItem('user_lang');
          if (!savedLang) savedLang = await AsyncStorage.getItem('hmd_lang');
          if (!savedLang && typeof localStorage !== 'undefined') {
            savedLang = localStorage.getItem('user_lang') || localStorage.getItem('hmd_lang');
          }
        } catch {}
        if (savedLang) {
          setSettings((prev) => ({ ...prev, language: savedLang }));
        }

        // 2. Silently fetch from backend /api/settings if available
        try {
          const base = await getBaseUrl();
          const cleanUrl = (base || 'http://localhost:5000/api').trim().replace(/\/+$/, '');
          const res = await fetch(`${cleanUrl}/settings`);
          if (res.ok) {
            const data = await res.json();
            if (data && typeof data === 'object') {
              setSettings((prev) => ({ ...prev, ...data }));
              if (data.language && data.language !== lang) {
                setLang(data.language);
              }
            }
          }
        } catch {
          // Silently fall back to storage - no blocking notice or dialog
        }
      })();
    }
  }, [visible]);

  const handleTestConnection = async () => {
    if (!serverUrl.trim()) return;
    setTestStatus('loading');
    setTestMessage(t('testingConnection'));
    const startTime = Date.now();

    try {
      const cleanUrl = serverUrl.trim().replace(/\/+$/, '');
      const testEndpoint = `${cleanUrl}/dataset/stats`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(testEndpoint, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const elapsed = Date.now() - startTime;
      if (res.ok) {
        setTestStatus('success');
        setTestMessage(`${t('connectedSuccess')} (${elapsed}ms)`);
      } else {
        setTestStatus('error');
        setTestMessage(`${t('connectionFailed')} (HTTP ${res.status})`);
      }
    } catch (err) {
      setTestStatus('error');
      setTestMessage(t('connectionFailed'));
    }
  };

  const handleSaveServer = async () => {
    if (!serverUrl.trim()) return;
    await setBaseUrl(serverUrl.trim());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const languages = [
    { code: 'en', label: 'English (EN)', flag: '🇺🇸 / 🇬🇧', desc: 'Default clinical terminology' },
    { code: 'hi', label: 'हिंदी (Hindi)', flag: '🇮🇳', desc: 'नैदानिक और स्वास्थ्य परामर्श' },
    { code: 'mr', label: 'मराठी (Marathi)', flag: '🇮🇳', desc: 'स्थानिक आरोग्य व व्हिटल्स सल्ला' },
  ];

  const handleLanguageChange = (newLang) => {
    if (!newLang) return;
    setLang(newLang);
    AsyncStorage.setItem('user_lang', newLang).catch(() => {});
    AsyncStorage.setItem('hmd_lang', newLang).catch(() => {});
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('user_lang', newLang);
        localStorage.setItem('hmd_lang', newLang);
      } catch {}
    }
    setSettings((prev) => ({ ...prev, language: newLang }));

    getBaseUrl().then((base) => {
      const cleanUrl = (base || 'http://localhost:5000/api').trim().replace(/\/+$/, '');
      fetch(`${cleanUrl}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: newLang }),
      }).catch(() => {});
    }).catch(() => {});
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Settings size={22} color={COLORS.primary} />
              <Text style={styles.headerTitle}>{t('settingsTitle')}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color={COLORS.slate500} />
            </TouchableOpacity>
          </View>

          {/* Scrollable Settings Sections */}
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* 1. Language Selection Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Globe size={18} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>{t('language', 'Language')}</Text>
              </View>
              <Text style={styles.sectionSubtitle}>{t('selectLanguage', 'Select Language')}</Text>

              <View style={styles.langList}>
                {Array.isArray(languages) && languages.map((item) => {
                  const currentLang = lang || 'en';
                  const isActive = currentLang === item?.code;
                  return (
                    <TouchableOpacity
                      key={item?.code || Math.random()}
                      style={[styles.langCard, isActive && styles.langCardActive]}
                      onPress={() => item?.code && handleLanguageChange(item.code)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.langInfo}>
                          <Text style={[styles.langLabel, isActive && styles.langLabelActive]}>
                            {item?.label || item?.code}
                          </Text>
                          <Text style={styles.langDesc}>{item?.desc || ''}</Text>
                        </View>
                        <View style={[styles.radioCircle, isActive && styles.radioCircleActive]}>
                          {isActive && <Check size={14} color={COLORS.white} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

            {/* 2. Backend Server Connection Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Server size={18} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>{t('serverConfig')}</Text>
              </View>
              <Text style={styles.sectionSubtitle}>{t('serverUrlHelp')}</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('serverUrlLabel')}</Text>
                <TextInput
                  style={styles.textInput}
                  value={serverUrl}
                  onChangeText={(val) => {
                    setServerUrl(val);
                    setTestStatus(null);
                    setSaveSuccess(false);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="http://172.20.10.4:5000/api"
                  placeholderTextColor={COLORS.slate400}
                />
              </View>

              {/* Status Message */}
              {testStatus && (
                <View
                  style={[
                    styles.statusAlert,
                    testStatus === 'success' && styles.statusAlertSuccess,
                    testStatus === 'error' && styles.statusAlertError,
                  ]}
                >
                  {testStatus === 'loading' ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : testStatus === 'success' ? (
                    <Check size={16} color={COLORS.emerald600} />
                  ) : (
                    <AlertCircle size={16} color={COLORS.red600} />
                  )}
                  <Text
                    style={[
                      styles.statusText,
                      testStatus === 'success' && styles.statusTextSuccess,
                      testStatus === 'error' && styles.statusTextError,
                    ]}
                  >
                    {testMessage}
                  </Text>
                </View>
              )}

              {saveSuccess && (
                <View style={[styles.statusAlert, styles.statusAlertSuccess]}>
                  <Check size={16} color={COLORS.emerald600} />
                  <Text style={[styles.statusText, styles.statusTextSuccess]}>
                    Endpoint configuration saved.
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.testBtn}
                  onPress={handleTestConnection}
                  disabled={testStatus === 'loading'}
                  activeOpacity={0.7}
                >
                  <Activity size={16} color={COLORS.primary} />
                  <Text style={styles.testBtnText}>{t('testConnection')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSaveServer}
                  activeOpacity={0.7}
                >
                  <Text style={styles.saveBtnText}>{t('save')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 3. Session / Profile Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <User size={18} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>{t('sessionInfo')}</Text>
              </View>

              {user && typeof user === 'object' ? (
                <View style={styles.profileBox}>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>{t('fullName', 'Full Name')}:</Text>
                    <Text style={styles.profileValue}>{user?.name || 'User'}</Text>
                  </View>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>{t('roleLabel', 'User Role')}:</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{String(user?.role || 'user').toUpperCase()}</Text>
                    </View>
                  </View>
                  <View style={styles.profileRow}>
                    <Text style={styles.profileLabel}>{t('email', 'Email Address')}:</Text>
                    <Text style={styles.profileValue}>{user?.email || 'N/A'}</Text>
                  </View>
                  {user?.patient_link_id ? (
                    <View style={styles.profileRow}>
                      <Text style={styles.profileLabel}>{t('patientIdLabel', 'Patient Record ID')}:</Text>
                      <Text style={styles.profileValueMono}>{user.patient_link_id}</Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                <View style={styles.guestBox}>
                  <Text style={styles.guestText}>Guest Session (Not Signed In)</Text>
                </View>
              )}
            </View>

            {/* 4. App Info Section */}
            <View style={[styles.section, styles.sectionLast]}>
              <Text style={styles.appTitle}>{t('appVersion', 'PulseForge Web Portal v2.0')}</Text>
              <Text style={styles.appSub}>{t('appArchitecture', 'Dual-Portal Unified Clinical Architecture')}</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  container: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    ...SHADOWS.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
    backgroundColor: COLORS.white,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.slate800,
  },
  closeBtn: {
    padding: 6,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.slate100,
  },
  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  section: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  sectionLast: {
    backgroundColor: COLORS.slate50,
    borderColor: COLORS.slate200,
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.slate800,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.slate500,
    marginBottom: SPACING.md,
  },
  langList: {
    gap: SPACING.xs,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.sm + 2,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.slate50,
  },
  langCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.emerald50,
  },
  langInfo: {
    flex: 1,
  },
  langLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.slate700,
  },
  langLabelActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  langDesc: {
    fontSize: 11,
    color: COLORS.slate500,
    marginTop: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.slate300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  inputGroup: {
    marginBottom: SPACING.sm,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.slate700,
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.slate300,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 13,
    color: COLORS.slate800,
    backgroundColor: COLORS.slate50,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statusAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.slate100,
    marginBottom: SPACING.sm,
  },
  statusAlertSuccess: {
    backgroundColor: COLORS.emerald50,
    borderWidth: 1,
    borderColor: COLORS.emerald200,
  },
  statusAlertError: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  statusText: {
    fontSize: 12,
    color: COLORS.slate700,
    flex: 1,
  },
  statusTextSuccess: {
    color: COLORS.emerald800,
    fontWeight: '500',
  },
  statusTextError: {
    color: COLORS.red700,
    fontWeight: '500',
  },
  btnRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: 4,
  },
  testBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    backgroundColor: COLORS.emerald50,
  },
  testBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  saveBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  profileBox: {
    gap: 8,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileLabel: {
    fontSize: 12,
    color: COLORS.slate500,
  },
  profileValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.slate800,
  },
  profileValueMono: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primaryDark,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  badge: {
    backgroundColor: COLORS.emerald50,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.emerald200,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  guestBox: {
    padding: SPACING.sm,
    backgroundColor: COLORS.slate50,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  guestText: {
    fontSize: 12,
    color: COLORS.slate500,
  },
  appTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.slate700,
  },
  appSub: {
    fontSize: 11,
    color: COLORS.slate500,
    marginTop: 2,
  },
});
