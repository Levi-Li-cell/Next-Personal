import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DIRECT_URL || process.env.DATABASE_URL);

try {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS guestbook_message (
      id text PRIMARY KEY NOT NULL,
      name text NOT NULL,
      content text NOT NULL,
      contact text,
      status text NOT NULL DEFAULT 'approved',
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp DEFAULT now()
    );
  `);

  await sql.unsafe(`ALTER TABLE guestbook_message ENABLE ROW LEVEL SECURITY;`);

  console.log("guestbook_message migration applied");
} finally {
  await sql.end();
}
