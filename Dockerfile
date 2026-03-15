FROM mirror.gcr.io/library/node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* .npmrc* ./
RUN npm ci

COPY . .
RUN npm run build

FROM mirror.gcr.io/library/nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3001

CMD ["nginx", "-g", "daemon off;"]
