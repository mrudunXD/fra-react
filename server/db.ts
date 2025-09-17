import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// In local/offline scenarios (e.g., downloaded from Replit) allow the app to boot
// without a DATABASE_URL by exporting a lax fallback. Any actual DB call will
// throw a clear error, but consumers can choose an in-memory storage instead.
const databaseUrl = process.env.DATABASE_URL;

let pool: Pool | undefined = undefined;
let db: any = undefined;

if (databaseUrl) {
  pool = new Pool({ connectionString: databaseUrl });
  db = drizzle({ client: pool, schema });
} else {
  // Soft fallback for dev: export a proxy that throws on use
  const throwing = new Proxy({}, {
    get() {
      throw new Error("Database is not configured (DATABASE_URL missing).");
    }
  });
  db = throwing as any;
}

export { pool, db };