
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score
import pickle
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
import os

# Download necessary NLTK data
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

# Initialize stemmer
stemmer = PorterStemmer()
stop_words = set(stopwords.words('english'))

# Create directory for model if it doesn't exist
os.makedirs('model', exist_ok=True)

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
    print("Loading dataset...")
    
    # Load the dataset (assuming the dataset is in the current directory)
    # Change the path if needed
    try:
        df = pd.read_csv('data/suicide_detection.csv')
        print(f"Dataset loaded successfully with {len(df)} records")
    except Exception as e:
        print(f"Error loading dataset: {e}")
        print("Please download the dataset from Kaggle and place it in the 'data' directory")
        print("Dataset URL: https://www.kaggle.com/datasets/nikhileswarkomati/suicide-watch")
        return
    
    # Ensure the directory exists
    os.makedirs('data', exist_ok=True)
    
    print("Preprocessing data...")
    # Preprocess text data
    df['processed_text'] = df['text'].apply(preprocess_text)
    
    # Prepare features and target
    X = df['processed_text']
    y = (df['class'] == 'suicide').astype(int)  # Convert to binary (1 for suicide, 0 for non-suicide)
    
    print("Splitting dataset into train and test sets...")
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Vectorizing text data...")
    # Vectorize the text data
    vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2))
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)
    
    print("Training logistic regression model...")
    # Train a logistic regression model
    model = LogisticRegression(C=1.0, max_iter=1000, class_weight='balanced')
    model.fit(X_train_vec, y_train)
    
    # Evaluate the model
    print("Evaluating model...")
    y_pred = model.predict(X_test_vec)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {accuracy:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['non-suicide', 'suicide']))
    
    # Save the model and vectorizer
    print("Saving model and vectorizer...")
    with open('model/suicide_detection_model.pkl', 'wb') as f:
        pickle.dump(model, f)
    with open('model/vectorizer.pkl', 'wb') as f:
        pickle.dump(vectorizer, f)
    
    print("Model training completed and saved successfully!")
    return model, vectorizer

if __name__ == "__main__":
    train_model()
