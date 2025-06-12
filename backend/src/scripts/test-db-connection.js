const { testConnection } = require('../config/database');

async function main() {
  console.log('Testing database connection...');
  const isConnected = await testConnection();
  
  if (isConnected) {
    console.log('✅ Database connection test successful!');
    process.exit(0);
  } else {
    console.error('❌ Database connection test failed!');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
}); 