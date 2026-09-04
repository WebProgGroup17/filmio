# Use the official lightweight Node.js image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy dependency definition files first (to leverage Docker layer caching)
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the backend source code
COPY . .

# Expose the backend port
EXPOSE 3001

# Start the development server
CMD ["npm", "run", "dev"]