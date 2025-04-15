
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import pickle
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
import os

# Create Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Download necessary NLTK data
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

# Initialize stemmer
stemmer = PorterStemmer()
stop_words = set(stopwords.words('english'))

# Load the model and vectorizer (these will be created when we train the model)
model_path = 'model/suicide_detection_model.pkl'
vectorizer_path = 'model/vectorizer.pkl'

# Function to preprocess text
def preprocess_text(text):
    # Convert to lowercase
    text = text.lower()
    # Remove special characters and numbers
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    # Tokenize
    words = text.split()
    # Remove stopwords and stem
    words = [stemmer.stem(word) for word in words if word not in stop_words]
    return ' '.join(words)

# Check if model exists, otherwise we'll need to train it first
if os.path.exists(model_path) and os.path.exists(vectorizer_path):
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    with open(vectorizer_path, 'rb') as f:
        vectorizer = pickle.load(f)
    print("Model and vectorizer loaded successfully")
else:
    model = None
    vectorizer = None
    print("Model files not found. Please run train_model.py first")

@app.route('/api/analyze', methods=['POST'])
def analyze_responses():
    try:
        data = request.json
        question_set_id = data.get('question_set_id')
        responses = data.get('responses', [])
        
        if not model or not vectorizer:
            return jsonify({
                'error': 'Model not loaded. Please train the model first.',
                'status': 'error'
            }), 500
            
        # Preprocess each response
        preprocessed_responses = [preprocess_text(resp['answer_text']) for resp in responses]
        
        # Vectorize the responses
        features = vectorizer.transform(preprocessed_responses)
        
        # Predict risk level for each response
        predictions = model.predict(features)
        probabilities = model.predict_proba(features)[:, 1]  # Probability of suicide class
        
        # Assign risk levels based on probabilities
        risk_levels = []
        for prob in probabilities:
            if prob < 0.3:
                risk_levels.append("low")
            elif prob < 0.7:
                risk_levels.append("medium")
            else:
                risk_levels.append("high")
        
        # Calculate overall risk level
        risk_counts = {
            "low": risk_levels.count("low"),
            "medium": risk_levels.count("medium"),
            "high": risk_levels.count("high")
        }
        
        # Determine overall risk
        if risk_counts["high"] >= 2:
            overall_risk = "high"
        elif risk_counts["medium"] >= 5 or risk_counts["high"] >= 1:
            overall_risk = "medium"
        else:
            overall_risk = "low"
            
        # Prepare response with risk levels for each question
        results = []
        for i, resp in enumerate(responses):
            results.append({
                "question_id": resp.get("id"),
                "risk_level": risk_levels[i],
                "probability": float(probabilities[i])
            })
            
        return jsonify({
            "question_set_id": question_set_id,
            "results": results,
            "overall_risk_level": overall_risk,
            "status": "success"
        })
        
    except Exception as e:
        return jsonify({
            "error": str(e),
            "status": "error"
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "model_loaded": model is not None})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
