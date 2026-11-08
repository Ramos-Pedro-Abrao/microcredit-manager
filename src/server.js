import { app, sessionStore } from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./config/db.js";

try {
  await sessionStore.onReady();
} catch (error) {
  console.error("Failed to initialize the MySQL session store:", error);
  await Promise.all([pool.end(), sessionStore.close()]);
  throw error;
}

const server = app.listen(env.PORT, () => {
  console.info(`Microcredit Manager listening on port ${env.PORT}`);
});

server.on("error", (error) => {
  console.error("Failed to start the HTTP server:", error);
  process.exitCode = 1;
});

function shutdown() {
  server.close(async () => {
    await Promise.all([pool.end(), sessionStore.close()]);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
