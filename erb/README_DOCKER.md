# Docker Deployment Guide

This project is configured for production-ready Docker deployment using a multi-stage build.

## Prerequisites
- Docker installed
- Docker Compose installed (optional but recommended)

## Build and Run with Docker Compose (Recommended)

1. **Build and start the container:**
   ```bash
   docker-compose up --build -d
   ```

2. **Check logs:**
   ```bash
   docker-compose logs -f
   ```

3. **Stop the container:**
   ```bash
   docker-compose down
   ```

## Build and Run with Docker CLI

1. **Build the image:**
   ```bash
   docker build -t erp-api .
   ```

2. **Run the container:**
   ```bash
   docker run -d \
     -p 3000:3000 \
     --env-file .env \
     --name erp-api-container \
     erp-api
   ```

## Dockerfile Details
- **Base Image:** `node:20-alpine` (Lightweight and secure).
- **Multi-stage build:** Separates the build environment from the runtime environment to reduce image size.
- **Security:** Runs as a non-root user (`nodeapp`).
- **Optimization:** Native modules (like `bcrypt`) are built once in the build stage, and devDependencies are pruned before the final image is created.
- **Port:** Exposes port `3000`.
