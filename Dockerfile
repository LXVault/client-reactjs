# ---- Build stage ----
FROM node:24-slim AS build
WORKDIR /app

# Vite inlines VITE_* vars at build time. Set VITE_API_URL to the backend
# ORIGIN only — no /api suffix (e.g. https://your-backend.onrender.com); the
# client appends /api itself. The browser calls the backend directly (nginx
# here does NOT proxy /api). On Render, add it as a service env var so it's
# passed to this build ARG. Leave empty to default to a same-origin base.
ARG VITE_API_URL=
ENV VITE_API_URL=${VITE_API_URL}

COPY package*.json ./
# `npm ci`, not `npm install`: it installs exactly what the committed lockfile
# pins, and it fails the build when that lockfile has drifted out of sync with
# package.json. `npm install` would quietly resolve a newer tree instead, so the
# image could contain code that was never reviewed or audited.
RUN npm ci
COPY . .
RUN npm run build

# ---- Serve stage ----
FROM nginx:1.27-alpine AS serve
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
