import postgres from 'postgres';
import fs from 'fs';
import 'dotenv/config';

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
console.log('Connecting to database...');

const sql = postgres(connectionString, { max: 1 });

const script = fs.readFileSync('./scripts/sync-schema.sql', 'utf8');

try {
  console.log('Executing schema sync SQL...');
  await sql.unsafe(script);
  console.log('Schema sync completed successfully!');
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
} finally {
  await sql.end();
}
