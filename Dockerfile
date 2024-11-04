# Base image
FROM node:latest

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy all application files
COPY . .

# Expose the port
EXPOSE 5000

# Start the application using nodemon
CMD ["npx", "nodemon", "index.js"]
