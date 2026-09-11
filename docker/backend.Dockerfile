FROM node:22-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/src ./src
COPY backend/scripts ./scripts
COPY data ./data
ENV DATA_DIR=/app/data/raw
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "src/server.js"]
