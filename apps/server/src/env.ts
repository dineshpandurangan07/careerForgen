import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { z } from "zod";

const here = dirname(fileURLToPath(import.meta.url));
const serverRoot = resolve(here, "..");
const workspaceRoot = resolve(serverRoot, "..", "..");

// Load the workspace .env first, then a server-local .env can override it.
loadEnv({ path: resolve(workspaceRoot, ".env") });
loadEnv({ path: resolve(serverRoot, ".env"), override: true });

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/careerforge"),
  USE_MEMORY_DB: z.string().optional().default(""),
  JWT_SECRET: z.string().min(1).default("change-me-access-secret"),
  JWT_REFRESH_SECRET: z.string().min(1).default("change-me-refresh-secret"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("7d"),
  AI_API_KEY: z.string().optional().default(""),
  AI_BASE_URL: z.string().default("https://api.openai.com/v1"),
  AI_MODEL: z.string().default("gpt-4o-mini"),
  GITHUB_TOKEN: z.string().optional().default(""),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
  GOOGLE_CALLBACK_URL: z.string().optional().default(""),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  useMemoryDb: parsed.data.USE_MEMORY_DB === "memory" || parsed.data.USE_MEMORY_DB === "1",
  isProd: parsed.data.NODE_ENV === "production",
  aiEnabled: parsed.data.AI_API_KEY.trim().length > 0,
};

export type Env = typeof env;
