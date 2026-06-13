import { createServer } from "node:http";
import { Server } from "socket.io";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { mediasoupService } from "./mediasoup/mediasoupService.js";
import { registerSockets } from "./sockets/index.js";

async function bootstrap() {
  await connectDatabase();
  await mediasoupService.init();

  const app = createApp();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: env.CLIENT_URL, credentials: true },
    transports: ["websocket", "polling"]
  });

  registerSockets(io);

  httpServer.listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
