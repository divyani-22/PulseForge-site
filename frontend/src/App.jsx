import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import Navbar from './components/Navbar'
import ChatLauncher from './components/ChatLauncher'
import ErrorBoundary from './components/ErrorBoundary'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import DoctorDashboard from './pages/DoctorDashboard'
import PatientDashboard from './pages/PatientDashboard'
import PatientDetail from './pages/PatientDetail'
import ReportView from './pages/ReportView'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RoleDashboard() {
  const { user } = useAuth()
  if (user?.role === 'doctor') return <DoctorDashboard />
  return <PatientDashboard />
}

function App() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <ErrorBoundary>
        <Navbar />
      </ErrorBoundary>
      <ErrorBoundary>
        <ChatLauncher />
      </ErrorBoundary>
      <ErrorBoundary message="Unable to load page view. Please refresh or try again.">
        {user ? (
        <main className="max-w-7xl mx-auto px-4 pt-6 pb-28">
          <Routes>
            <Route path="/" element={<RoleDashboard />} />
            <Route path="/patient/:id" element={<PatientDetail />} />
            <Route path="/patient/:id/report" element={<ReportView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      ) : (
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
      </ErrorBoundary>
    </div>
  )
}

export default App
