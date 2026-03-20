import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

const TEST_DATABASE_URL = 'postgresql://db_user1:Raju987.@localhost:5432/hostel_pro_test';

const client = postgres(TEST_DATABASE_URL);
export const testDb = drizzle(client);

export async function cleanDb() {
  await testDb.execute(sql`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;
    END $$;
  `);
}

export async function closeDb() {
  await client.end();
}
