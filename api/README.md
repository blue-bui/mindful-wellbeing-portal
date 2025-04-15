
# Suicide Prevention API

This folder contains the Flask API for the suicide risk assessment and analysis backend.

## Setup Instructions

1. **Install Python Dependencies**

   ```bash
   cd api
   pip install -r requirements.txt
   ```

2. **Download the Dataset**

   Download the suicide detection dataset from Kaggle:
   [Suicide Watch Dataset](https://www.kaggle.com/datasets/nikhileswarkomati/suicide-watch)

   Place the downloaded `suicide_detection.csv` file in the `api/data/` directory.

3. **Train the Model**

   ```bash
   python train_model.py
   ```

   This will:
   - Preprocess the data
   - Train a machine learning model
   - Save the model and vectorizer to the `model/` directory
   - Generate a log file with training metrics

4. **Start the Flask API**

   ```bash
   python app.py
   ```

   The API will be available at `http://localhost:5000`

## API Endpoints

### Health Check
- **URL**: `/api/health`
- **Method**: `GET`
- **Response**: Status of the API and whether the model is loaded

### Analyze Responses
- **URL**: `/api/analyze`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "question_set_id": "uuid-of-question-set",
    "responses": [
      {
        "id": "question-id-1",
        "answer_text": "Response text for question 1"
      },
      {
        "id": "question-id-2",
        "answer_text": "Response text for question 2"
      }
    ]
  }
  ```
- **Response**:
  ```json
  {
    "question_set_id": "uuid-of-question-set",
    "results": [
      {
        "question_id": "question-id-1",
        "risk_level": "low|medium|high",
        "probability": 0.25
      },
      {
        "question_id": "question-id-2",
        "risk_level": "low|medium|high",
        "probability": 0.75
      }
    ],
    "overall_risk_level": "low|medium|high",
    "status": "success"
  }
  ```

## Deployment

For production deployment:

1. Update the API URL in the frontend `QuestionAnalyzer.tsx` component from `http://localhost:5000/api/analyze` to your production URL.

2. Deploy using Gunicorn:
   ```bash
   gunicorn --bind 0.0.0.0:5000 app:app
   ```

3. Consider using a production-ready WSGI server (Gunicorn) behind a reverse proxy (Nginx) for better performance and security.
