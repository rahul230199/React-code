const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: 'Abhi@123',
  database: 'axo_platform',
  port: 5432,
});

pool.on('connect', () => {
  console.log('✅ Connected to axo_platform DB');
});

// optional safety check
pool.query('SELECT 1')
  .then(() => console.log('✅ axo_platform DB verified'))
  .catch(err => console.error('❌ DB ERROR:', err));

module.exports = pool; // ✅ SINGLE EXPORT
