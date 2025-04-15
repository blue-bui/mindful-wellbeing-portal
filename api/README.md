
# Preventing Suicide - API

This is the Flask backend for the "Preventing Suicide" project, which provides an API for sentiment analysis of user responses.

## Setup Instructions

### Prerequisites
- Python 3.8+
- pip (Python package manager)

### Installation

1. Create a virtual environment (recommended):
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Download the dataset:
   - Visit: https://www.kaggle.com/datasets/nikhileswarkomati/suicide-watch
   - Download the dataset and place the CSV file in the `data` directory
   - Rename the file to `suicide_detection.csv` if needed

4. Train the model:
   ```
   python train_model.py
   ```
   This will create a trained model and vectorizer in the `model` directory.

5. Start the Flask server:
   ```
   python app.py
   ```
   The API will be available at http://localhost:5000

## API Endpoints

### Health Check
- **URL**: `/api/health`
- **Method**: `GET`
- **Response**: 
  ```json
  {"status": "healthy", "model_loaded": true}
  ```

### Analyze Responses
- **URL**: `/api/analyze`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "question_set_id": "123e4567-e89b-12d3-a456-426614174000",
    "responses": [
      {
        "id": "123",
        "answer_text": "I feel overwhelmed sometimes but I cope well."
      },
      {
        "id": "124",
        "answer_text": "I've been having trouble sleeping lately."
      }
    ]
  }
  ```
- **Response**:
  ```json
  {
    "question_set_id": "123e4567-e89b-12d3-a456-426614174000",
    "results": [
      {
        "question_id": "123",
        "risk_level": "low",
        "probability": 0.15
      },
      {
        "question_id": "124",
        "risk_level": "medium",
        "probability": 0.45
      }
    ],
    "overall_risk_level": "low",
    "status": "success"
  }
  ```

## Important Note

This project is for educational purposes only as part of a college minor project and should not be used for commercial purposes. Always consult healthcare professionals for actual mental health assessment and treatment.
