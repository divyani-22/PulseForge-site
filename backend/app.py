"""
app.py - Flask API server for Health Monitoring Device
"""

import sys
import os
import sqlite3
import json
import hashlib
from datetime import datetime
import socket
import requests

# Prevent Windows IPv6 DNS resolution timeouts
try:
    import urllib3.util.connection as urllib3_cn
    urllib3_cn.allowed_gai_family = lambda: socket.AF_INET
except Exception:
    pass

import traceback
from google import genai
from dotenv import load_dotenv

# Ensure we load the .env file from the same directory as app.py
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))

# Configure Gemini client
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
gemini_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, request, jsonify, g
from flask_cors import CORS

import MODEL3
from health_engine import age_to_age_group

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.errorhandler(500)
def handle_500(e):
    return jsonify({"error": "Internal server error", "details": str(e)}), 500

@app.errorhandler(Exception)
def handle_exception(e):
    traceback.print_exc()
    return jsonify({"error": str(e)}), 500

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hmd.db")

# ── Database setup ──

def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(exception):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()


def init_db():
    db = sqlite3.connect(DB_PATH)
    db.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('doctor', 'patient')),
            doctor_id INTEGER,
            patient_link_id TEXT,
            specialization TEXT DEFAULT '',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (doctor_id) REFERENCES users(id)
        )
    """)
    db.execute("""
        CREATE TABLE IF NOT EXISTS patients (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            age INTEGER NOT NULL,
            age_group TEXT NOT NULL,
            gender TEXT NOT NULL,
            bmi REAL NOT NULL,
            comorbidities TEXT DEFAULT '',
            activity_level TEXT DEFAULT 'light',
            doctor_id INTEGER,
            device_id TEXT DEFAULT '',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (doctor_id) REFERENCES users(id)
        )
    """)
    db.execute("""
        CREATE TABLE IF NOT EXISTS vitals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT NOT NULL,
            heart_rate REAL NOT NULL,
            spo2 REAL NOT NULL,
            temperature REAL NOT NULL,
            timestamp TEXT NOT NULL,
            prediction TEXT,
            confidence REAL,
            news2_score INTEGER,
            assessment_json TEXT,
            FOREIGN KEY (patient_id) REFERENCES patients(id)
        )
    """)
    # Add doctor_id column to patients if missing (migration for existing DBs)
    try:
        db.execute("ALTER TABLE patients ADD COLUMN doctor_id INTEGER")
    except sqlite3.OperationalError:
        pass
    # Add device_id column for linking ESP32 devices
    try:
        db.execute("ALTER TABLE patients ADD COLUMN device_id TEXT DEFAULT ''")
    except sqlite3.OperationalError:
        pass
    db.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    """)
    db.commit()
    db.close()


# ── ML Model state ──

_model = None
_le = None


def get_model():
    global _model, _le
    if _model is None:
        try:
            _model, _le = MODEL3.load_model()
        except FileNotFoundError:
            return None, None
    return _model, _le


# ── API Routes ──

@app.route("/")
def index():
    return jsonify({
        "message": "Health Monitoring API is running.",
        "frontend_url": "http://localhost:5173"
    })

@app.route("/api/health", methods=["GET"])
def health_check():
    model, le = get_model()
    return jsonify({
        "status": "ok",
        "model_loaded": model is not None,
        "timestamp": datetime.now().isoformat(),
    })


