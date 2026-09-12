<div align="center">
  # ⚡ PulseForge — Smart User Monitoring System
  
  **Real-Time Vitals Telemetry • Multi-Class ML Risk Stratification • Context-Aware Gemini AI Assistant**

  <p align="center">
    <a href="https://pulseforge-divyani22.vercel.app" target="_blank">
      <img src="https://img.shields.io/badge/🚀_Live_Demo-pulseforge--divyani22.vercel.app-00DC82?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" />
    </a>
    <a href="https://frontend-divyani22.vercel.app" target="_blank">
      <img src="https://img.shields.io/badge/🔗_Mirror-frontend--divyani22.vercel.app-0070F3?style=for-the-badge&logo=vercel&logoColor=white" alt="Mirror Link" />
    </a>
  </p>

  [![React](https://img.shields.io/badge/Frontend-React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Bundler-Vite_8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![TailwindCSS](https://img.shields.io/badge/Styling-TailwindCSS_4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Flask](https://img.shields.io/badge/Backend-Flask_REST-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
  [![Python](https://img.shields.io/badge/ML-Scikit--Learn_Python_3.10-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
  [![Google Gemini](https://img.shields.io/badge/AI-Google_Gemini_2.5-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
  [![Hardware](https://img.shields.io/badge/Hardware-ESP32_+_MAX30102-E7352C?style=for-the-badge&logo=espressif&logoColor=white)](https://www.espressif.com/)

</div>


## 📑 Table of Contents
- [✨ Key Features](#-key-features)
  - [🧑‍⚕️ Doctor Portal](#️-doctor-portal)
  - [🤒 Patient Portal](#-patient-portal)
  - [🤖 Floating AI Health Assistant](#-floating-ai-health-assistant)
- [📸 Application Walkthrough & Screenshots](#-application-walkthrough--screenshots)
- [🏗️ System Architecture](#️-system-architecture)
  - [1. End-to-End System Topology](#1-end-to-end-system-topology)
  - [2. Real-Time Vitals & ML Risk Pipeline](#2-real-time-vitals--ml-risk-pipeline)
  - [3. Context-Aware AI Chatbot Reasoning Pipeline](#3-context-aware-ai-chatbot-reasoning-pipeline)
- [🧠 Machine Learning & Clinical Risk Engine](#-machine-learning--clinical-risk-engine)
- [🔌 Hardware & IoT Telemetry Architecture](#-hardware--iot-telemetry-architecture)
- [🛠️ Technology Stack](#️-technology-stack)
- [🚀 Quickstart & Setup Guide](#-quickstart--setup-guide)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup](#1-backend-setup-python--flask)
  - [2. Frontend Setup](#2-frontend-setup-react--vite)
  - [3. Hardware Setup (Optional ESP32)](#3-hardware-setup-optional-esp32)
- [📡 API Reference](#-api-reference)

---

## ✨ Key Features

### 🧑‍⚕️ Doctor Portal
* **Intelligent User Triage:** Unified roster displaying all assigned users with immediate AI-calculated Risk Levels (Low, Moderate, High, Critical) and NEWS2 scores.
* **Live Telemetry & Temporal Trends:** Real-time stream visualization with interactive Recharts charting Heart Rate, Blood Oxygen (SpO2), and Temperature over time.
* **Automated Clinical Diagnostic Reports:** One-click generation of comprehensive medical assessment reports detailing differential diagnosis probabilities, hemodynamic derivations (Shock Index, Mean Arterial Pressure, Rate-Pressure Product), and WHO clinical protocols.
* **Continuous Monitoring & Telemetry Linking:** Integration with ESP32 devices via user identification codes and remote Wi-Fi configuration.

### 👤 User Portal
* **Personalized Health Dashboard:** Clean, intuitive interface displaying live vital metrics, status indicators, and historical recovery/stability trends.
* **Predictive Early Warning:** Immediate visual feedback when vitals deviate from baseline, empowering users to seek timely intervention.
* **Automated Health Assessment:** Self-service diagnostic summaries explaining current vital stability in plain, reassuring language.

### 🤖 Context-Aware AI Health Assistant
* **Context-Grounded Medical Intelligence:** Powered by Google Gemini, the chatbot injects the user's age, BMI, comorbidities, latest vitals, and 24-hour temporal slope directly into the reasoning prompt.
* **Multilingual Interaction:** Communicates fluidly in **English**, **Hindi (हिंदी)**, and **Marathi (मराठी)** based on user preference.
* **Clinical Safety Guardrails:** Strict conservative medical prompting prevents hallucinated diagnoses, refuses unauthorized drug prescriptions, and provides immediate emergency triage protocols.

---

## 📸 Application Walkthrough & Screenshots

### 1️⃣ Intelligent Doctor Dashboard
High-level operational overview for physicians, showcasing assigned patient rosters, risk categories, and direct clinical action shortcuts.

<div align="center">
  <img src="assets/screenshots/doctor_dashboard.png" alt="Doctor Dashboard" width="95%" style="border-radius: 10px; border: 1px solid #e2e8f0; box-shadow: 0 8px 24px rgba(0,0,0,0.08);" />
</div>

<br/>

### 2️⃣ Patient Detail & Live Monitoring
Detailed patient inspection view featuring real-time vital gauges, historical multi-metric temporal graphs, and physiological trend trajectories.

<div align="center">
  <img src="assets/screenshots/patient_live.png" alt="Patient Live Vitals and Temporal Trends" width="95%" style="border-radius: 10px; border: 1px solid #e2e8f0; box-shadow: 0 8px 24px rgba(0,0,0,0.08);" />
</div>

<br/>

### 3️⃣ AI Predictive Clinical Diagnostic Report
Automated clinical report summarizing multi-class ML classification, probability distributions, MEWS/NEWS2 scores, and WHO self-care guidance.

<div align="center">
  <img src="assets/screenshots/report.png" alt="Clinical Diagnostic Report" width="95%" style="border-radius: 10px; border: 1px solid #e2e8f0; box-shadow: 0 8px 24px rgba(0,0,0,0.08);" />
</div>

<br/>

### 4️⃣ Dedicated Patient Portal Dashboard
Patient-facing interface providing personal health tracking, vital sign summaries, trend indicators, and access to their full clinical report.

<div align="center">
  <img src="assets/screenshots/patient_portal.png" alt="Patient Portal Dashboard" width="95%" style="border-radius: 10px; border: 1px solid #e2e8f0; box-shadow: 0 8px 24px rgba(0,0,0,0.08);" />
</div>

<br/>

### 5️⃣ Context-Aware AI Medical Assistant (Chatbot)
Floating conversational agent capable of analyzing live telemetry and delivering immediate, conservative guidance tailored to the patient's status.

<div align="center">
  <img src="assets/screenshots/chatbot.png" alt="AI Medical Chatbot Assistant" width="95%" style="border-radius: 10px; border: 1px solid #e2e8f0; box-shadow: 0 8px 24px rgba(0,0,0,0.08);" />
</div>

<br/>

### 6️⃣ Authentication & Access Gate
Role-based portal with streamlined login, multi-factor verification, and registration for both doctors and patients.

<div align="center">
  <img src="assets/screenshots/login_portal.png" alt="Login and Registration Portal" width="95%" style="border-radius: 10px; border: 1px solid #e2e8f0; box-shadow: 0 8px 24px rgba(0,0,0,0.08);" />
</div>

---

## 🏗️ System Architecture

### 1. End-to-End System Topology

```mermaid
graph TD
    subgraph Hardware_IoT["🔌 Hardware & IoT Layer"]
        S1["MAX30102 PPG Sensor<br/>(Heart Rate & SpO2)"] --> MCU["ESP32 Microcontroller<br/>(Wi-Fi Telemetry Node)"]
        S2["DS18B20 / MLX90614<br/>(Body Temperature)"] --> MCU
        MCU -- "JSON HTTP POST<br/>/api/patients/{id}/vitals" --> API
    end

    subgraph Backend_Core["⚙️ Backend Server (Flask RESTful API)"]
        API["Flask API Router & Auth Controller"]
        DB[("SQLite Database<br/>users • patients • vitals")]
        API <--> DB

        subgraph ML_Risk_Engine["🧠 ML & Clinical Engine"]
            PIPE["Scikit-Learn Pipeline<br/>(MODEL3.py)"]
            NORM["StandardScaler & LabelEncoder"]
            CLF["Gradient Boosting & Random Forest<br/>12 Clinical Scenarios"]
            SCORE["Clinical Calculator<br/>MEWS • NEWS2 • Shock Index • MAP"]
            PROTO["WHO Protocol Matcher<br/>Clinical Knowledge Base"]
            
            NORM --> CLF
            PIPE --> NORM
            PIPE --> SCORE
            PIPE --> PROTO
        end

        subgraph AI_Context["🤖 Generative AI Engine"]
            CTX["Context Aggregator<br/>(Demographics + Telemetry + Trends)"]
            GUARD["Medical Safety Prompt Gate<br/>(Non-diagnostic • Emergency Triage)"]
            GEMINI["Google Gemini 2.5 Flash API"]
            
            CTX --> GUARD --> GEMINI
        end

        API --> PIPE
        API --> CTX
    end

    subgraph Frontend_Client["🖥️ Frontend Client (React 19 + Vite)"]
        DOC_UI["🧑‍⚕️ Doctor Portal<br/>Roster • Live Monitoring • Clinical Reports"]
        PAT_UI["🤒 Patient Portal<br/>Personal Metrics • Historical Trends"]
        CHAT_UI["💬 Multilingual AI Chatbot<br/>(English • Hindi • Marathi)"]
        
        API <== "JSON REST API" ==> DOC_UI
        API <== "JSON REST API" ==> PAT_UI
        GEMINI <== "Contextual Guidance" ==> CHAT_UI
    end
```

---

### 2. Real-Time Vitals & ML Risk Pipeline

```mermaid
flowchart TD
    A["Raw Vitals Telemetry Ingested<br/>(HR, SpO2, Temp, Timestamp)"] --> B{"Input Validation & Schema Check"}
    B -- Invalid --> ERR["400 Bad Request / Discard"]
    B -- Valid --> C["Store Raw Record in SQLite `vitals`"]

    C --> D["Feature Engineering & Physiological Derivations"]
    D --> D1["Shock Index = HR / SBP"]
    D --> D2["MAP = (2*DBP + SBP) / 3"]
    D --> D3["MEWS / NEWS2 Calculation"]
    D --> D4["Rate-Pressure Product & Stress Index"]

    D1 & D2 & D3 & D4 --> E["Multi-Class ML Inference<br/>Gradient Boosting Classifier"]
    
    E --> F["Probability Distribution across 12 Scenarios<br/>(Healthy, Hypoxia, Sepsis, Cardiac Event, etc.)"]
    F --> G["Risk Stratification & Scoring (0 - 100)"]
    
    G --> H{"Risk Category"}
    H -- "< 20" --> R1["🟢 LOW RISK<br/>Routine self-care monitoring"]
    H -- "20 - 50" --> R2["🟡 MODERATE RISK<br/>Increased monitoring frequency"]
    H -- "> 50" --> R3["🔴 HIGH / CRITICAL RISK<br/>Immediate clinical escalation alert"]

    R1 & R2 & R3 --> I["Package Assessment JSON & Broadcast to Frontend"]
```

---

### 3. Context-Aware AI Chatbot Reasoning Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor Patient as 🤒 Patient
    participant UI as 💬 Chat Drawer (React)
    participant API as ⚙️ Flask API (/api/chat)
    participant DB as 🗄️ SQLite DB
    participant Engine as 🧠 Health Engine & Trends
    participant Gemini as 🤖 Google Gemini API

    Patient->>UI: Enters query ("I feel dizzy, are my vitals okay?")
    UI->>API: POST /api/chat { patient_id, message, lang, history }
    
    API->>DB: Query patient profile (Age, Gender, BMI, comorbidities)
    API->>DB: Query latest recorded vitals (HR, SpO2, Temp)
    API->>Engine: Compute 24h vital trends (HR slope, SpO2 stability)
    
    Note over API: Synthesize Context Envelope:<br/>• Patient: 22y Female, BMI: 24<br/>• Current: HR 75, SpO2 98%, Temp 36.6°C<br/>• ML Prediction: Healthy (Confidence: 47%)<br/>• NEWS2 Score: 12/8 (Stable)
    
    API->>API: Inject Clinical Safety System Instruction<br/>(Conservative, no prescriptions, emergency triage)
    API->>Gemini: generate_content(contents, system_instruction, lang)
    Gemini-->>API: Streamed plain-language medical response
    API-->>UI: Return JSON { reply }
    UI-->>Patient: Render localized advice in Chat UI
```

---

## 🧠 Machine Learning & Clinical Risk Engine

The intelligence layer combines rule-based clinical early warning scores with supervised machine learning:

| Component | Specification | Description |
| :--- | :--- | :--- |
| **Model Algorithm** | Gradient Boosting & Random Forest | Multi-class classification trained on comprehensive physiological datasets. |
| **Classified Scenarios** | 12 Clinical Conditions | `healthy`, `hypoxia`, `fever`, `asthma_exacerbation`, `copd_exacerbation`, `heart_failure`, `sepsis`, `respiratory_distress`, `cardiac_event`, `hypertension_crisis`, `pneumonia`, `critical`. |
| **Hemodynamic Derivations** | MEWS & NEWS2 | Modified Early Warning Score & National Early Warning Score 2 composite calculations. |
| **Cardiovascular Proxies** | Shock Index, MAP, RPP | Non-invasive derivation of Shock Index ($SI = \frac{HR}{SBP}$), Mean Arterial Pressure ($MAP$), and Rate-Pressure Product. |
| **Clinical Guidelines** | WHO Self-Care 2019 | Standardized, evidence-based triage and self-care steps matched to active scenario. |

---

## 🔌 Hardware & IoT Telemetry Architecture

The system supports real-time hardware telemetry transmission from portable edge devices:

* **Microcontroller:** ESP32-WROOM-32 (Dual-core 240MHz, 2.4GHz Wi-Fi + BLE).
* **PPG Pulse Oximeter:** MAX30102 optical sensor (I2C address `0x57`) measuring real-time Photoplethysmogram waveforms for Heart Rate & SpO2.
* **Temperature Sensor:** DS18B20 1-Wire digital probe or MLX90614 infrared ambient/skin sensor.
* **Firmware:** Arduino/C++ (`sketch_oct4a/sketch_oct4a.ino`) with automated Wi-Fi reconnect and JSON serialization.

```
[ MAX30102 PPG ] --- (I2C: SDA/SCL) ---> [ ESP32 MCU ]
[ DS18B20 Temp ] --- (1-Wire: GPIO) ---> [ ESP32 MCU ]
                                               |
                                        (Wi-Fi 802.11 b/g/n)
                                               |
                                               v
                                [ Flask API: /api/patients/{id}/vitals ]
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React.js 19, Vite 8, React Router 7 |
| **Styling & UI** | TailwindCSS 4, Lucide React Icons |
| **Data Visualization** | Recharts 3 (Interactive Time-series Area & Line Charts) |
| **Backend Framework** | Python 3.10+, Flask RESTful API, Flask-CORS |
| **Machine Learning** | Scikit-Learn, Pandas, NumPy, Joblib |
| **Generative AI** | Google Generative AI SDK (`google-genai`), Gemini 2.5 Flash |
| **Database** | SQLite3 with Thread-safe Connection Pools |
| **Hardware** | ESP32, MAX30102 (PPG), DS18B20/MLX90614 |

---

## 🚀 Quickstart & Setup Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10 or higher
- **Google Gemini API Key**: Obtain from [Google AI Studio](https://aistudio.google.com/app/apikey)

### 1. Backend Setup (Python / Flask)
```bash
# Clone the repository
git clone https://github.com/divyani-22/Cep-project.git
cd Cep-project/backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure your Gemini API Key
# Create a .env file in the backend directory:
echo GEMINI_API_KEY=your_gemini_api_key_here > .env

# Initialize database and start Flask API server
python app.py
```
*Backend runs on `http://localhost:5000`*

### 2. Frontend Setup (React / Vite)
```bash
# In a new terminal window, navigate to frontend:
cd Cep-project/frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
*Frontend runs on `http://localhost:5173`*

### 3. Hardware Setup (Optional ESP32)
1. Open `sketch_oct4a/sketch_oct4a.ino` in Arduino IDE.
2. Install `SparkFun MAX3010x Pulse and Proximity Sensor Library` and `OneWire` / `DallasTemperature`.
3. Configure your local Wi-Fi SSID, Password, and Backend host IP (`http://<YOUR_PC_IP>:5000/api/patients/<ID>/vitals`).
4. Flash the code to your ESP32 board.

---

## 📡 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user (Doctor or Patient) |
| `POST` | `/api/auth/register` | Register new clinician or patient account |
| `GET` | `/api/doctors` | List all registered doctors |
| `GET` | `/api/patients` | List patients linked to authenticated doctor |
| `GET` | `/api/patients/<id>` | Fetch detailed patient profile and recent vitals |
| `POST` | `/api/patients/<id>/vitals` | Ingest new physiological telemetry reading |
| `GET` | `/api/patients/<id>/vitals` | Query historical time-series vitals readings |
| `GET` | `/api/patients/<id>/trends` | Compute temporal slope and stability indicators |
| `GET` | `/api/patients/<id>/report` | Generate comprehensive AI diagnostic clinical report |
| `POST` | `/api/chat` | Send conversational prompt to context-aware Gemini AI assistant |
| `GET` | `/api/health` | Health check endpoint and ML model status |

---

<div align="center">
  <b>Built with ❤️ for the future of connected and proactive healthcare.</b>
</div>
