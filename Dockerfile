FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build && npx prisma generate && npm prune --omit=dev

EXPOSE 3000
CMD ["node", "dist/main"]
