import { drizzle } from 'drizzle-orm/postgres-js';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import postgres = require('postgres');
import * as dotenv from 'dotenv';
import * as schema from 'exam-question-bank-db';

dotenv.config();

let db: PostgresJsDatabase<typeof schema>;

export function getDb(): PostgresJsDatabase<typeof schema> {
  if (!db) {
    const connectionString = process.env.NEON_DATABASE_URL;
    if (!connectionString) {
      throw new Error('NEON_DATABASE_URL is required');
    }

    const sql = postgres(connectionString, {
      ssl: 'require',
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
    });

    db = drizzle(sql, { schema });
  }
  return db;
}
