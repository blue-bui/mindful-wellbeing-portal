
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
import logging

# Configure logging
logging.basicConfig(level=logging.INFO,
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})  # Enable CORS for all origins on API routes

# Download necessary NLTK data
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    logger.info("Downloading NLTK stopwords")
    nltk.download('stopwords')

# Initialize stemmer
stemmer = PorterStemmer()
stop_words = set(stopwords.words('english'))

# Load the model and vectorizer (these will be created when we train the model)
model_path = 'model/suicide_detection_model.pkl'
vectorizer_path = 'model/vectorizer.pkl'

# Function to preprocess text
def preprocess_text(text):
    try:
        # Convert to lowercase
        text = str(text).lower()
        # Remove special characters and numbers
        text = re.sub(r'[^a-zA-Z\s]', '', text)
        # Tokenize
        words = text.split()
        # Remove stopwords and stem
        words = [stemmer.stem(word) for word in words if word not in stop_words]
        return ' '.join(words)
    except Exception as e:
        logger.error(f"Error in preprocess_text: {e}")
        return ""

# Check if model exists, otherwise we'll need to train it first
if os.path.exists(model_path) and os.path.exists(vectorizer_path):
    try:
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        with open(vectorizer_path, 'rb') as f:
            vectorizer = pickle.load(f)
        logger.info("Model and vectorizer loaded successfully")
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        model = None
        vectorizer = None
else:
    logger.warning("Model files not found. Please run train_model.py first")
    model = None
    vectorizer = None

@app.route('/api/analyze', methods=['POST'])
def analyze_responses():
    try:
        logger.info("Analyzing responses")
        data = request.json
        question_set_id = data.get('question_set_id')
        responses = data.get('responses', [])
        
        logger.info(f"Received request for question set {question_set_id} with {len(responses)} responses")
        
        if not model or not vectorizer:
            logger.error("Model not loaded")
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
        
        logger.info(f"Analysis complete. Overall risk: {overall_risk}")
            
        return jsonify({
            "question_set_id": question_set_id,
            "results": results,
            "overall_risk_level": overall_risk,
            "status": "success"
        })
        
    except Exception as e:
        logger.error(f"Error in analyze_responses: {e}")
        return jsonify({
            "error": str(e),
            "status": "error"
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    model_status = model is not None and vectorizer is not None
    logger.info(f"Health check. Model loaded: {model_status}")
    return jsonify({
        "status": "healthy", 
        "model_loaded": model_status,
        "version": "1.0.0"
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    logger.info(f"Starting Flask app on port {port}, debug={debug}")
    app.run(debug=debug, host='0.0.0.0', port=port)
