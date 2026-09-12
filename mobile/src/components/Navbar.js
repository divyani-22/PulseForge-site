import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, SafeAreaView, StatusBar } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../context/I18nContext';
import { Activity, Stethoscope, User, LogOut, Settings } from './Icons';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../constants/theme';
import SettingsModal from './SettingsModal';

export default function Navbar({ currentRoute, onNavigate }) {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  const isHome = currentRoute === 'Home' && !user;

  return (
    <SafeAreaView style={[styles.safeArea, isHome ? styles.safeAreaTransparent : styles.safeAreaWhite]}>
      <View style={[styles.headerContainer, isHome ? styles.headerTransparent : styles.headerWhite]}>
        {/* Brand Logo */}
        <TouchableOpacity
          style={styles.brand}
          activeOpacity={0.8}
          onPress={() => onNavigate && onNavigate(user ? 'Dashboard' : 'Home')}
        >
          <Activity size={24} color={isHome ? COLORS.white : COLORS.primary} />
          <Text style={[styles.brandText, isHome ? styles.brandTextWhite : styles.brandTextTeal]}>
            {t('brandName', 'PulseForge')}
          </Text>
        </TouchableOpacity>

        {/* Right action items */}
        <View style={styles.rightActions}>
          {/* Settings Modal Trigger */}
          <TouchableOpacity
            style={[styles.iconButton, isHome && styles.iconButtonTransparent]}
            onPress={() => setSettingsModalOpen(true)}
            activeOpacity={0.7}
            accessibilityLabel="Settings"
          >
            <Settings size={18} color={isHome ? COLORS.white : COLORS.slate600} />
          </TouchableOpacity>

          {!user ? (
            /* Public Nav Actions */
            <View style={styles.publicActions}>
              <TouchableOpacity
                style={[styles.btnOutline, isHome ? styles.btnOutlineWhite : styles.btnOutlineTeal]}
                onPress={() => onNavigate('Login')}
              >
                <Text style={[styles.btnOutlineText, isHome ? styles.btnOutlineTextWhite : styles.btnOutlineTextTeal]}>
                  {t('signIn', 'Sign In')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => onNavigate('Register')}
              >
                <Text style={styles.btnPrimaryText}>{t('register', 'Register')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Authenticated Nav Actions */
            <View style={styles.userActions}>
              <View style={styles.userBadge}>
                {user?.role === 'doctor' ? (
                  <Stethoscope size={16} color={COLORS.primary} />
                ) : (
                  <User size={16} color={COLORS.emerald600} />
                )}
                <Text style={styles.userName} numberOfLines={1}>
                  {user?.role === 'doctor' ? `Dr. ${user?.name || ''}` : (user?.name || 'User')}
                </Text>
                <View style={styles.roleTag}>
                  <Text style={styles.roleTagText}>{t(user?.role || 'patient', user?.role || 'Patient')}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={async () => {
                  await logout();
                  onNavigate('Login');
                }}
                activeOpacity={0.7}
                accessibilityLabel="Logout"
              >
                <LogOut size={16} color={COLORS.red600} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Internal System Settings Modal Component */}
      <SettingsModal
        visible={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  safeAreaTransparent: {
    backgroundColor: COLORS.primary,
  },
  safeAreaWhite: {
    backgroundColor: COLORS.white,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerTransparent: {
    backgroundColor: COLORS.primary,
  },
  headerWhite: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.sm,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  brandText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  brandTextWhite: {
    color: COLORS.white,
  },
  brandTextTeal: {
    color: COLORS.primary,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconButton: {
    padding: SPACING.xs + 3,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.slate100,
    marginLeft: 8,
    transform: [{ translateX: 6 }],
  },
  iconButtonTransparent: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  publicActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnOutline: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  btnOutlineWhite: {
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  btnOutlineTeal: {
    borderColor: COLORS.primary200,
    backgroundColor: COLORS.primary50,
  },
  btnOutlineText: {
    fontSize: 12,
    fontWeight: '600',
  },
  btnOutlineTextWhite: {
    color: COLORS.white,
  },
  btnOutlineTextTeal: {
    color: COLORS.primary,
  },
  btnPrimary: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
  },
  btnPrimaryText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.slate50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.slate700,
    maxWidth: 90,
  },
  roleTag: {
    backgroundColor: COLORS.primary50,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'capitalize',
  },
  logoutBtn: {
    padding: 6,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.red50,
  },
});
