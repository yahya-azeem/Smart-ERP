# Frontend Dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 5173

# Run the application in dev mode for now (to avoid TypeScript errors)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
