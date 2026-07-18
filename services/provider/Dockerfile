FROM node:22-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json tsconfig.base.json ./
COPY services/provider/package.json services/provider/
COPY services/consumer/package.json services/consumer/
RUN npm ci
COPY services/provider/ services/provider/
RUN npm run build -w @deploy-gates/provider

FROM node:22-alpine
WORKDIR /repo
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY services/provider/package.json services/provider/
COPY services/consumer/package.json services/consumer/
RUN npm ci --omit=dev
COPY --from=build /repo/services/provider/dist services/provider/dist
EXPOSE 3001
CMD ["node", "services/provider/dist/server.js"]
