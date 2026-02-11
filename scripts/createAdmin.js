const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');

async function createAdmin() {
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: 'admin@axonetworks.com' },
        { username: 'admin' },
        { role: 'ADMIN' }
      ]
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!\n');
      console.log('📋 Existing Admin Details:');
      console.log('   Email:', existingAdmin.email);
      console.log('   Username:', existingAdmin.username);
      console.log('   Role:', existingAdmin.role);
      console.log('   Active:', existingAdmin.isActive);
      console.log('\n💡 You can use these credentials to login.');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Create admin credentials
    const adminEmail = 'admin@axonetworks.com';
    const adminUsername = 'admin';
    const adminPassword = 'Admin@12345'; // Change this if needed
    const adminRole = 'ADMIN';

    // Create admin user (password will be hashed by User model's pre-save hook)
    const adminUser = new User({
      email: adminEmail,
      username: adminUsername,
      password: adminPassword, // Plain password - will be hashed automatically
      role: adminRole,
      isTemporaryPassword: false, // Set to false so admin can login directly
      isActive: true
    });

    await adminUser.save();

    console.log('╔════════════════════════════════════════════════╗');
    console.log('║                                                ║');
    console.log('║      🎉  ADMIN USER CREATED SUCCESSFULLY!   ║');
    console.log('║                                                ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    console.log('📋 Admin Login Credentials:\n');
    console.log('   Email:    ' + adminEmail);
    console.log('   Username: ' + adminUsername);
    console.log('   Password: ' + adminPassword);
    console.log('   Role:     ' + adminRole);
    console.log('\n🚀 Next Steps:');
    console.log('   1. Start your server: npm run dev');
    console.log('   2. Test login in Postman:');
    console.log('      POST http://localhost:5000/api/auth/login');
    console.log('      Body: { "email": "admin@axonetworks.com", "password": "Admin@12345" }');
    console.log('   3. Use the token to create users via:');
    console.log('      POST http://localhost:5000/api/auth/admin/create-user');
    console.log('      Header: Authorization: Bearer <token>');
    console.log('      Body: { "username": "testuser", "role": "SUPPLIER" }');

    await mongoose.connection.close();
    console.log('\n✅ Script completed successfully!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error creating admin:', error.message);
    if (error.code === 11000) {
      console.error('   Duplicate key error - Admin may already exist');
    }
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
createAdmin();


