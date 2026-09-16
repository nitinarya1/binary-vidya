const path = require('path');
const bcrypt = require(path.resolve(__dirname, '../frontend/node_modules/bcryptjs'));
const mongoose = require(path.resolve(__dirname, '../frontend/node_modules/mongoose'));

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI environment variable is required.');
  process.exit(1);
}

async function setSuperAdminPassword() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.');

  const targetEmail = process.env.TARGET_EMAIL || 'binaryvidyaadmin@gmail.com';
  const newPassword = process.env.NEW_PASSWORD || '1@Binaryvidya';

  console.log(`Hashing password for ${targetEmail}...`);
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  const result = await mongoose.connection.db.collection('users').findOneAndUpdate(
    { email: targetEmail },
    {
      $set: {
        password: hashedPassword,
        role: 'admin',
        isVerified: true,
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' }
  );

  console.log('Password updated successfully for Super Admin:', targetEmail);
  const isMatch = await bcrypt.compare(newPassword, hashedPassword);
  console.log('Self-test bcrypt compare result:', isMatch ? 'SUCCESS (Password verified)' : 'FAILED');

  await mongoose.disconnect();
}

setSuperAdminPassword().catch((err) => {
  console.error('Error updating Super Admin password:', err);
  process.exit(1);
});
