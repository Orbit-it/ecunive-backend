const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  type: { type: String, enum: ['student', 'university', 'admin'], required: true },
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  presentation: {type: String}, // Présentation de l'université
  canAddProgram: { type: Boolean, default: false },
  canCandidate: { type: Boolean, default: false}, // passed to true when the student put his document into his space
  canAddPublication: { type: Boolean, default: false },
  canManageCandidates: { type: Boolean, default: false },
  refreshToken: { type: String }, // Ajout du champ pour le token
  photo: { type: String }, // URL de la photo de profil
  coverPhoto: {type: String },  // URL de la photo de couverture
  nationality: { type: String }, // Spécifique aux étudiants
  listAbonnements: [String], // Liste des abonnements
  attachments: [String], // URLs des fichiers joints
  address: { 
    city: String,
    country: String
  }, // Spécifique aux universités
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
