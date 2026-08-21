# ============================================================
# BPMN Frontend - Production Dockerfile
# Multi-stage build: Angular build -> Nginx serve
# ============================================================

# ----------------------------------------------------------
# Stage 1: Build Angular application
# ----------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files trước để tận dụng Docker layer caching
COPY package.json package-lock.json ./

# Cài đặt dependencies
RUN npm ci --prefer-offline --no-audit

# Copy source code
COPY . .

# Build production
RUN npm run build

# ----------------------------------------------------------
# Stage 2: Serve với Nginx
# ----------------------------------------------------------
FROM nginx:1.27-alpine AS production

# Xóa config mặc định của nginx
RUN rm -rf /etc/nginx/conf.d/default.conf /etc/nginx/nginx.conf

# Copy nginx config
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Copy Angular build output vào nginx html directory
# Angular 22 output: dist/bpmn-frontend/browser/
COPY --from=builder /app/dist/bpmn-frontend/browser /usr/share/nginx/html

# Tạo non-root user cho security (optional)
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
