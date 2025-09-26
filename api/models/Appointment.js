const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  userId: { type: String, required: true },   // لاحقًا بتخليه ObjectId
  doctorName: String,
  specialty: String,
  photoUrl: String,
  date: String,
  notes: String,
}, { timestamps: true });

module.exports = mongoose.model('Appointment', AppointmentSchema);
