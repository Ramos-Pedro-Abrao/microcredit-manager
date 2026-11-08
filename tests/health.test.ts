import { describe, expect, it } from "vitest";
import { app } from "../src/app";

describe("GET /health", () => {
  it("returns an OK status", async () => {
    const server = app.listen(0);

    try {
      const address = server.address();
      if (!address || typeof address === "string") {
        throw new Error("Test server did not bind to a TCP port");
      }

      const response = await fetch(`http://127.0.0.1:${address.port}/health`);

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ status: "ok" });
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
