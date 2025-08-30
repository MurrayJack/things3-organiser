# Use the official Node.js 18 Alpine image as base
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies and tsx globally for running TypeScript files directly
RUN npm ci --only=production && \
    npm install -g tsx

# Copy the rest of the application code
COPY . .

# Create a non-root user for security and change ownership of the app directory
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app
USER nodejs

# Expose port (adjust if your app uses a different port)
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]
