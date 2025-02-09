const express = require('express');
const multer = require('multer');
const Publication = require('../models/Publication');
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
 * Créer une publication avec fichiers joints
 */
router.post('/posts', authenticate, upload.array('attachments', 5), async (req, res) => {
  try {
    const { content } = req.body;
    const endpoint = "http://localhost:5000/uploads/";

    // Récupérer l'ID de l'université depuis l'utilisateur authentifié
    const universityId = req.user._id; // Supposons que l'utilisateur représente une université

    let files = [];
    if (req.files && Array.isArray(req.files)) {
      files = req.files.map((file) => endpoint + file.filename);
    }

    const newPublication = new Publication({
      content,
      universityId, // Assignation automatique de l'université
      attachments: files,
    });

    const savedPublication = await newPublication.save();
    res.status(201).json(savedPublication);
  } catch (error) {
    console.error('Erreur lors de la création de la publication:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la publication.' });
  }
});

router.post('/:postId/like', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const postId = req.params.postId;

    if (!userId) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }

    const post = await Publication.findById(postId);
    if (!post) return res.status(404).json({ message: 'Publication non trouvée' });

    // Si "likes" est undefined, on initialise un tableau vide.
    if (!post.likes) {
      post.likes = [];
    }

    const liked = post.likes.includes(userId);

    if (liked) {
      post.likes.pull(userId); // Désaimer
    } else {
      post.likes.push(userId); // Aimer
    }

    await post.save();

    res.status(200).json({
      likes: post.likes.map(id => id.toString()),  // Conversion des ObjectId en string
      liked: !liked, // Renvoie la vraie valeur
    });
  } catch (error) {
    console.error('Erreur lors du like:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});



/**
 * Récupérer toutes les publications
 */
/**
 * Récupérer toutes les publications
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user ? req.user._id.toString() : null; // Auth facultative
    const publications = await Publication.find()
      .populate('universityId', 'name email address')
      .sort({ createdAt: -1 }); // Trier par date de création

    // Ajoute la propriété "liked" pour chaque publication
    const formattedPublications = publications.map((post) => ({
      ...post.toObject(),
      liked: userId ? post.likes.some(id => id.toString() === userId) : false, // Vérifie si l'utilisateur a liké
      likes: post.likes.length, // Nombre de likes
    }));

    res.status(200).json(formattedPublications);
  } catch (error) {
    console.error('Erreur lors de la récupération des publications:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});



/**
 * Récupérer une publication par université
 */
router.get('/:id', async (req, res) => {
  try {
    const publications = await Publication.find({ universityId: req.params.id })
    .sort({ createdAt: -1 }); // Trier par date de création
    res.json(publications);
  } catch (err) {
    console.error('Erreur:', err.message);
    res.status(500).json({ error: err.message });
  }
});


/**
 * Modifier une publication par ID
 */
router.put('/:id', async (req, res) => {
  try {
    const updatedPublication = await Publication.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // Retourne l'objet mis à jour
      runValidators: true, // Valide les nouvelles données
    });
    if (!updatedPublication) {
      return res.status(404).json({ error: 'Publication introuvable' });
    }
    res.json(updatedPublication);
  } catch (err) {
    console.error('Erreur:', err.message);
    res.status(400).json({ error: err.message });
  }
});

/**
 * Supprimer une publication par ID
 */
router.delete('/:id', async (req, res) => {
  try {
    const deletedPublication = await Publication.findByIdAndDelete(req.params.id);
    if (!deletedPublication) {
      return res.status(404).json({ error: 'Publication introuvable' });
    }
    res.json({ message: 'Publication supprimée avec succès' });
  } catch (err) {
    console.error('Erreur:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Route pour obtenr une publication par ID
router.get('/:id', async (req, res) => {
  try {
    const publication = await Publication.findById(req.params.id);
    if (!publication) {
      return res.status(404).json({ error: 'Publication introuvable' });
    }
    res.json(publication);
  } catch (err) {
    console.error('Erreur:', err.message);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
