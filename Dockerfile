FROM node:17

WORKDIR /usr/src/app/lforms-fhir-app

COPY package*.json ./

RUN npm ci

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
