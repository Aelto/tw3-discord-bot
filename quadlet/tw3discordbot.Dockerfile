FROM --platform=linux/arm64 docker.io/node:26.7.0-alpine3.23 AS builder
WORKDIR /app

# install ALL deps using cache & bind mounts
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=bind,source=package.json,target=package.json \
    npm install

COPY lib/ lib/
COPY tsconfig.json .
COPY package.json .

RUN ls .
RUN npm run build

################################################################################

FROM --platform=linux/arm64 docker.io/node:26.7.0-alpine3.23 as deps
WORKDIR /app

# install production deps
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=bind,source=package.json,target=package.json \
    npm install --omit=dev

################################################################################

FROM --platform=linux/arm64 docker.io/node:26.7.0-alpine3.23 as runner
WORKDIR /app

COPY --from=builder --chown=node:node /app/src ./src
COPY --from=deps --chown=node:node /app/node_modules ./node_modules

VOLUME [ "/app/listeners-database.json" ]

CMD [ "node", "src" ]
