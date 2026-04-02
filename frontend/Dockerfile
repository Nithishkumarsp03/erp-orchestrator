# Frontend Dockerfile
# ───────────────────
# Stage 1: Build React app with Vite
# Stage 2: Serve with Nginx

FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Nginx stage ───────────────────────────────────────────────────────────────
FROM nginx:alpine AS runner

# Copy Vite output to nginx html dir
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config (SPA routing support)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
