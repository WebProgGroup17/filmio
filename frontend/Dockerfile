# Use the official Node.js image for the frontend
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy dependency definition files first
COPY package*.json ./

# Install frontend dependencies
RUN npm install

# Copy the frontend source code
COPY . .

# Expose the default Vite development port
EXPOSE 5173

# Start the frontend dev server and allow external host access
CMD ["npm", "run", "dev", "--", "--host"]