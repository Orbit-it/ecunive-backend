const express = require('express');
const Candidature = require('../models/Candidature');
const endpointServer = require('../endpoint/endpoint');
const User = require('../models/User');
const multer = require('multer');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const path_upload = '../uploads';
const authenticate = require('../middlewares/authenticate');

// Vérifier si le dossier existe, sinon le créer
if (!fs.existsSync(path_upload)) {
  fs.mkdirSync(path_upload, { recursive: true });
}

// Configuration du stockage des fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, path_upload)); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Génère un nom unique
  },
});

const upload = multer({ storage });

/**
 * Validation des documents des users
 */
router.post('/documents', authenticate, upload.array('attachments', 5), async (req, res) => {
    try {
      // Récupération de l'utilisateur
      const student = await User.findById(req.user._id);
      if (!student) {
        return res.status(404).json({ error: 'Utilisateur non trouvé.' });
      }
  
      const endpoint = process.env.UPLOADS_URL || endpointServer.upload;
  
      // Traitement des fichiers uploadés
      const files = req.files?.map(file => `${endpoint}${file.filename}`) || [];
  
      if (files.length === 0) {
        return res.status(400).json({ error: 'Aucun fichier téléchargé.' });
      }
  
      // Ajout des pièces jointes
      student.attachments = [...student.attachments, ...files];
      student.canCandidate = true;
  
      // Sauvegarde de l'utilisateur
      const savedStudent = await student.save();
  
      res.status(201).json({
        message: 'Documents téléchargés avec succès.',
        student: savedStudent
      });
  
    } catch (error) {
      console.error('Erreur lors de la jointure des documents:', error);
      res.status(500).json({ error: 'Erreur serveur lors de la jointure des documents.' });
    }
  });
  


/**
 * Récupérer candidature par étudiant
 */
router.get('/:id', async (req, res) => {
  try {
    const candidature = await Candidature.find({ studentId: req.params.id }).populate('universityId', 'name address photo')
    .sort({ createdAt: -1 }); // Trier par date de création
    res.json(candidature);
  } catch (err) {
    console.error('Erreur:', err.message);
    res.status(500).json({ error: err.message });
  }
});





module.exports = router;
