const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: { type: String },
  description: { type: String },
  link: { type: String }, // URL de la nouvelle
  attachments: [String], // URLs des fichiers joints
}, { timestamps: true });

module.exports = mongoose.model('News', newsSchema);
