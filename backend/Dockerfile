FROM node:18
RUN apt-get update && apt-get install -y git
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "src/server.js"]