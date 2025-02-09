const mongoose = require('mongoose');

const publicationSchema = new mongoose.Schema({
  content: { type: String },
  universityId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Liste des IDs des utilisateurs qui ont liké
  attachments: [String], // URLs des fichiers joints
}, { timestamps: true });

module.exports = mongoose.model('Publication', publicationSchema);
