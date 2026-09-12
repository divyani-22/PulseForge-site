import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { listenToWifiList, addWifiNetwork, removeWifiNetwork } from '../firebase';
import { Wifi, Plus, Trash2, Eye, EyeOff, Info } from './Icons';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../constants/theme';

export default function WifiManager({ deviceId }) {
  const [networks, setNetworks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deviceId) {
      setLoading(false);
      return;
    }
    const unsubscribe = listenToWifiList(deviceId, (list) => {
      setNetworks(list);
      setLoading(false);
    });
    return unsubscribe;
  }, [deviceId]);

  const handleAdd = async () => {
    if (!ssid.trim() || !password.trim()) {
      setError('Both SSID and password are required');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await addWifiNetwork(deviceId, ssid.trim(), password.trim());
      setSsid('');
      setPassword('');
      setShowForm(false);
    } catch (err) {
      setError('Failed to add: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (key, ssidName) => {
    Alert.alert(
      'Remove Network',
      `Remove "${ssidName}" from ESP32 device WiFi list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeWifiNetwork(deviceId, key);
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  if (!deviceId) {
    return (
      <View style={styles.warnCard}>
        <Text style={styles.warnText}>Link an ESP32 device first to manage its WiFi networks.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Wifi size={18} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Device WiFi Networks</Text>
        </View>
        {!showForm && (
          <TouchableOpacity style={styles.btnAdd} onPress={() => setShowForm(true)}>
            <Plus size={14} color={COLORS.white} />
            <Text style={styles.btnAddText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.infoBox}>
        <Info size={16} color={COLORS.blue600} />
        <Text style={styles.infoText}>
          Add WiFi networks the device should remember. The ESP32 tries each saved network on boot.
        </Text>
      </View>

      {/* Add Form */}
      {showForm && (
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="WiFi Name (SSID)"
            value={ssid}
            onChangeText={setSsid}
          />
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="WiFi Password (min 8 chars)"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword((s) => !s)}
            >
              {showPassword ? <EyeOff size={18} color={COLORS.slate500} /> : <Eye size={18} color={COLORS.slate500} />}
            </TouchableOpacity>
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <View style={styles.formActions}>
            <TouchableOpacity style={styles.btnSave} onPress={handleAdd} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color={COLORS.white} /> : <Text style={styles.btnSaveText}>Save Network</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnCancel} onPress={() => setShowForm(false)}>
              <Text style={styles.btnCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Network List */}
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: SPACING.md }} />
      ) : networks.length === 0 ? (
        <Text style={styles.emptyText}>No WiFi networks added yet.</Text>
      ) : (
        <View style={styles.list}>
          {networks.map((n) => (
            <View key={n.key} style={styles.networkItem}>
              <View style={styles.netLeft}>
                <Wifi size={16} color={COLORS.primary} />
                <View>
                  <Text style={styles.ssidText}>{n.ssid}</Text>
                  <Text style={styles.passText}>••••••••</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleDelete(n.key, n.ssid)} style={styles.trashBtn}>
                <Trash2 size={16} color={COLORS.red600} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
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
  warnCard: {
    backgroundColor: COLORS.amber50,
    borderWidth: 1,
    borderColor: COLORS.amber100,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  warnText: {
    color: COLORS.amber600,
    fontSize: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.slate800,
  },
  btnAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.md,
  },
  btnAddText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  infoBox: {
    flexDirection: 'row',
    gap: SPACING.sm,
    backgroundColor: COLORS.blue50,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.blue600,
    lineHeight: 15,
  },
  formContainer: {
    backgroundColor: COLORS.slate50,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    fontSize: 13,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  eyeBtn: {
    padding: SPACING.sm,
  },
  errorText: {
    color: COLORS.red600,
    fontSize: 11,
  },
  formActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  btnSave: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  btnSaveText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  btnCancel: {
    backgroundColor: COLORS.slate200,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  btnCancelText: {
    color: COLORS.slate700,
    fontSize: 12,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.slate400,
    textAlign: 'center',
    paddingVertical: SPACING.sm,
  },
  list: {
    gap: SPACING.xs + 2,
  },
  networkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: COLORS.slate50,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  netLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  ssidText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.slate800,
  },
  passText: {
    fontSize: 10,
    color: COLORS.slate400,
  },
  trashBtn: {
    padding: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.red50,
  },
});
