# Multi-stage build: First build React frontend, then run Node.js backend

# Stage 1: Build React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy frontend dependencies
COPY package.json package-lock.json* ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source
COPY . .

# Build React app (outputs to dist/)
RUN npm run build

# Stage 2: Run Node.js backend with frontend served as static files
FROM node:18-alpine

WORKDIR /app

# Copy backend dependencies
COPY server/package.json server/package-lock.json* ./server/

# Install backend dependencies
RUN cd server && npm ci

# Copy backend source
COPY server ./server

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/dist ./server/public

# Copy environment and other files
COPY server/.env* ./server/

# Set NODE_ENV to production
ENV NODE_ENV=production

# Expose port (Cloud Run uses PORT env variable)
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the backend server
WORKDIR /app/server
CMD ["npm", "start"]
