# ---- Build Stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
 
# ---- Production Stage ----
FROM nginx:stable-alpine
# Vite의 기본 빌드 결과물 폴더는 'dist' (CRA는 build)
COPY --from=build /app/dist /usr/share/nginx/html
 
# Nginx 기본 포트
EXPOSE 80
 
CMD ["nginx", "-g", "daemon off;"]