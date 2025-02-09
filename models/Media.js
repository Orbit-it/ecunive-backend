const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['profile_picture', 'document'], required: true },
  url: { type: String, required: true }, // URL du fichier
}, { timestamps: true });

module.exports = mongoose.model('Media', mediaSchema);
