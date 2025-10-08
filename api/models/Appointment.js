const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  provider:         { type: String, default: 'lahza' },
  currency:         { type: String, default: 'ILS' },
  amount_agorot:    { type: Number, required: true },
  reference:        { type: String },
  authorizationUrl: { type: String },
  callbackUrl:      { type: String },
  status: { type: String, enum: ['pending','success','failed','canceled'], default: 'pending' },
  channel:          { type: String },
  gatewayResponse:  { type: String },
  rawVerify:        {},
  rawWebhook:       {},
}, { _id:false });

const appointmentSchema = new mongoose.Schema({
  doctorId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
  patientId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  dateISO:     { type: String, required: true },
  slotStartUTC:{ type: String, required: true },
  slotEndUTC:  { type: String, required: true },
  timezone:    { type: String, default: 'Asia/Jerusalem' },
  notes:       { type: String, default: '' },
  status:      { type: String, enum: ['created','paid','confirmed','canceled'], default: 'created' },
  payment:     { type: paymentSchema, required: true },
}, { timestamps: true });

appointmentSchema.index({ doctorId:1, slotStartUTC:1 }, { unique:true });

module.exports = mongoose.model('Appointment', appointmentSchema);
