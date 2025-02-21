FROM node:21

WORKDIR /app

COPY package*.json ./

RUN npm install -g bun

RUN bun i

COPY . .

ENV PORT=8008

EXPOSE 8008

CMD ["bun", "start"]