from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib    # Para cargar los modelos .pkl
import pandas as pd
import numpy as np

# IMPORTANTE: Asegúrate de tener instalado lightgbm y xgboost si el pkl lo requiere
# pip install lightgbm xgboost scikit-learn pandas flask flask-cors

app = Flask(__name__)
CORS(app) # Permite conexión desde tu Dashboard HTML

# --- 1. CARGA DE MODELOS ---

print("⏳ Cargando modelos de Inteligencia Artificial...")

try:
    # REEMPLAZO: Ahora cargamos la versión 1.1

    modelo_v1 = joblib.load("modelo_champion1_1.pkl")
    print("✅ Nuevo Modelo Champion 1.1 (CatBoost) cargado correctamente.")
except Exception as e:
    print(f"⚠️ Alerta: No se pudo cargar el nuevo modelo_champion1_1.pkl ({e})")
    modelo_v1 = None

# El Champion 3 se queda igual, ya que es el "Maestro" que usas actualmente
try:
    modelo_v3 = joblib.load("modelo_champion3.pkl")
    print("✅ Modelo Champion 3 (Maestro) cargado.")
except Exception as e:
    print(f"❌ Error Crítico: No se cargó modelo_champion3.pkl ({e})")
    modelo_v3 = None


# --- 2. LÓGICA DE EXPLICACIÓN (TRADUCTOR DE DATOS A PALABRAS) ---
def generar_motivos(data):
    """
    Esta función analiza los datos brutos y genera una frase
    explicando por qué el riesgo es alto, basada en tus variables clave.
    """
    motivos = []

    # Lógica de Negocio basada en tus variables importantes
    if data.get("months_inactive12mon", 0) >= 3:
        motivos.append("Alta inactividad reciente (3+ meses)")

    if data.get("total_ct_chngq4q1", 0) < 0.6:
        motivos.append("Caída brusca en transacciones (Q4 vs Q1)")

    if data.get("avg_utilization_ratio", 0) < 0.1:
        motivos.append("Tarjeta casi sin uso (Saldo bajo)")

    if data.get("contacts_count12mon", 0) >= 4:
        motivos.append("Cliente ha contactado muchas veces (Posible queja)")

    if data.get("low_relationship_count", 0) < 3: # Asumiendo que esta variable indica productos
        motivos.append("Poca vinculación (pocos productos)")

    if not motivos:
        motivos.append("Comportamiento general atípico detectado por IA")

    return ". ".join(motivos) + "."


# --- 3. ENDPOINTS (LAS RUTAS DE TU API) ---

@app.route("/")
def home():
    return "🧠 Cerebro Kripton Online. Usa /predict_champion3 para análisis."

# RUTA 1: Ahora usa el Modelo 1.1 (CatBoost) para la carga inicial de la tabla
@app.route("/predict", methods=["POST"])
def predict_model_v1():
    try:
        if not modelo_v1:
            return jsonify({"error": "Modelo 1.1 no cargado"}), 500

        data = request.get_json()

        # Preparamos los datos igual que para el otro modelo
        input_dict = {
            "Customer_Age": data.get("customer_age"),
            "Months_Inactive_12_mon": data.get("months_inactive12mon"),
            "Contacts_Count_12_mon": data.get("contacts_count12mon"),
            "Total_Ct_Chng_Q4_Q1": data.get("total_ct_chngq4q1"),
            "Avg_Utilization_Ratio": data.get("avg_utilization_ratio"),
            "Low_Relationship_Count": data.get("low_relationship_count"),
            "Gender_M": data.get("genderm", 0),
            "Card_Category_Gold": data.get("card_category_gold", 0),
            "Card_Category_Platinum": data.get("card_category_platinum", 0),
            "Card_Category_Silver": data.get("card_category_silver", 0)
        }

        df = pd.DataFrame([input_dict])
        # Asegúrate de que el orden de columnas coincida con lo que espera tu CatBoost
        prob_fuga = modelo_v1.predict_proba(df)[0][1]

        return jsonify({
            "status": "success",
            "probabilidad": round(float(prob_fuga) * 100, 1)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# RUTA 2: LA NUEVA (Champion 3 - Análisis Profundo)
@app.route("/api/champion3/predecir/<id_cliente>", methods=["POST"])
def predict_champion3(id_cliente):
    try:
        data = request.get_json()

        # 1. Definimos el orden EXACTO que pide tu modelo XGBoost
        # Basado en tu error: ['Customer_Age', 'Months_Inactive_12_mon', ... ]
        orden_columnas = [
            'Customer_Age', 'Months_Inactive_12_mon', 'Contacts_Count_12_mon',
            'Total_Ct_Chng_Q4_Q1', 'Avg_Utilization_Ratio', 'Low_Relationship_Count',
            'Gender_M', 'Card_Category_Gold', 'Card_Category_Platinum', 'Card_Category_Silver'
        ]

        # 2. Creamos el diccionario con los datos que vienen del JS
        input_dict = {
            "Customer_Age": data.get("customer_age"),
            "Months_Inactive_12_mon": data.get("months_inactive12mon"),
            "Contacts_Count_12_mon": data.get("contacts_count12mon"),
            "Total_Ct_Chng_Q4_Q1": data.get("total_ct_chngq4q1"),
            "Avg_Utilization_Ratio": data.get("avg_utilization_ratio"),
            "Low_Relationship_Count": data.get("low_relationship_count"),
            "Gender_M": data.get("genderm", 0),
            "Card_Category_Gold": data.get("card_category_gold", 0),
            "Card_Category_Platinum": data.get("card_category_platinum", 0),
            "Card_Category_Silver": data.get("card_category_silver", 0)
        }

        # 3. Convertimos a DataFrame y REORDENAMOS
        df = pd.DataFrame([input_dict])
        df = df[orden_columnas] # Esto asegura que el modelo no se queje

        if modelo_v3:
            prob_fuga = modelo_v3.predict_proba(df)[0][1]
            prob_porcentaje = round(float(prob_fuga) * 100, 1)
        else:
            return jsonify({"error": "Modelo no cargado"}), 500

        return jsonify({
            "status": "success",
            "probabilidad": prob_porcentaje,
            "motivoPrincipal": generar_motivos(data)
        })

    except Exception as e:
        print(f"❌ Error en predicción: {e}")
        return jsonify({"status": "error", "message": str(e)}), 400

if __name__ == "__main__":
    print("🚀 Servidor Kripton (Doble Modelo) corriendo en puerto 5000")
    app.run(host="0.0.0.0", port=5000, debug=True)