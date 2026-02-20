/**
 * Quick script to generate bcrypt password hash
 * Usage: node generate_hash.js "your-password"
 */

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('Usage: node generate_hash.js "your-password"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log('\n========================================');
console.log('Password Hash Generated:');
console.log('========================================');
console.log(hash);
console.log('========================================\n');
console.log('Copy this hash and use it in your SQL INSERT query.\n');
