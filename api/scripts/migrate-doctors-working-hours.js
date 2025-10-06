// scripts/migrate-doctors-direct.js
require('dotenv').config();
const mongoose = require('mongoose');

const defaultWH = {
  sun: { enabled: false, startTime: '09:00', endTime: '16:00' },
  mon: { enabled: true,  startTime: '09:00', endTime: '16:00' },
  tue: { enabled: true,  startTime: '09:00', endTime: '16:00' },
  wed: { enabled: true,  startTime: '09:00', endTime: '16:00' },
  thu: { enabled: true,  startTime: '09:00', endTime: '16:00' },
  fri: { enabled: false, startTime: '09:00', endTime: '16:00' },
  sat: { enabled: false, startTime: '09:00', endTime: '16:00' },
};

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const res = await mongoose.connection.collection('doctors').updateMany(
      {},
      [
        {
          $set: {
            timezone: { $ifNull: ['$timezone', 'Asia/Jerusalem'] },
            slotMinutes: { $ifNull: ['$slotMinutes', 30] },
            overrides: { $ifNull: ['$overrides', []] },
            workingHours: {
              $ifNull: [
                '$workingHours',
                defaultWH
              ]
            }
          }
        }
      ]
    );

    console.log(`Matched ${res.matchedCount}, Modified ${res.modifiedCount}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration error:', err);
    process.exit(1);
  }
})();
