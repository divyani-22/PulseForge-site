function getBase() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('hmd_api_url');
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, '');
    }
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
    }
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      if (host.includes('vercel.app')) {
        return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      }
      return `http://${host}:5000/api`;
    }
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
}

async function request(path, options = {}) {
  const base = getBase();
  const res = await fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
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
    const qs = new URLSearchParams(params).toString()
    return request(`/patients${qs ? '?' + qs : ''}`)
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
