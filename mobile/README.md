# HealthMonitor — Mobile App (React Native)

Standalone React Native mobile application for the **Smart Health Monitoring System**.
Built with **100% visual and functional parity** to the React web frontend, featuring unified design tokens, dual Doctor and Patient portals in a single app, real-time Firebase ESP32 vitals telemetry, continuous AI simulator, and integrated AI Clinical Decision Support with Gemini.

---

## 📱 Features

1. **Unified Design System & Tokens**
   - Exact color palettes, card elevations, badge styles, and typography from the web app (`src/constants/theme.js`).
2. **Dual Portals in One App**
   - **Doctor Portal**: Multi-patient dashboard, live vital monitoring, continuous simulator, temporal trends, AI retraining, patient registration.
   - **Patient Portal**: Personal vitals dashboard, NEWS2 score, risk category banner (0-100), automated clinical alerts, health trends.
3. **Real-time Hardware Telemetry (Firebase)**
   - Live stream from ESP32 MAX30102 (Heart Rate & SpO2) and LM35 (Temperature) sensors.
   - WiFi configuration manager for IoT hardware.
4. **AI Health Assistant Drawer**
   - Floating green bot button (`ChatLauncher.js`) opening a clinical conversation drawer (`AIChat.js`) supported by multilingual Gemini API.
5. **Continuous Monitoring Simulator**
   - Simulates 8 clinical scenarios (Routine, Mild Fever, High Fever, Respiratory Distress, Cardiac Irregularity, Gradual Deterioration, Sepsis, Post-Treatment Recovery).
6. **Clinical Health Reports**
   - 8 derived clinical parameters: Shock Index, Oxygen Delivery Index (ODI), STRS, Mean Arterial Pressure (MAP), MEWS score, RR Proxy, Rate Pressure Product (RPP), Body Surface Area (BSA).

---

## 🚀 Getting Started

### 1. Install Dependencies
Navigate into the `mobile` directory and install the packages:
```bash
cd mobile
npm install
```

### 2. Start the App with Expo
```bash
npm start
# or
npx expo start
```

### 3. Running on Devices
- **Android Emulator**: Press `a` in the terminal (default connects to `http://10.0.2.2:5000/api`).
- **iOS Simulator**: Press `i` in the terminal (default connects to `http://localhost:5000/api`).
- **Physical Phone (Expo Go)**: Scan the QR code with the Expo Go app. To connect to your local backend, tap the **Settings** icon in the top-right of the header and enter your machine's local network IP (e.g. `http://192.168.1.15:5000/api`).

---

## 📂 Project Structure

```
mobile/
├── App.js                    # Root Provider, Navigation router, and Navbar
├── app.json                  # Expo mobile configuration
├── package.json              # React Native & Expo dependencies
└── src/
    ├── api/                  # REST API client with configurable base URL
    ├── auth/                 # AuthProvider with AsyncStorage session persistence
    ├── components/           # Mobile adapted UI components
    │   ├── AIChat.js         # Interactive AI chat drawer
    │   ├── AlertsPanel.js    # Critical, warning, and info alerts
    │   ├── AutoMonitor.js    # Continuous vital sign simulator
    │   ├── ChatLauncher.js   # Floating bot button & slide-up drawer
    │   ├── Icons.js          # Crisp SVG vector icon suite
    │   ├── LiveMonitor.js    # Real-time ESP32 sensor monitor
    │   ├── Navbar.js         # Header with branding, role badge, language & server config
    │   ├── PatientForm.js    # Doctor's register patient form
    │   ├── VitalsChart.js    # Multi-series vital trend SVG line chart
    │   └── WifiManager.js    # ESP32 WiFi network configuration
    ├── constants/
    │   └── theme.js          # Centralized theme tokens (colors, typography, radii, shadows)
    ├── context/
    │   └── I18nContext.js    # Multilingual translation state (EN, HI, MR)
    ├── firebase.js           # Firebase RTDB listeners for live vitals & WiFi
    ├── pages/
    │   ├── DoctorDashboard.js# Doctor portal home
    │   ├── Home.js           # Public landing screen with hero, about & clinical cards
    │   ├── Login.js          # Authentication screen
    │   ├── PatientDashboard.js# Patient portal home
    │   ├── PatientDetail.js  # 4-tab patient telemetry detail screen
    │   ├── Register.js       # Doctor & Patient registration with role switcher
    │   └── ReportView.js     # Full clinical assessment report
    └── utils/
        └── predictionGate.js # Clinical UX prediction gating & signal quality filters
```
