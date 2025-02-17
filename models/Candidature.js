const mongoose = require('mongoose');

const candidatureSchema = new mongoose.Schema({
  title: { type: String, required: true }, // Titre du programme
  statut: { type: String }, // En cours, Accepté, ou Refusé
  price: { type: Number, required: true },
  duration: { type: Number, required: true },
  universityId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
}, { timestamps: true });

module.exports = mongoose.model('Candidature', candidatureSchema);
