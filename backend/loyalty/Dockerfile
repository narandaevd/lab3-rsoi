FROM node:20.16.0-alpine AS builder

WORKDIR /app
COPY package*.json .
RUN npm i
COPY . .
RUN npm run build

FROM node:20.16.0-alpine AS runner

WORKDIR /app
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules
CMD ["node", "dist/main"]
