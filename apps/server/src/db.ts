import mongoose from "mongoose";
import { env } from "./env.js";

let memoryServer: { stop: () => Promise<unknown> } | null = null;
let memory = false;

/** True when the process is backed by the throwaway in-memory database. */
export const isMemoryDb = (): boolean => memory;

async function startMemory(uri: string): Promise<string> {
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  const mem = await MongoMemoryServer.create();
  memoryServer = mem;
  memory = true;
  console.log("[db] started in-memory MongoDB (development only, data is not persisted)");
  return mem.getUri(uri);
}

export async function connectDb(): Promise<void> {
  mongoose.set("strictQuery", true);

  if (env.useMemoryDb) {
    const uri = await startMemory("careerforge");
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
    console.log(`[db] connected to ${uri}`);
    return;
  }

  try {
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: env.isProd ? 10_000 : 3_000 });
    console.log(`[db] connected to ${env.MONGODB_URI.replace(/\/\/[^@]*@/, "//***@")}`);
  } catch (err) {
    if (env.isProd) throw err;
    console.warn("[db] Could not reach MONGODB_URI. Falling back to an in-memory MongoDB for development.");
    console.warn("     Set USE_MEMORY_DB=memory to skip this check, or start one with `npm run mongo`.");
    const uri = await startMemory("careerforge");
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
    console.log(`[db] connected to ${uri}`);
  }
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
    memory = false;
  }
}
