import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);
const rows = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'waitlist' ORDER BY ordinal_position`;
console.log('waitlist columns:', rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
const count = await sql`SELECT count(*) FROM waitlist`;
console.log('row count:', count[0].count);
await sql.end();
