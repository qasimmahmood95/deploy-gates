FROM node:22-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json tsconfig.base.json ./
COPY services/provider/package.json services/provider/
COPY services/consumer/package.json services/consumer/
RUN npm ci
COPY services/consumer/ services/consumer/
RUN npm run build -w @deploy-gates/consumer

FROM node:22-alpine
WORKDIR /repo
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY services/provider/package.json services/provider/
COPY services/consumer/package.json services/consumer/
RUN npm ci --omit=dev
COPY --from=build /repo/services/consumer/dist services/consumer/dist
EXPOSE 3000
CMD ["node", "services/consumer/dist/server.js"]
