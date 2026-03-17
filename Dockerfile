FROM public.ecr.aws/docker/library/node:24

WORKDIR /usr/src/app

COPY package*.json ./
COPY patches ./patches

RUN npm ci

COPY . .

CMD ["npm", "run", "start:bot:prod"]
