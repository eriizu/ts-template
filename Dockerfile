FROM node:alpine AS build

WORKDIR /build

COPY package*.json yarn.lock ./

RUN yarn

COPY . .

RUN yarn build

# CMD [ "node", "--require", "ts-node/register src/index.ts", "start" ]

FROM node:alpine

RUN apk add --no-cache git

WORKDIR /app

COPY --from=build /build/package.json /app

RUN yarn --prod

COPY --from=build /build/dist /app/dist

CMD [ "yarn", "start" ]
