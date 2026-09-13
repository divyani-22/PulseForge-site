import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../context/I18nContext'
import { Activity, LogOut, Stethoscope, User, Menu, X, Settings } from 'lucide-react'
import SettingsModal from './SettingsModal'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const isHome = location.pathname === '/' && !user

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {!user ? (
        /* Public navbar (landing page) */
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all ${
          isHome ? 'bg-transparent' : 'bg-white shadow-sm'
        }`}>
          <div className="max-w-7xl mx-auto px-4 h-18 flex items-center justify-between py-4">
            <Link to="/" className={`flex items-center gap-2 text-xl font-bold ${isHome ? 'text-white' : 'text-teal-700'}`}>
              <Activity className="w-7 h-7" />
              <span>{t('brandName', 'PulseForge')}</span>
            </Link>
            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className={`text-sm font-medium ${isHome ? 'text-white/90 hover:text-white' : 'text-gray-600 hover:text-teal-700'}`}>
                {t('home', 'Home')}
              </Link>
              <a href="/#about" className={`text-sm font-medium ${isHome ? 'text-white/90 hover:text-white' : 'text-gray-600 hover:text-teal-700'}`}>
                {t('about', 'About')}
              </a>
              <a href="/#features" className={`text-sm font-medium ${isHome ? 'text-white/90 hover:text-white' : 'text-gray-600 hover:text-teal-700'}`}>
                {t('features', 'Features')}
              </a>

              {/* Settings button */}
              <button
                onClick={() => setSettingsOpen(true)}
                className={`p-1.5 rounded-lg transition-colors ml-3 translate-x-2 ${
                  isHome ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-teal-700 hover:bg-gray-100'
                }`}
                title={t('settingsTitle')}
              >
                <Settings className="w-4 h-4" />
              </button>

              <Link to="/login"
                className={`text-sm font-medium px-5 py-2 rounded-lg transition-all ${
                  isHome
                    ? 'text-white border border-white/40 hover:bg-white/10'
                    : 'text-teal-700 border border-teal-200 hover:bg-teal-50'
                }`}>
                {t('signIn', 'Sign In')}
              </Link>
              <Link to="/register"
                className="text-sm font-medium px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all shadow-sm">
                {t('register', 'Register')}
              </Link>
            </div>
            {/* Mobile toggle */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2">
              {mobileOpen
                ? <X className={`w-6 h-6 ${isHome ? 'text-white' : 'text-gray-700'}`} />
                : <Menu className={`w-6 h-6 ${isHome ? 'text-white' : 'text-gray-700'}`} />}
            </button>
          </div>
          {/* Mobile menu */}
          {mobileOpen && (
            <div className="md:hidden bg-white border-t shadow-lg px-4 py-4 space-y-3">
              <Link to="/" onClick={() => setMobileOpen(false)} className="block text-gray-700 font-medium py-2">
                {t('home', 'Home')}
              </Link>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="block text-gray-700 font-medium py-2">
                {t('signIn', 'Sign In')}
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="block bg-teal-600 text-white text-center py-2.5 rounded-lg font-medium">
                {t('register', 'Register')}
              </Link>
              <div className="flex items-center justify-end py-2 border-t border-gray-100">
                <button
                  onClick={() => {
                    setMobileOpen(false)
                    setSettingsOpen(true)
                  }}
                  className="flex items-center gap-1.5 text-sm text-gray-600 font-medium py-1 px-2 rounded-lg hover:bg-gray-100"
                >
                  <Settings className="w-4 h-4 text-teal-600" />
                  <span>{t('settings', 'Settings')}</span>
                </button>
              </div>
            </div>
          )}
        </nav>
      ) : (
        /* Authenticated navbar */
        <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-teal-700">
              <Activity className="w-7 h-7" />
              <span>{t('brandName', 'PulseForge')}</span>
            </Link>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSettingsOpen(true)}
                className="p-1.5 text-gray-500 hover:text-teal-700 hover:bg-gray-100 rounded-lg transition-colors ml-2 translate-x-2"
                title={t('settingsTitle')}
              >
                <Settings className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {user?.role === 'doctor'
                  ? <Stethoscope className="w-4 h-4 text-teal-600" />
                  : <User className="w-4 h-4 text-emerald-600" />}
                <span className="hidden sm:inline">{user?.role === 'doctor' ? `Dr. ${user?.name || 'Doctor'}` : (user?.name || 'User')}</span>
                <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full text-xs capitalize font-medium">
                  {user?.role === 'doctor' ? t('doctor', 'Doctor') : t('patient', 'User')}
                </span>
              </div>
              <button onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">{t('logout', 'Logout')}</span>
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Internal System Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  )
}
