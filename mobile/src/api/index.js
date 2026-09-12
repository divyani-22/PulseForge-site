import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';

const getInitialBase = () => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return `http://${window.location.hostname}:5000/api`;
    }
    return 'http://localhost:5000/api';
  }
  try {
    const scriptURL = NativeModules.SourceCode?.scriptURL;
    if (scriptURL) {
      const address = scriptURL.split('://')[1].split('/')[0].split(':')[0];
      if (address && address !== 'localhost' && address !== '127.0.0.1' && !address.includes('exp.direct') && !address.includes('ngrok')) {
        return `http://${address}:5000/api`;
      }
    }
  } catch {}
  return 'http://192.168.1.9:5000/api';
};

let currentBaseUrl = getInitialBase();

export async function getBaseUrl() {
  try {
    const custom = await AsyncStorage.getItem('hmd_api_base');
    if (custom) currentBaseUrl = custom;
    else currentBaseUrl = getInitialBase();
  } catch {}
  return currentBaseUrl;
}

export async function setBaseUrl(newUrl) {
  currentBaseUrl = newUrl;
  await AsyncStorage.setItem('hmd_api_base', newUrl);
}

async function request(path, options = {}) {
  const base = await getBaseUrl();
  const url = `${base}${path}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options,
    });
    clearTimeout(timeoutId);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Connection timed out. Check backend server connection.');
    }
    throw err;
  }
}

export const api = {
  // Auth
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getUser: (id) => request(`/auth/user/${id}`),
  listDoctors: () => request('/doctors'),

  // Health
  health: () => request('/health'),

  // Patients
  listPatients: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/patients${qs ? '?' + qs : ''}`);
  },
  getPatient: (id) => request(`/patients/${id}`),
  createPatient: (data) => request('/patients', { method: 'POST', body: JSON.stringify(data) }),
  deletePatient: (id) => request(`/patients/${id}`, { method: 'DELETE' }),

  // Vitals
  recordVitals: (patientId, data) =>
    request(`/patients/${patientId}/vitals`, { method: 'POST', body: JSON.stringify(data) }),
  getVitals: (patientId, limit = 100) => request(`/patients/${patientId}/vitals?limit=${limit}`),

  // Predictions & Trends
  predict: (patientId) => request(`/patients/${patientId}/predict`),
  getTrends: (patientId) => request(`/patients/${patientId}/trends`),

  // Chat
  sendChatMessage: (patientId, message, lang, history, vitals) =>
    request('/chat', { method: 'POST', body: JSON.stringify({ patient_id: patientId, message, lang, history, vitals }) }),

  // Reports
  getReport: (patientId) => request(`/patients/${patientId}/report`),

  // Model
  trainModel: () => request('/model/train', { method: 'POST' }),
  modelStatus: () => request('/model/status'),

  // Dataset
  datasetStats: () => request('/dataset/stats'),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'POST', body: JSON.stringify(data) }),
};
