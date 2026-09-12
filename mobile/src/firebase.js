import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, onValue, query, limitToLast, orderByKey, push, remove, set } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyA0IY9cDHrfpKF1_bM6wCuWuFDfXd4RmsE",
  authDomain: "healthmonitor-6685d.firebaseapp.com",
  databaseURL: "https://healthmonitor-6685d-default-rtdb.firebaseio.com",
  projectId: "healthmonitor-6685d",
  storageBucket: "healthmonitor-6685d.firebasestorage.app",
  messagingSenderId: "1032865983619",
  appId: "1:1032865983619:web:0729bcd236eae558b97fb6",
  measurementId: "G-4SECDDVF3N"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);

/**
 * Listen to real-time vitals from ESP32 for a given device/patient.
 * Firebase path: patients/{deviceId}/vitals
 */
export function listenToDeviceVitals(deviceId, callback) {
  if (!deviceId) return () => {};
  const vitalsRef = query(
    ref(db, `patients/${deviceId}/vitals`),
    orderByKey(),
    limitToLast(50)
  );

  const unsubscribe = onValue(vitalsRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    const readings = Object.entries(data).map(([key, val]) => ({
      firebaseKey: key,
      heartRate: val.heartRate,
      spO2: val.spO2,
      temperature: val.temperature,
      deviceId: val.deviceId,
      timestamp: val.timestamp,
    }));
    callback(readings);
  }, (err) => {
    console.warn('Firebase vitals listener warning:', err.message);
  });

  return unsubscribe;
}

/**
 * Get the latest single reading from a device.
 */
export function listenToLatestVital(deviceId, callback) {
  if (!deviceId) return () => {};
  const vitalsRef = query(
    ref(db, `patients/${deviceId}/vitals`),
    orderByKey(),
    limitToLast(1)
  );

  const unsubscribe = onValue(vitalsRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback(null);
      return;
    }
    const entries = Object.values(data);
    callback(entries[entries.length - 1] || null);
  }, (err) => {
    console.warn('Firebase latest vital warning:', err.message);
  });

  return unsubscribe;
}

// ── WiFi Network Management ──

export function listenToWifiList(deviceId, callback) {
  if (!deviceId) return () => {};
  const wifiRef = ref(db, `patients/${deviceId}/config/wifi_list`);
  return onValue(wifiRef, (snapshot) => {
    const data = snapshot.val() || {};
    const list = Object.entries(data).map(([key, val]) => ({
      key,
      ssid: val.ssid,
      password: val.password,
      added_at: val.added_at,
    }));
    callback(list);
  }, (err) => {
    console.warn('Firebase wifi list warning:', err.message);
  });
}

export async function addWifiNetwork(deviceId, ssid, password) {
  const wifiRef = ref(db, `patients/${deviceId}/config/wifi_list`);
  await push(wifiRef, {
    ssid,
    password,
    added_at: new Date().toISOString(),
  });
}

export async function removeWifiNetwork(deviceId, key) {
  await remove(ref(db, `patients/${deviceId}/config/wifi_list/${key}`));
}

export { db, ref, onValue };
