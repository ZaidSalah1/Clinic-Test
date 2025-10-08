const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  firstName:   { type: String, required: true, trim: true },
  lastName:    { type: String, required: true, trim: true },
  email:       { type: String, required: true, lowercase: true, index: true },
  phone:       { type: String, required: true },
  gender:      { type: String, enum: ['male','female'], default: 'male' },
  dob:         { type: String },
  nationalId:  { type: String },
  address:     { line1: String, city: String, country: String },
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
