# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# Stage 2: Production
FROM node:20-alpine

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Copy production dependencies and compiled files
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/openapi.yaml ./

# Use a non-root user
RUN addgroup -S nodeapp && adduser -S nodeapp -G nodeapp
USER nodeapp

EXPOSE 3000

CMD ["npm", "start"]
