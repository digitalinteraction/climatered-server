# [0] A common base for both stages
FROM node:14-alpine as base
RUN apk add --no-cache git \
  && mkdir /app && chown -R node:node /app
COPY --chown=node ["package*.json", "tsconfig.json", "/app/"]
USER node
WORKDIR /app

# [1] A builder to install modules and run a build
FROM base as builder
ENV NODE_ENV development
RUN npm ci
COPY --chown=node ["src", "/app/src"]
COPY --chown=node ["i18n", "/app/i18n"]
RUN npm run build

# [2] From the base again, install production deps and copy compilled code
FROM base as dist
EXPOSE 3000
ENV NODE_ENV production
RUN npm ci && npm cache clean --force
COPY --chown=node ["i18n", "/app/i18n"]
COPY --from=builder --chown=node ["/app/dist", "/app/src"]
ENTRYPOINT [ "node", "dist/cli.js" ]
CMD ["serve"]
