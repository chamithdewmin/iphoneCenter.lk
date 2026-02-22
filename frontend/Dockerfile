# Stage 1: Build
# Build context = frontend directory (Dokploy uses this)
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install && npm cache clean --force

COPY . .
# Default backend URL for production; override with --build-arg if needed (e.g. Dokploy build args)
ARG VITE_API_URL=https://backend.iphonecenter.lk
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

RUN chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
