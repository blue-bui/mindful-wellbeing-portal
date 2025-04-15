
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import pickle
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
import os
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f"training_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Download necessary NLTK data
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    logger.info("Downloading NLTK stopwords")
    nltk.download('stopwords')

# Initialize stemmer
stemmer = PorterStemmer()
stop_words = set(stopwords.words('english'))

# Create directory for model if it doesn't exist
os.makedirs('model', exist_ok=True)
os.makedirs('data', exist_ok=True)

# Function to preprocess text
def preprocess_text(text):
    # Convert to lowercase
    text = str(text).lower()
    # Remove special characters and numbers
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    # Tokenize
    words = text.split()
    # Remove stopwords and stem
    words = [stemmer.stem(word) for word in words if word not in stop_words]
    return ' '.join(words)

def train_model():
    logger.info("Starting model training process")
    
    # Load the dataset (assuming the dataset is in the data directory)
    try:
        logger.info("Attempting to load dataset")
        dataset_path = 'data/suicide_detection.csv'
        
        if not os.path.exists(dataset_path):
            logger.error(f"Dataset not found at {dataset_path}")
            logger.info("Please download the dataset from Kaggle and place it in the 'data' directory")
            logger.info("Dataset URL: https://www.kaggle.com/datasets/nikhileswarkomati/suicide-watch")
            return
            
        df = pd.read_csv(dataset_path)
        logger.info(f"Dataset loaded successfully with {len(df)} records")
        
        # Display dataset information
        logger.info(f"Dataset columns: {df.columns.tolist()}")
        logger.info(f"Class distribution:\n{df['class'].value_counts()}")
        
    except Exception as e:
        logger.error(f"Error loading dataset: {e}")
        logger.info("Please download the dataset from Kaggle and place it in the 'data' directory")
        logger.info("Dataset URL: https://www.kaggle.com/datasets/nikhileswarkomati/suicide-watch")
        return
    
    logger.info("Preprocessing data...")
    # Preprocess text data
    df['processed_text'] = df['text'].apply(preprocess_text)
    
    # Prepare features and target
    X = df['processed_text']
    y = (df['class'] == 'suicide').astype(int)  # Convert to binary (1 for suicide, 0 for non-suicide)
    
    logger.info("Splitting dataset into train and test sets...")
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    logger.info(f"Training set size: {len(X_train)}, Test set size: {len(X_test)}")
    
    logger.info("Vectorizing text data...")
    # Vectorize the text data
    vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2))
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)
    
    logger.info("Training logistic regression model...")
    # Train a logistic regression model
    model = LogisticRegression(C=1.0, max_iter=1000, class_weight='balanced')
    model.fit(X_train_vec, y_train)
    
    # Evaluate the model
    logger.info("Evaluating model...")
    y_pred = model.predict(X_test_vec)
    accuracy = accuracy_score(y_test, y_pred)
    logger.info(f"Accuracy: {accuracy:.4f}")
    
    # Generate detailed classification report
    class_report = classification_report(y_test, y_pred, target_names=['non-suicide', 'suicide'])
    logger.info(f"Classification Report:\n{class_report}")
    
    # Generate confusion matrix
    conf_matrix = confusion_matrix(y_test, y_pred)
    logger.info(f"Confusion Matrix:\n{conf_matrix}")
    
    # Save the model and vectorizer
    logger.info("Saving model and vectorizer...")
    with open('model/suicide_detection_model.pkl', 'wb') as f:
        pickle.dump(model, f)
    with open('model/vectorizer.pkl', 'wb') as f:
        pickle.dump(vectorizer, f)
    
    logger.info("Model training completed and saved successfully!")
    return model, vectorizer

if __name__ == "__main__":
    train_model()
