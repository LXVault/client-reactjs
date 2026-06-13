# ---- Build stage ----
FROM node:20-slim AS build
WORKDIR /app

# Vite inlines VITE_* vars at build time. Set VITE_API_URL to the ABSOLUTE
# backend URL including /api (e.g. https://your-backend.onrender.com/api): the
# browser calls the backend directly and nginx here does NOT proxy /api. On
# Render, add it as an env var on the service so it's passed to this build ARG.
# The `/api` default only works when something else proxies the API same-origin.
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ---- Serve stage ----
FROM nginx:1.27-alpine AS serve
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
