const mongoose = require('mongoose');

const dayHoursSchema = new mongoose.Schema({
  enabled:   { type: Boolean, default: false },
  startTime: { type: String, default: '09:00' }, // "HH:mm"
  endTime:   { type: String, default: '16:00' }, // "HH:mm"
}, { _id: false });

const overrideSchema = new mongoose.Schema({
  date:      { type: String, required: true },   // "YYYY-MM-DD"
  isClosed:  { type: Boolean, default: false },
  startTime: { type: String },
  endTime:   { type: String },
}, { _id: false });

const doctorSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  specialtyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Specialty', required: true, index: true },
  photoUrl:    { type: String, required: true, trim: true },
  price:       { type: Number, default: 0 },
  rating:      { type: Number, min: 0, max: 5, default: 4.5 },
  bio:         { type: String, default: '' },

  // NEW (كلها اختيارية وبـ defaults)
  timezone:    { type: String, default: 'Asia/Jerusalem' },
  slotMinutes: { type: Number, default: 30 },
  workingHours: {
    sun: { type: dayHoursSchema, default: () => ({ enabled: false }) },
    mon: { type: dayHoursSchema, default: () => ({ enabled: true, startTime: '09:00', endTime: '16:00' }) },
    tue: { type: dayHoursSchema, default: () => ({ enabled: true, startTime: '09:00', endTime: '16:00' }) },
    wed: { type: dayHoursSchema, default: () => ({ enabled: true, startTime: '09:00', endTime: '16:00' }) },
    thu: { type: dayHoursSchema, default: () => ({ enabled: true, startTime: '09:00', endTime: '16:00' }) },
    fri: { type: dayHoursSchema, default: () => ({ enabled: false }) },
    sat: { type: dayHoursSchema, default: () => ({ enabled: false }) },
  },
  overrides: [overrideSchema],
}, { timestamps: true });




module.exports = mongoose.model('Doctor', doctorSchema);



// const doctorSchema = new mongoose.Schema({
//   name:        { type: String, required: true, trim: true },
//   specialtyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Specialty', required: true, index: true }, // إندكس واحد هنا فقط
//   photoUrl:    { type: String, required: true, trim: true },
//   price:       { type: Number, default: 0 },
//   rating:      { type: Number, min: 0, max: 5, default: 4.5 },
//   bio:         { type: String, default: '' },
// }, { timestamps: true });
