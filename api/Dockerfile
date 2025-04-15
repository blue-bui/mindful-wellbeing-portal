
FROM python:3.9-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create data and model directories
RUN mkdir -p data model

# Set environment variables
ENV FLASK_APP=app.py
ENV PORT=5000

# Expose the port
EXPOSE 5000

# Run the application with Gunicorn
CMD gunicorn --bind 0.0.0.0:$PORT app:app
