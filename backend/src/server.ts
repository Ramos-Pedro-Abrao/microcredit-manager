import { app } from "./app.js";
import { env } from "./config/env.js";

const server = app.listen(env.PORT, () => {
  console.info(`Microcredit Manager API listening on port ${env.PORT}`);
});

server.on("error", (error) => {
  console.error("Failed to start the HTTP server:", error);
  process.exitCode = 1;
});
