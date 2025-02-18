# ./UI/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

EXPOSE 5173

# Start development server with proper host binding
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]