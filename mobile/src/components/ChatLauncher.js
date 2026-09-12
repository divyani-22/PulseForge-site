import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, Dimensions, SafeAreaView } from 'react-native';
import { Bot } from './Icons';
import AIChat from './AIChat';
import { useAuth } from '../auth/AuthContext';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ChatLauncher() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      {/* Floating Action Button */}
      {!open && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setOpen(true)}
          activeOpacity={0.85}
          accessibilityLabel="Open AI Health Assistant"
        >
          <Bot size={26} color={COLORS.white} />
        </TouchableOpacity>
      )}

      {/* Slide-up Assistant Modal */}
      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <SafeAreaView style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.backdropTouchable}
            activeOpacity={1}
            onPress={() => setOpen(false)}
          />
          <View style={styles.drawerCard}>
            <AIChat
              patientId={user.role === 'patient' ? (user.patient_link_id || user.id) : null}
              onClose={() => setOpen(false)}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.emerald500,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    ...SHADOWS.lg,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
  },
  drawerCard: {
    height: SCREEN_HEIGHT * 0.75,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
});
