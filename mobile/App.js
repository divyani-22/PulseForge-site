import React, { useState } from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { I18nProvider } from './src/context/I18nContext';
import Navbar from './src/components/Navbar';
import ChatLauncher from './src/components/ChatLauncher';
import Home from './src/pages/Home';
import Login from './src/pages/Login';
import Register from './src/pages/Register';
import DoctorDashboard from './src/pages/DoctorDashboard';
import PatientDashboard from './src/pages/PatientDashboard';
import PatientDetail from './src/pages/PatientDetail';
import ReportView from './src/pages/ReportView';
import ErrorBoundary from './src/components/ErrorBoundary';
import { COLORS } from './src/constants/theme';

function MainNavigator() {
  const { user } = useAuth();
  const [currentRoute, setCurrentRoute] = useState(user ? 'Dashboard' : 'Home');
  const [routeParams, setRouteParams] = useState({});

  const navigate = (routeName, params = {}) => {
    setCurrentRoute(routeName);
    setRouteParams(params);
  };

  const renderScreen = () => {
    if (!user) {
      switch (currentRoute) {
        case 'Login':
          return <Login onNavigate={navigate} />;
        case 'Register':
          return <Register onNavigate={navigate} />;
        case 'Home':
        default:
          return <Home onNavigate={navigate} />;
      }
    }

    // Authenticated Portal Router
    switch (currentRoute) {
      case 'PatientDetail':
        return <PatientDetail routeParams={routeParams} onNavigate={navigate} />;
      case 'ReportView':
        return <ReportView routeParams={routeParams} onNavigate={navigate} />;
      case 'Dashboard':
      default:
        if (user.role === 'doctor') {
          return <DoctorDashboard onNavigate={navigate} />;
        }
        return <PatientDashboard onNavigate={navigate} />;
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle={currentRoute === 'Home' && !user ? 'light-content' : 'dark-content'}
        backgroundColor={currentRoute === 'Home' && !user ? COLORS.primary : COLORS.white}
      />
      {/* Sticky Header Navbar */}
      <ErrorBoundary>
        <Navbar currentRoute={currentRoute} onNavigate={navigate} />
      </ErrorBoundary>

      {/* Main Content Area */}
      <View style={styles.mainContainer}>
        <ErrorBoundary message="Unable to load view. Please return home or retry.">
          {renderScreen()}
        </ErrorBoundary>
      </View>

      {/* Floating AI Health Assistant Drawer */}
      <ErrorBoundary>
        <ChatLauncher />
      </ErrorBoundary>
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <I18nProvider>
        <MainNavigator />
      </I18nProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    height: Platform.OS === 'web' ? '100vh' : '100%',
    backgroundColor: COLORS.screenBg,
  },
  mainContainer: {
    flex: 1,
  },
});
