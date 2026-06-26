# ---- Build Stage ----
# 💡 alpine을 빼서 빌드 도구가 포함된 기본 이미지 사용
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./

# 💡 CI 환경이므로 npm install 대신 npm ci 권장
RUN npm ci 

COPY . .
RUN npm run build

# ---- Production Stage ----
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]