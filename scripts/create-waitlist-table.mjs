import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import postgres from 'postgres';

console.log('Connecting to:', process.env.DATABASE_URL?.substring(0, 50) + '...');
const sql = postgres(process.env.DATABASE_URL);

try {
  await sql.unsafe(`CREATE TYPE waitlist_status AS ENUM ('pending', 'invited', 'joined')`);
  console.log('enum created');
} catch(e) { console.log('enum:', e.message); }

try {
  await sql.unsafe(`CREATE TABLE waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    market VARCHAR(255) NOT NULL,
    website TEXT,
    status waitlist_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  console.log('table created');
} catch(e) { console.log('table:', e.message); }

try {
  await sql.unsafe(`CREATE UNIQUE INDEX waitlist_email_idx ON waitlist (email)`);
  console.log('index created');
} catch(e) { console.log('index:', e.message); }

await sql.end();
console.log('done');
