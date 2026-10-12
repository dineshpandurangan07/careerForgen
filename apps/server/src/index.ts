import { createApp } from "./app.js";
import { connectDb, disconnectDb, isMemoryDb } from "./db.js";
import { seedDemoData } from "./lib/seedData.js";
import { env } from "./env.js";

async function main(): Promise<void> {
  try {
    await connectDb();
  } catch (err) {
    console.error("\n[db] Could not connect to MongoDB.");
    console.error("     Start one with `npm run mongo` (Docker) or set MONGODB_URI in .env.");
    console.error("     For a quick no-database dev run set USE_MEMORY_DB=memory in .env.\n");
    throw err;
  }

  if (isMemoryDb()) {
    await seedDemoData();
    console.log("[server] seeded demo data into the in-memory DB");
  }

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`[server] API ready on http://localhost:${env.PORT}`);
    console.log(`[server] AI coach: ${env.aiEnabled ? `enabled (${env.AI_MODEL})` : "built-in fallback"}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n[server] ${signal} received, shutting down…`);
    server.close();
    await disconnectDb();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
