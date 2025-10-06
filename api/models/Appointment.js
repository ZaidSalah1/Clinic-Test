// models/Appointment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  provider:         { type: String, default: 'lahza' },
  currency:         { type: String, default: 'ILS' },
  amountMinor:      { type: Number, required: true }, // بالأغورة
  reference:        { type: String },
  authorizationUrl: { type: String },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'abandoned'],
    default: 'pending',
  },
  rawVerify: { type: Object },
}, { _id: false });

const appointmentSchema = new mongoose.Schema({
  doctorId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  date:      { type: String, required: true },  // "YYYY-MM-DD"
  slotUTC:   { type: String, required: true },  // ISO UTC
  slotLabel: { type: String, required: true },  // "10:30 AM"
  timezone:  { type: String, default: 'Asia/Jerusalem' },
  priceILS:  { type: Number, required: true },
  status:    { type: String, enum: ['pending_payment', 'confirmed', 'cancelled'], default: 'pending_payment' },
  payment:   { type: paymentSchema, required: true },
  notes:     { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
