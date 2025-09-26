const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  specialtyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Specialty', required: true, index: true }, // إندكس واحد هنا فقط
  photoUrl:    { type: String, required: true, trim: true },
  price:       { type: Number, default: 0 },
  rating:      { type: Number, min: 0, max: 5, default: 4.5 },
  bio:         { type: String, default: '' },
}, { timestamps: true });

// احذف أي سطر doctorSchema.index({ specialtyId: 1 })

module.exports = mongoose.model('Doctor', doctorSchema);
