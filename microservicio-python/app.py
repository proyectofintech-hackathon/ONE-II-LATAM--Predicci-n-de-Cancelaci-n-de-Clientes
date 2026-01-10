from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib    # Para cargar el modelo
import pandas as pd
import lightgbm # Vital para que cargue el .pkl

app = Flask(__name__)   # Crear la app de Flask
CORS(app) # Esto permite que tu interfaz se conecte sin errores

# Cargar el modelo  en la carpeta
modelo = joblib.load("modelo_champion1.pkl")

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        df = pd.DataFrame([{
            "Customer_Age": data.get("customer_age"),
            "Months_Inactive_12_mon": data.get("months_inactive12mon"),
            "Contacts_Count_12_mon": data.get("contacts_count12mon"),
            "Total_Ct_Chng_Q4_Q1": data.get("total_ct_chngq4q1"),
            "Avg_Utilization_Ratio": data.get("avg_utilization_ratio"),
            "Low_Relationship_Count": data.get("low_relationship_count"),
            "Gender_M": data.get("genderm"),
            "Card_Category_Gold": data.get("card_category_gold", 0),
            "Card_Category_Platinum": data.get("card_category_platinum", 0),
            "Card_Category_Silver": data.get("card_category_silver", 0)
        }])

        # Calculamos la probabilidad
        prob = modelo.predict_proba(df)[0][1]

        return jsonify({
            "prevision": "Riesgo de Fuga" if prob >= 0.5 else "Cliente Fiel",
            "probabilidad": round(float(prob) * 100, 2),
            "status": "success"
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

if __name__ == "__main__":
    print("🚀 Servidor de IA Kripton corriendo en puerto 5000")
    app.run(host="0.0.0.0", port=5000)