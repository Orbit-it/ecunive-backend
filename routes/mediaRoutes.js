const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configuration de stockage Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true }); // Crée le dossier s'il n'existe pas
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Route pour télécharger un fichier
router.post('/media', upload.single('file'), (req, res) => {
  try {
    const fileUrl = `/uploads/${req.file.filename}`; // URL relative du fichier
    res.status(201).json({ message: 'File uploaded successfully', fileUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route pour accéder aux fichiers (si besoin)
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

module.exports = router;
