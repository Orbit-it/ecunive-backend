const express = require('express');
const multer = require('multer');
const Program = require('../models/Program');
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
    cb(null, path.join(__dirname, path_upload)); // Assurez-vous que ce chemin existe
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Génère un nom unique
  },
});

const upload = multer({ storage });

/**
 * Créer un programme avec fichiers joints
 */
router.post('/', authenticate, upload.array('attachments', 5), async (req, res) => {
  try {
    const { title, description, duration, price } = req.body;
    const endpoint = "http://localhost:5000/uploads/";

    // Récupérer l'ID de l'université depuis l'utilisateur authentifié
    const universityId = req.user._id; // Supposons que l'utilisateur représente une université

    let files = [];
    if (req.files && Array.isArray(req.files)) {
      files = req.files.map((file) => endpoint + file.filename);
    }

    const newProgram = new Program({
      title,
      description,
      duration,
      price,
      universityId, // Assignation automatique de l'université
      attachments: files,
    });

    const savedProgram = await newProgram.save();
    res.status(201).json(savedProgram);
  } catch (error) {
    console.error('Erreur lors de la création du programme:', error);
    res.status(500).json({ error: 'Erreur lors de la création du programme.' });
  }
});

/**
 * Récupérer tous les programmes
 */

router.get('/', async (req, res) => {
  try {
    const programs = await Program.find().populate('universityId', 'name address');
    res.json(programs);
  } catch (error) {
    console.error('Erreur lors de la récupération des programmes:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des programmes.' });
  }
});

/**
 * Récupérer un programme par son ID
 */
router.get('/:programId', async (req, res) => {
  try {
    const program = await Program.findById(req.params.programId).populate('universityId', 'name');
    res.json(program);
  } catch (error) {
    console.error('Erreur lors de la récupération du programme:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du programme.' });
  }
});

/**
 * Mettre à jour un programme
 */
router.put('/:programId', authenticate, upload.array('attachments', 5), async (req, res) => {
  try {
    const { title, description, duration, price } = req.body;
    const endpoint = "http://localhost:5000/uploads/";

    let files = [];
    if (req.files && Array.isArray(req.files)) {
      files = req.files.map((file) => endpoint + file.filename);
    }

    const program = await Program.findById(req.params.programId);
    program.title = title;
    program.description = description;
    program.duration = duration;
    program.price = price;
    program.attachments = [...program.attachments, ...files];

    const updatedProgram = await program.save();
    res.json(updatedProgram);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du programme:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du programme.' });
  }
});

/**
 * Supprimer un programme
 */
router.delete('/:programId', async (req, res) => {
  try {
    await Program.findByIdAndDelete(req.params.programId);
    res.json({ message: 'Programme supprimé avec succès.' });
  } catch (error) {
    console.error('Erreur lors de la suppression du programme:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du programme.' });
  }
});

/**
 * Postuler à un programme
 */
router.post('/:programId/apply', authenticate, async (req, res) => {
  try {
    const program = await Program.findById(req.params.programId);
    if (!program) return res.status(404).json({ message: 'Programme non trouvé' });

    const userId = req.user._id;
    if (program.applications.includes(userId)) {
      return res.status(400).json({ message: 'Vous avez déjà postulé à ce programme.' });
    }

    program.applications.push(userId);
    await program.save();
    res.json({ message: 'Postulation réussie.' });
  } catch (error) {
    console.error('Erreur lors de la postulation au programme:', error);
    res.status(500).json({ error: 'Erreur lors de la postulation au programme.' });
  }
});





module.exports = router;
