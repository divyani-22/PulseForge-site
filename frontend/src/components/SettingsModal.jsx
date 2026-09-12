import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../context/I18nContext';
import { Settings, Globe, Server, User, X, Check, Activity, AlertCircle } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const { lang, setLang, t } = useI18n();

  const [serverUrl, setServerUrl] = useState(() => {
    return localStorage.getItem('hmd_api_url') || 'http://localhost:5000/api';
  });
  const [testStatus, setTestStatus] = useState(null);
  const [testMessage, setTestMessage] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [settings, setSettings] = useState({
    language: 'en',
    notifications: true,
    theme: 'light',
  });

  useEffect(() => {
    if (isOpen) {
      setServerUrl(localStorage.getItem('hmd_api_url') || 'http://localhost:5000/api');
      setTestStatus(null);
      setTestMessage('');
      setSaveSuccess(false);

      // 1. Read from localStorage immediately as reliable fallback
      const localLang = localStorage.getItem('user_lang') || localStorage.getItem('hmd_lang') || 'en';
      const localTheme = localStorage.getItem('user_theme') || 'light';
      const localNotifs = localStorage.getItem('user_notifications') !== 'false';
      setSettings({
        language: localLang,
        theme: localTheme,
        notifications: localNotifs,
      });

      // 2. Silently fetch from backend /api/settings if available
      const cleanUrl = (localStorage.getItem('hmd_api_url') || 'http://localhost:5000/api').trim().replace(/\/+$/, '');
      fetch(`${cleanUrl}/settings`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && typeof data === 'object') {
            setSettings((prev) => ({ ...prev, ...data }));
            if (data.language && data.language !== lang) {
              setLang(data.language);
              localStorage.setItem('user_lang', data.language);
              localStorage.setItem('hmd_lang', data.language);
            }
          }
        })
        .catch(() => {
          // Silently fall back to localStorage - no blocking error notice
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

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

  const handleSaveServer = () => {
    if (!serverUrl.trim()) return;
    localStorage.setItem('hmd_api_url', serverUrl.trim());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const languages = [
    { code: 'en', label: 'English (EN)', desc: 'Default clinical terminology' },
    { code: 'hi', label: 'हिंदी (Hindi)', desc: 'नैदानिक और स्वास्थ्य परामर्श' },
    { code: 'mr', label: 'मराठी (Marathi)', desc: 'स्थानिक आरोग्य व व्हिटल्स सल्ला' },
  ];

  const handleLanguageChange = (newLang) => {
    if (!newLang) return;
    setLang(newLang);
    try {
      localStorage.setItem('user_lang', newLang);
      localStorage.setItem('hmd_lang', newLang);
    } catch {}
    setSettings((prev) => ({ ...prev, language: newLang }));

    try {
      const cleanUrl = serverUrl.trim().replace(/\/+$/, '');
      fetch(`${cleanUrl}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: newLang }),
      }).catch(() => {});
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-bold text-slate-800">{t('settingsTitle')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Language Selector */}
          <div className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-semibold text-slate-800">{t('language', 'Language')}</h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">{t('selectLanguage', 'Select Language')}</p>

            <div className="space-y-2">
              {Array.isArray(languages) && languages.map((item) => {
                const currentLang = lang || 'en';
                const isActive = currentLang === item?.code;
                return (
                  <button
                    key={item?.code || Math.random()}
                    onClick={() => item?.code && handleLanguageChange(item.code)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                        isActive
                          ? 'border-teal-500 bg-teal-50/60 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className={`text-sm font-semibold ${isActive ? 'text-teal-800' : 'text-slate-700'}`}>
                          {item?.label || item?.code}
                        </div>
                        <div className="text-xs text-slate-500">{item?.desc || ''}</div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                          isActive ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {isActive && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          {/* Server Config */}
          <div className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Server className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-semibold text-slate-800">{t('serverConfig')}</h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">{t('serverUrlHelp')}</p>

            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t('serverUrlLabel')}
              </label>
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => {
                  setServerUrl(e.target.value);
                  setTestStatus(null);
                  setSaveSuccess(false);
                }}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                placeholder="http://localhost:5000/api"
              />
            </div>

            {testStatus && (
              <div
                className={`flex items-center gap-2 p-2.5 rounded-lg text-xs mb-3 ${
                  testStatus === 'success'
                    ? 'bg-teal-50 text-teal-800 border border-teal-200'
                    : testStatus === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {testStatus === 'loading' ? (
                  <Activity className="w-4 h-4 animate-spin text-teal-600" />
                ) : testStatus === 'success' ? (
                  <Check className="w-4 h-4 text-teal-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <span>{testMessage}</span>
              </div>
            )}

            {saveSuccess && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg text-xs mb-3 bg-teal-50 text-teal-800 border border-teal-200">
                <Check className="w-4 h-4 text-teal-600" />
                <span>Endpoint saved in browser storage.</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testStatus === 'loading'}
                className="flex-1 py-2 px-3 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Activity className="w-3.5 h-3.5" />
                {t('testConnection')}
              </button>
              <button
                type="button"
                onClick={handleSaveServer}
                className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
              >
                {t('save')}
              </button>
            </div>
          </div>

          {/* Session Profile */}
          {/* Session Profile */}
          <div className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-semibold text-slate-800">{t('sessionInfo', 'Current Session Profile')}</h3>
            </div>
            {user && typeof user === 'object' ? (
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">{t('fullName', 'Full Name')}:</span>
                  <span className="font-semibold text-slate-800">{user?.role === 'doctor' ? (user?.name || 'Doctor') : 'User'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">{t('roleLabel', 'User Role')}:</span>
                  <span className="px-2 py-0.5 bg-teal-50 text-teal-700 font-semibold rounded-full uppercase text-[10px]">
                    {String(user?.role || 'user')}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">{t('email', 'Email Address')}:</span>
                  <span className="text-slate-700">{user?.email || 'N/A'}</span>
                </div>
                {user?.patient_link_id ? (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">{t('patientIdLabel', 'User Record ID')}:</span>
                    <span className="font-mono font-semibold text-teal-700">{user.patient_link_id}</span>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Guest Session (Not Signed In)</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{t('appVersion')}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition-colors"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}
