
import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DIRECT_URL || process.env.DATABASE_URL);

async function main() {
    try {
        console.log('Creating chat_messages table...');
        await sql`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `;
        console.log('Table created successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error creating table:', err);
        process.exit(1);
    }
}

main();
