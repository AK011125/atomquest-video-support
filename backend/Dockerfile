FROM node:22-bookworm AS deps
WORKDIR /app
COPY package*.json ./
COPY backend/package.json backend/package.json
RUN npm install --workspace backend

FROM node:22-bookworm AS build
WORKDIR /app
COPY --from=deps /app/node_modules node_modules
COPY --from=deps /app/backend/node_modules backend/node_modules
COPY backend backend
RUN npm run build --workspace backend

FROM node:22-bookworm AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/backend/node_modules backend/node_modules
COPY --from=build /app/backend/dist backend/dist
COPY backend/package.json backend/package.json
RUN mkdir -p uploads recordings
EXPOSE 4000 40000-40100/udp 40000-40100/tcp
CMD ["npm", "run", "start", "--workspace", "backend"]
