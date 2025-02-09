const express = require('express');
const multer = require('multer');
const News = require('../models/News');
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
 * Créer un news avec fichiers joints
 */
router.post('/', authenticate, upload.array('attachments', 5), async (req, res) => {
  try {
    const { title, description, link } = req.body;
    const endpoint = "http://localhost:5000/uploads/";

    

    let files = [];
    if (req.files && Array.isArray(req.files)) {
      files = req.files.map((file) => endpoint + file.filename);
    }

    const newNews = new News({
      title,
      description,
      link,
      attachments: files,
    });

    const savedNews = await newNews.save();
    res.status(201).json(savedNews);
    } catch (error) {
    console.error('Erreur lors de la création du programme:', error);
    res.status(500).json({ error: 'Erreur lors de la création du programme.' });
    }
});

/**
 * Récupérer toutes les news
 */
router.get('/', async (req, res) => {
  try {
    const news = await News.find();
    res.json(news);
  } catch (error) {
    console.error('Erreur lors de la récupération des news:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des news.' });
  }
});

/**
 * Récupérer une news par ID
 */
router.get('/:newsId', async (req, res) => {
  try {
    const news = await News.findById(req.params.newsId);
    if (!news) {
      return res.status(404).json({ error: 'News introuvable.' });
    }
    res.json(news);
  } catch (error) {
    console.error('Erreur lors de la récupération de la news:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la news.' });
  }
});

/**
 * Supprimer une news par ID
 */
router.delete('/:newsId', async (req, res) => {
  try {
    const news = await News.findByIdAndDelete(req.params.newsId);
    if (!news) {
      return res.status(404).json({ error: 'News introuvable.' });
    }
    res.json({ message: 'News supprimée avec succès.' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la news:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la news.' });
  }
});

/**
 * Mettre à jour une news
 */

router.put('/:newsId', authenticate, upload.array('attachments', 5), async (req, res) => {
  try {
    const { title, description } = req.body;
    const endpoint = "http://localhost:5000/uploads/";

    let files = [];
    if (req.files && Array.isArray(req.files)) {
      files = req.files.map((file) => endpoint + file.filename);
    }

    const news = await News.findById(req.params.newsId);
    news.title = title;
    news.description = description;
    news.link = link;
    news.attachments = [...news.attachments, ...files];

    const updatedNews = await news.save();
    res.json(updatedNews);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la news:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la news.' });
  }
});

module.exports = router;
