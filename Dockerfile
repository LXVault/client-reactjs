# ---- Build stage ----
FROM node:20-slim AS build
WORKDIR /app

# Vite inlines VITE_* vars at build time. Default to the same-origin relative
# path `/api`, which nginx reverse-proxies to the backend container.
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
