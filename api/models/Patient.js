// models/Patient.ts
import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName:  { type: String, required: true, trim: true },
  email:     { type: String, required: true, lowercase: true, index: true },
  phone:     { type: String, required: true },
  // اختياري:
  dob:       { type: String },        // "YYYY-MM-DD"
  gender:    { type: String, enum: ['male','female','other'] },
  notes:     { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('Patient', patientSchema);
