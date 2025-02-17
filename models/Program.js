const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  duration: { type: Number, required: true },
  applications: [String],
  universityId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attachments: [String], // Liste d'URLs des images associées au programme
}, { timestamps: true });

module.exports = mongoose.model('Program', programSchema);
