import { resolve } from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: resolve(process.cwd(), "../.env") });

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3000),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  throw new Error(`Invalid environment configuration: ${z.prettifyError(result.error)}`);
}

export const env = result.data;
