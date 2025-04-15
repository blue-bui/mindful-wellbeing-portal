
FROM node:18-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the app
RUN npm run build

# Install serve to serve the static files
RUN npm install -g serve

# Expose the port
EXPOSE 5173

# Start the application
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