# ── Auth ──

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.json
    required = ["email", "password", "name", "role"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    if data["role"] not in ("doctor", "patient"):
        return jsonify({"error": "Role must be 'doctor' or 'patient'"}), 400

    db = get_db()

    # Check if email exists
    existing = db.execute("SELECT id FROM users WHERE email = ?", (data["email"],)).fetchone()
    if existing:
        return jsonify({"error": "Email already registered"}), 409

    doctor_id = None
    patient_link_id = None

    if data["role"] == "patient":
        # Patient must provide a doctor code (doctor's user ID) to link
        doctor_id = data.get("doctor_id")
        if doctor_id:
            doc = db.execute("SELECT id FROM users WHERE id = ? AND role = 'doctor'", (doctor_id,)).fetchone()
            if not doc:
                return jsonify({"error": "Invalid doctor code"}), 400

    db.execute(
        """INSERT INTO users (email, password_hash, name, role, doctor_id, specialization)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (data["email"], hash_password(data["password"]), data["name"],
         data["role"], doctor_id, data.get("specialization", ""))
    )
    db.commit()

    user = db.execute("SELECT * FROM users WHERE email = ?", (data["email"],)).fetchone()
    user_dict = dict(user)
    del user_dict["password_hash"]

    # If registering as patient, also create a patient record automatically
    if data["role"] == "patient" and all(k in data for k in ["age", "gender", "bmi"]):
        age_group = age_to_age_group(int(data["age"]))
        patient_link_id = f"P{user_dict['id']:06d}"
        try:
            db.execute(
                "INSERT INTO patients (id, name, age, age_group, gender, bmi, comorbidities, activity_level, doctor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (patient_link_id, data["name"], int(data["age"]), age_group,
                 data["gender"], float(data["bmi"]),
                 data.get("comorbidities", ""), data.get("activity_level", "light"),
                 doctor_id)
            )
            db.execute("UPDATE users SET patient_link_id = ? WHERE id = ?", (patient_link_id, user_dict["id"]))
            db.commit()
            user_dict["patient_link_id"] = patient_link_id
        except sqlite3.IntegrityError:
            pass

    return jsonify(user_dict), 201


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json
    if not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email and password required"}), 400

    db = get_db()
    user = db.execute("SELECT * FROM users WHERE email = ?", (data["email"],)).fetchone()
    if not user or user["password_hash"] != hash_password(data["password"]):
        return jsonify({"error": "Invalid email or password"}), 401

    user_dict = dict(user)
    del user_dict["password_hash"]

    # For doctors, include patient count
    if user_dict["role"] == "doctor":
        count = db.execute(
            "SELECT COUNT(*) as cnt FROM patients WHERE doctor_id = ?", (user_dict["id"],)
        ).fetchone()["cnt"]
        user_dict["patient_count"] = count

    return jsonify(user_dict)


@app.route("/api/auth/user/<int:user_id>", methods=["GET"])
def get_user(user_id):
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        return jsonify({"error": "User not found"}), 404
    user_dict = dict(user)
    del user_dict["password_hash"]
    return jsonify(user_dict)


# ── Doctors ──

@app.route("/api/doctors", methods=["GET"])
def list_doctors():
    """List all doctors (for patient registration dropdown)."""
    db = get_db()
    doctors = db.execute("SELECT id, name, specialization FROM users WHERE role = 'doctor' ORDER BY name").fetchall()
    return jsonify([dict(d) for d in doctors])


# ── Patients ──

@app.route("/api/patients", methods=["GET"])
def list_patients():
    db = get_db()
    doctor_id = request.args.get("doctor_id", type=int)
    patient_link_id = request.args.get("patient_link_id")

    if patient_link_id:
        # Patient viewing their own record
        patients = db.execute("SELECT * FROM patients WHERE id = ?", (patient_link_id,)).fetchall()
    elif doctor_id:
        # Doctor viewing their patients
        patients = db.execute("SELECT * FROM patients WHERE doctor_id = ? ORDER BY created_at DESC", (doctor_id,)).fetchall()
    else:
        patients = db.execute("SELECT * FROM patients ORDER BY created_at DESC").fetchall()

    result = []
    for p in patients:
        p_dict = dict(p)
        latest = db.execute(
            "SELECT * FROM vitals WHERE patient_id = ? ORDER BY timestamp DESC LIMIT 1",
            (p["id"],)
        ).fetchone()
        count = db.execute(
            "SELECT COUNT(*) as cnt FROM vitals WHERE patient_id = ?",
            (p["id"],)
        ).fetchone()["cnt"]
        p_dict["latest_vitals"] = dict(latest) if latest else None
        p_dict["readings_count"] = count
        result.append(p_dict)
    return jsonify(result)


@app.route("/api/patients", methods=["POST"])
def create_patient():
    data = request.json
    required = ["name", "age", "gender", "bmi"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    patient_id = data.get("id", f"P{datetime.now().strftime('%H%M%S%f')[:8]}")
    age_group = age_to_age_group(int(data["age"]))

    db = get_db()
    try:
        db.execute(
            "INSERT INTO patients (id, name, age, age_group, gender, bmi, comorbidities, activity_level, doctor_id, device_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (patient_id, data["name"], int(data["age"]), age_group,
             data["gender"], float(data["bmi"]),
             data.get("comorbidities", ""), data.get("activity_level", "light"),
             data.get("doctor_id"), data.get("device_id", ""))
        )
        db.commit()
    except sqlite3.IntegrityError:
        return jsonify({"error": "Patient ID already exists"}), 409

    patient = db.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
    return jsonify(dict(patient)), 201


@app.route("/api/patients/<patient_id>/device", methods=["PUT"])
def update_patient_device(patient_id):
    """Link or unlink an ESP32 device to a patient."""
    data = request.json
    device_id = data.get("device_id", "")
    db = get_db()
    db.execute("UPDATE patients SET device_id = ? WHERE id = ?", (device_id, patient_id))
    db.commit()
    patient = db.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
    if not patient:
        return jsonify({"error": "Patient not found"}), 404
    return jsonify(dict(patient))


@app.route("/api/patients/<patient_id>", methods=["GET"])
def get_patient(patient_id):
    db = get_db()
    patient = db.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    p_dict = dict(patient)
    count = db.execute(
        "SELECT COUNT(*) as cnt FROM vitals WHERE patient_id = ?", (patient_id,)
    ).fetchone()["cnt"]
    p_dict["readings_count"] = count
    return jsonify(p_dict)


@app.route("/api/patients/<patient_id>", methods=["DELETE"])
def delete_patient(patient_id):
    db = get_db()
    db.execute("DELETE FROM vitals WHERE patient_id = ?", (patient_id,))
    db.execute("DELETE FROM patients WHERE id = ?", (patient_id,))
    db.commit()
    return jsonify({"status": "deleted"})


# ── Vitals ──

@app.route("/api/patients/<patient_id>/vitals", methods=["POST"])
def record_vitals(patient_id):
    db = get_db()
    patient = db.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    data = request.json
    for field in ["heartRate", "spO2", "temperature"]:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    hr = float(data["heartRate"])
    spo2 = float(data["spO2"])
    temp = float(data["temperature"])
    timestamp = data.get("timestamp", datetime.now().isoformat())

    # Data quality validation (Section 11 of knowledge base)
    if hr < 20 or hr > 250:
        return jsonify({"error": "Heart rate out of valid range (20-250 BPM) - possible sensor artifact"}), 422
    if spo2 < 70 or spo2 > 100:
        return jsonify({"error": "SpO2 out of valid range (70-100%) - sensor error"}), 422
    if temp < 30 or temp > 44:
        return jsonify({"error": "Temperature out of valid range (30-44°C) - outside survival limits"}), 422

    # ML Prediction (includes risk, recommendations, derived vitals)
    prediction_result = None
    model, le = get_model()
    if model is not None:
        reading = {
            "heartRate": hr, "spO2": spo2, "temperature": temp,
            "age": patient["age"], "age_group": patient["age_group"],
            "gender": patient["gender"], "bmi": patient["bmi"],
            "comorbidities": patient["comorbidities"],
            "activity_level": patient["activity_level"],
        }
        prediction_result = MODEL3.predict_single(reading, model, le)

    # Risk score for DB storage
    risk_score = prediction_result["risk"]["numeric_score"] if prediction_result else 0

    # Store in DB
    db.execute(
        """INSERT INTO vitals (patient_id, heart_rate, spo2, temperature, timestamp,
           prediction, confidence, news2_score, assessment_json)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (patient_id, hr, spo2, temp, timestamp,
         prediction_result["prediction"] if prediction_result else None,
         prediction_result["confidence"] if prediction_result else None,
         int(risk_score),
         json.dumps(prediction_result) if prediction_result else None)
    )
    db.commit()

    return jsonify({
        "vitals": {"heartRate": hr, "spO2": spo2, "temperature": temp, "timestamp": timestamp},
        "prediction": prediction_result,
    }), 201


@app.route("/api/patients/<patient_id>/vitals", methods=["GET"])
def get_vitals(patient_id):
    db = get_db()
    limit = request.args.get("limit", 100, type=int)
    vitals = db.execute(
        "SELECT * FROM vitals WHERE patient_id = ? ORDER BY timestamp DESC LIMIT ?",
        (patient_id, limit)
    ).fetchall()
    result = []
    for v in vitals:
        v_dict = dict(v)
        if v_dict.get("assessment_json"):
            v_dict["assessment"] = json.loads(v_dict["assessment_json"])
            del v_dict["assessment_json"]
        result.append(v_dict)
    # Return in chronological order
    result.reverse()
    return jsonify(result)


# ── Predictions ──

@app.route("/api/patients/<patient_id>/predict", methods=["GET"])
def predict_patient(patient_id):
    """Run ML prediction on the latest vitals reading."""
    db = get_db()
    patient = db.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    latest = db.execute(
        "SELECT * FROM vitals WHERE patient_id = ? ORDER BY timestamp DESC LIMIT 1",
        (patient_id,)
    ).fetchone()
    if not latest:
        return jsonify({"error": "No vitals recorded for this patient"}), 404

    model, le = get_model()
    if model is None:
        return jsonify({"error": "Model not trained yet. POST /api/model/train first."}), 503

    reading = {
        "heartRate": latest["heart_rate"], "spO2": latest["spo2"],
        "temperature": latest["temperature"],
        "age": patient["age"], "age_group": patient["age_group"],
        "gender": patient["gender"], "bmi": patient["bmi"],
        "comorbidities": patient["comorbidities"],
        "activity_level": patient["activity_level"],
    }
    result = MODEL3.predict_single(reading, model, le)
    return jsonify(result)


# ── Trends ──

@app.route("/api/patients/<patient_id>/trends", methods=["GET"])
def get_trends(patient_id):
    """Compute temporal trend analysis for a patient."""
    db = get_db()
    patient = db.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    vitals = db.execute(
        "SELECT * FROM vitals WHERE patient_id = ? ORDER BY timestamp ASC LIMIT 50",
        (patient_id,)
    ).fetchall()

    if len(vitals) < 2:
        return jsonify({"error": "Need at least 2 readings for trend analysis"}), 400

    readings_list = [
        {"heartRate": v["heart_rate"], "spO2": v["spo2"],
         "temperature": v["temperature"], "timestamp": v["timestamp"]}
        for v in vitals
    ]

    trend_data = MODEL3.compute_temporal_features(readings_list)
    
    # Phase 8: CVD Risk Proxy Assessment
    latest_reading = readings_list[-1]
    cvd_risk = MODEL3.compute_cvd_risk_proxy(
        latest_reading["heartRate"], 
        latest_reading["spO2"], 
        latest_reading["temperature"], 
        patient["age"], 
        patient["bmi"]
    )
    trend_data["cvd_risk"] = cvd_risk

    return jsonify(trend_data)


# ── Reports ──

@app.route("/api/patients/<patient_id>/report", methods=["GET"])
def generate_patient_report(patient_id):
    """Generate comprehensive health report for a patient."""
    db = get_db()
    patient = db.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    vitals = db.execute(
        "SELECT * FROM vitals WHERE patient_id = ? ORDER BY timestamp ASC",
        (patient_id,)
    ).fetchall()
    if not vitals:
        return jsonify({"error": "No vitals recorded for this patient"}), 404

    latest = vitals[-1]

    # Prediction with risk + recommendations
    model, le = get_model()
    prediction_result = None
    if model is not None:
        reading = {
            "heartRate": latest["heart_rate"], "spO2": latest["spo2"],
            "temperature": latest["temperature"],
            "age": patient["age"], "age_group": patient["age_group"],
            "gender": patient["gender"], "bmi": patient["bmi"],
            "comorbidities": patient["comorbidities"],
            "activity_level": patient["activity_level"],
        }
        prediction_result = MODEL3.predict_single(reading, model, le)

    # Trends
    readings_list = [
        {"heartRate": v["heart_rate"], "spO2": v["spo2"],
         "temperature": v["temperature"], "timestamp": v["timestamp"]}
        for v in vitals
    ]
    trend_data = None
    if len(readings_list) >= 2:
        trend_data = MODEL3.compute_temporal_features(readings_list)

    # Build report
    from datetime import datetime as dt
    report = {
        "report_id": f"RPT-{dt.now().strftime('%Y%m%d%H%M%S')}",
        "generated_at": dt.now().isoformat(),
        "patient": {
            "id": patient["id"], "name": patient["name"],
            "age": patient["age"], "age_group": patient["age_group"],
            "gender": patient["gender"], "bmi": patient["bmi"],
            "comorbidities": patient["comorbidities"],
        },
        "vitals_summary": {
            "heart_rate": latest["heart_rate"],
            "spo2": latest["spo2"],
            "temperature": latest["temperature"],
        },
        "prediction": prediction_result,
        "trends": trend_data,
        "readings_count": len(vitals),
        "disclaimer": "This report is generated by an AI-based clinical decision support system. It does not replace professional medical advice. Always consult a qualified doctor for diagnosis and treatment.",
    }

    return jsonify(report)


# ── Model management ──

@app.route("/api/model/train", methods=["POST"])
def train_model_endpoint():
    """Train/retrain the ML model."""
    global _model, _le
    try:
        model, le, acc = MODEL3.train_model()
        _model = model
        _le = le
        return jsonify({
            "status": "trained",
            "accuracy": round(acc, 4),
            "classes": list(le.classes_),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/model/status", methods=["GET"])
def model_status():
    model, le = get_model()
    if model is None:
        return jsonify({"status": "not_trained", "classes": []})
    return jsonify({
        "status": "ready",
        "classes": list(le.classes_),
    })


from flask_cors import CORS, cross_origin

# ── AI Assistant (Phase 10 & 11) ──

@app.route("/api/chat", methods=["POST", "OPTIONS"])
@cross_origin(origins="*", headers=['Content-Type', 'Authorization'])
def chat():
    if request.method == "OPTIONS":
        return '', 200
        
    try:
        data = request.json or {}
        message = data.get("message", "")
        patient_id = data.get("patient_id")
        lang = data.get("lang", "en")
        frontend_history = data.get("history", [])
        vitals_input = data.get("vitals")
        
        if not message:
            return jsonify({"error": "Message required"}), 400
            
        gemini_api_key = os.environ.get("GEMINI_API_KEY", "")
        if not gemini_api_key:
            print("[\033[91mERROR\033[0m] GEMINI_API_KEY is not set in environment!")
            return jsonify({"reply": "AI Assistant is not configured on the server. Please set a valid GEMINI_API_KEY."}), 200

        db = get_db()
        context = ""
        readings_list = []
        patient = {}
        
        if patient_id:
            row = db.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
            if not row:
                row = db.execute(
                    "SELECT p.* FROM patients p JOIN users u ON u.patient_link_id = p.id WHERE u.id = ? OR u.patient_link_id = ?",
                    (patient_id, patient_id)
                ).fetchone()

            if row:
                patient = dict(row)
                vitals = db.execute(
                    "SELECT * FROM vitals WHERE patient_id = ? ORDER BY timestamp ASC LIMIT 50",
                    (patient['id'],)
                ).fetchall()
                
                context += f"Patient Profile:\nName: {patient.get('name', 'N/A')}, Age: {patient['age']}, Gender: {patient['gender']}, BMI: {patient.get('bmi', 'N/A')}, Comorbidities: {patient['comorbidities'] or 'None'}\n\n"
                
                readings_list = [
                    {"heartRate": v["heart_rate"], "spO2": v["spo2"],
                     "temperature": v["temperature"], "timestamp": v["timestamp"]}
                    for v in vitals
                ]
            else:
                context += "Note: Patient profile not found for the provided ID.\n\n"
        else:
            context += "Note: General medical inquiry. No specific patient data provided.\n\n"

        # Ingest live vitals context payload if supplied
        if vitals_input:
            if isinstance(vitals_input, list):
                for item in vitals_input:
                    if isinstance(item, dict) and ("heartRate" in item or "heart_rate" in item):
                        readings_list.append({
                            "heartRate": item.get("heartRate") or item.get("heart_rate"),
                            "spO2": item.get("spO2") or item.get("spo2"),
                            "temperature": item.get("temperature", 36.8),
                            "timestamp": item.get("timestamp", datetime.now().isoformat())
                        })
            elif isinstance(vitals_input, dict):
                hr = vitals_input.get("heartRate") or vitals_input.get("heart_rate")
                spo2 = vitals_input.get("spO2") or vitals_input.get("spo2")
                temp = vitals_input.get("temperature")
                if hr is not None and spo2 is not None:
                    readings_list.append({
                        "heartRate": float(hr),
                        "spO2": float(spo2),
                        "temperature": float(temp) if temp is not None else 36.8,
                        "timestamp": datetime.now().isoformat()
                    })
        
        if readings_list:
            latest = readings_list[-1]
            context += f"Latest Vitals:\nHR: {latest['heartRate']} bpm, SpO2: {latest['spO2']}%, Temp: {latest['temperature']}°C\n\n"
            
            try:
                trend_data = MODEL3.compute_temporal_features(readings_list)
                cvd_risk = MODEL3.compute_cvd_risk_proxy(
                    latest["heartRate"], latest["spO2"], latest["temperature"], patient.get("age", 30), patient.get("bmi", 22)
                )
                
                context += "Clinical AI Analysis:\n"
                context += f"- HR Trend: {trend_data.get('hr_trend', 'stable')}\n"
                context += f"- SpO2 Trend: {trend_data.get('spo2_trend', 'stable')}\n"
                context += f"- Deterioration Trend: {trend_data.get('deterioration_trend', 'stable')}\n"
                if trend_data.get('baseline_deviations'):
                    devs = trend_data['baseline_deviations']
                    context += f"- Baseline Deviations: HR {devs.get('hr_deviation')} bpm, SpO2 {devs.get('spo2_deviation')}%, Temp {devs.get('temp_deviation')}°C\n"
                
                context += f"- Proxy CVD Risk: {cvd_risk.get('risk_level', 'Unknown')} (Score: {cvd_risk.get('score', 0)})\n"
            except Exception as trend_err:
                print(f"[WARN] Trend/CVD computation failed: {trend_err}")
            
            # Check latest DB assessment if available
            if patient_id and 'vitals' in locals() and vitals:
                latest_db_row = vitals[-1]
                if latest_db_row['assessment_json']:
                    try:
                        assessment = json.loads(latest_db_row['assessment_json'])
                        context += f"- System Prediction: {assessment.get('prediction', 'Unknown')} (Risk: {assessment.get('risk', {}).get('category', 'Unknown')})\n"
                    except:
                        pass
        else:
            context += "Latest Vitals: None recorded yet.\n"
                    
        lang_name = 'Hindi' if lang == 'hi' else 'Marathi' if lang == 'mr' else 'English'
        system_instruction = (
            "You are an AI Health Assistant part of a smart portable patient monitoring system. "
            "Your role is to explain health metrics and provide general, conservative health guidance using ONLY the provided patient data context. "
            "CRITICAL RULES: "
            "1. NEVER provide a formal clinical diagnosis. "
            "2. NEVER prescribe medications or suggest dosage changes. "
            "3. NEVER invent or hallucinate missing vital readings or symptoms. "
            "4. Always advise the patient to consult their doctor for medical advice or if symptoms worsen. "
            "5. If the patient describes an emergency (e.g. chest pain, severe shortness of breath), instruct them to call emergency services immediately. "
            f"Respond clearly and accurately in this language: {lang_name}.\n\n"
            f"=== CONTEXT START ===\n{context}\n=== CONTEXT END ==="
        )

        # Build conversation history for Gemini REST API with strict alternation guarantee
        raw_turns = []
        for msg in (frontend_history or []):
            if not isinstance(msg, dict):
                continue
            content_text = (msg.get("content") or "").strip()
            if not content_text:
                continue
            
            # Filter out introductory greeting / welcome messages from assistant
            is_greeting = (
                "AI Health Assistant" in content_text or
                "health guidance" in content_text or
                "स्वास्थ्य सहायक" in content_text or
                "आरोग्य सहाय्यक" in content_text or
                "Hello! I am" in content_text or
                "नमस्ते!" in content_text or
                "नमस्कार!" in content_text
            )
            raw_role = msg.get("role")
            if is_greeting and raw_role == "assistant":
                continue
            
            role = "model" if raw_role == "assistant" else "user"
            raw_turns.append((role, content_text))
        
        # Current user message
        curr_msg_clean = (message or "").strip()
        if not curr_msg_clean:
            return jsonify({"reply": "Please type a health question or symptom to discuss."}), 200
        
        # If the history already ended with this exact user message, avoid duplicate turn
        if raw_turns and raw_turns[-1][0] == "user" and raw_turns[-1][1] == curr_msg_clean:
            pass
        else:
            raw_turns.append(("user", curr_msg_clean))
        
        # Gemini strictly requires:
        # 1. First turn MUST be 'user'
        # 2. Roles MUST strictly alternate (user -> model -> user -> model -> user)
        # 3. Final turn MUST be 'user'
        clean_turns = []
        for role, text in raw_turns:
            if not clean_turns:
                if role != "user":
                    continue  # Skip leading model/assistant messages
                clean_turns.append((role, text))
            else:
                last_role, last_text = clean_turns[-1]
                if role == last_role:
                    # Merge consecutive same-role turns to preserve strict alternation
                    clean_turns[-1] = (last_role, f"{last_text}\n{text}")
                else:
                    clean_turns.append((role, text))
        
        # Ensure we have at least the current user message
        if not clean_turns or clean_turns[-1][0] != "user":
            clean_turns.append(("user", curr_msg_clean))
            
        contents = [{"role": r, "parts": [{"text": t}]} for r, t in clean_turns]

        # Generate content via Gemini REST with model fallback
        payload = {
            "system_instruction": {
                "parts": [{"text": system_instruction}]
            },
            "contents": contents,
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 1024
            }
        }

        models_to_try = [
            "gemini-flash-lite-latest",
            "gemini-3.5-flash-lite",
            "gemini-3.1-flash-lite",
            "gemini-flash-latest"
        ]
        reply_text = None
        attempt_logs = []

        for model_name in models_to_try:
            try:
                endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={gemini_api_key}"
                res = requests.post(endpoint, json=payload, timeout=12)
                if res.status_code == 200:
                    res_json = res.json()
                    candidates = res_json.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts and "text" in parts[0]:
                            reply_text = parts[0]["text"]
                            break
                else:
                    attempt_logs.append(f"{model_name}: HTTP {res.status_code} - {res.text[:100]}")
            except Exception as call_err:
                attempt_logs.append(f"{model_name} exc: {call_err}")

        if reply_text:
            return jsonify({"reply": reply_text})
        else:
            log_summary = " | ".join(attempt_logs)
            print(f"[WARN] Gemini generation failed: {log_summary}", flush=True)
            try:
                with open("gemini_err.log", "w", encoding="utf-8") as f:
                    f.write(log_summary)
            except Exception:
                pass
            return jsonify({
                "reply": "I am currently unable to reach the medical intelligence server. Please check your network or try again shortly."
            }), 200
        
    except Exception as e:
        print("=== FLASK /api/chat CRASH LOG ===")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ── Dataset stats ──

@app.route("/api/dataset/stats", methods=["GET"])
def dataset_stats():
    """Return stats about the training dataset."""
    import pandas as pd
    try:
        df = pd.read_csv(MODEL3.CSV_PATH)
        return jsonify({
            "total_records": len(df),
            "scenarios": {k: int(v) for k, v in df["scenario"].value_counts().items()},
            "age_groups": {k: int(v) for k, v in df["age_group"].value_counts().items()},
            "gender_distribution": {k: int(v) for k, v in df["gender"].value_counts().items()},
            "vitals_ranges": {
                "heartRate": {"min": float(df["heartRate"].min()), "max": float(df["heartRate"].max()), "mean": round(float(df["heartRate"].mean()), 1)},
                "spO2": {"min": float(df["spO2"].min()), "max": float(df["spO2"].max()), "mean": round(float(df["spO2"].mean()), 1)},
                "temperature": {"min": float(df["temperature"].min()), "max": float(df["temperature"].max()), "mean": round(float(df["temperature"].mean()), 1)},
            },
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── System Settings ──

DEFAULT_SETTINGS = {
    "language": "en",
    "notifications": True,
    "theme": "light"
}

@app.route("/api/settings", methods=["GET"])
def get_settings():
    settings = dict(DEFAULT_SETTINGS)
    try:
        db = get_db()
        db.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        """)
        rows = db.execute("SELECT key, value FROM settings").fetchall()
        for row in rows:
            val = row["value"]
            try:
                val = json.loads(val)
            except Exception:
                pass
            settings[row["key"]] = val
    except Exception as e:
        print(f"Error getting settings: {e}")
    return jsonify(settings), 200


@app.route("/api/settings", methods=["POST"])
def update_settings():
    data = request.get_json(silent=True) or {}
    try:
        db = get_db()
        db.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        """)
        for k, v in data.items():
            db.execute(
                "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
                (str(k), json.dumps(v))
            )
        db.commit()
    except Exception as e:
        print(f"Error updating settings: {e}")

    settings = dict(DEFAULT_SETTINGS)
    try:
        db = get_db()
        rows = db.execute("SELECT key, value FROM settings").fetchall()
        for row in rows:
            val = row["value"]
            try:
                val = json.loads(val)
            except Exception:
                pass
            settings[row["key"]] = val
    except Exception:
        settings.update(data)

    return jsonify(settings), 200


if __name__ == "__main__":
    init_db()
    print("Initializing database...")

    # Auto-train model if not already trained
    model, le = get_model()
    if model is None:
        print("No trained model found. Training now...")
        try:
            _model, _le, acc = MODEL3.train_model()
            print(f"Model trained with accuracy: {acc:.4f}")
        except Exception as e:
            print(f"Warning: Could not train model: {e}")
            print("Start the server anyway. Train via POST /api/model/train")
    else:
        print("Loaded pre-trained model.")

    print("\nStarting Flask server on http://localhost:5000")
    app.run(debug=True, port=5000, host="0.0.0.0", use_debugger=False, use_reloader=True)
