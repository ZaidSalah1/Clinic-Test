const mongoose = require('mongoose');

const specialtySchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true, unique: true }, // يبني إندكس unique تلقائياً
  iconUrl: { type: String, required: true, trim: true },
}, { timestamps: true });

// احذف أي سطر specialtySchema.index({ name: 1 }, { unique: true })

module.exports = mongoose.model('Specialty', specialtySchema);
