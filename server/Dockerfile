FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --production

COPY . .

# Copy client files for serving
COPY ../client /app/client

EXPOSE 3001

CMD ["node", "index.js"]
