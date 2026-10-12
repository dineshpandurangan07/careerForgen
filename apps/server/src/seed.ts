import { connectDb, disconnectDb, isMemoryDb } from "./db.js";
import { DEMO_LOGINS, seedDemoData } from "./lib/seedData.js";

async function main(): Promise<void> {
  console.log("[seed] connecting…");
  await connectDb();
  console.log("[seed] connected");

  await seedDemoData();
  console.log(`[seed] demo data seeded`);

  if (isMemoryDb()) {
    console.warn("[seed] note: seeded into an in-memory DB, so this data is discarded on exit.");
    console.warn("       Run a real MongoDB (`npm run mongo`) or set MONGODB_URI to persist it.");
  }

  console.log("\n[seed] done. Demo logins (password: Password123):");
  for (const l of DEMO_LOGINS) console.log(`       ${l.email.padEnd(28)} (${l.role})`);
  console.log("");

  await disconnectDb();
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
