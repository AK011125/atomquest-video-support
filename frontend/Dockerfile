FROM node:22-bookworm AS deps
WORKDIR /app
COPY package*.json ./
COPY frontend/package.json frontend/package.json
RUN npm install --workspace frontend

FROM node:22-bookworm AS build
WORKDIR /app
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ARG NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
COPY --from=deps /app/node_modules node_modules
COPY --from=deps /app/frontend/node_modules frontend/node_modules
COPY frontend frontend
RUN npm run build --workspace frontend

FROM node:22-bookworm AS runner
WORKDIR /app/frontend
ENV NODE_ENV=production
COPY --from=build /app/frontend/.next/standalone ./
COPY --from=build /app/frontend/.next/static ./.next/static
COPY --from=build /app/frontend/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
