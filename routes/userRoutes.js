const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const mongoose = require('mongoose');
const User = require('../models/User');
const router = express.Router();
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const authenticate = require('../middlewares/authenticate');
const path_upload = '../uploads';

// Secret key pour JWT (vous devriez la garder dans un fichier .env)
const JWT_SECRET = process.env.JWT_SECRET;
const SECRET_KEY = process.env.SECRET_KEY;
const REFRESH_SECRET = process.env.REFRESH_SECRET;



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

// Mis à jour info users
router.put('/users/:id', upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'coverPhoto', maxCount: 1 }]), async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID utilisateur invalide.' });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    // ✅ Mise à jour des images si elles existent
    const endpoint = "http://localhost:5000/uploads/";
    if (req.files.photo) {
      user.photo = endpoint + req.files.photo[0].filename;
    }
    if (req.files.coverPhoto) {
      user.coverPhoto = endpoint + req.files.coverPhoto[0].filename;
    }

    // ✅ Mise à jour des autres champs textuels
    if (req.body.name) {
      user.name = req.body.name;
    }
    if (req.body.presentation) {
      user.presentation = req.body.presentation;
    }

    const updatedUser = await user.save();
    res.status(200).json({ message: 'Mise à jour réussie.', user: updatedUser });
  } catch (error) {
    console.error('Erreur mise à jour :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});



// Authentifier une université

router.put('/users/:id', async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID utilisateur invalide.' });
  }

  try {
    const university = await User.findById(id);
    if (!university) {
      return res.status(404).json({ message: 'Université non trouvée.' });
    }


    // ✅ Mise à jour des autres champs textuels
    if (req.body.isAuthentic) {
      university.canAddProgram = true;
      university.canAddPublication = true;
      university.canManageCandidates = true;
    }else {
      university.canAddProgram = false;
      university.canAddPublication = false;
      university.canManageCandidates = false;
    }
    

    const updatedUniversity = await university.save();
    res.status(200).json({ message: 'Auhtentification de université réussie.', updatedUniversity });
  } catch (error) {
    console.error('Erreur authentication université :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});





// Fonction pour générer les tokens
const generateAccessToken = (user) => {
  return jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id }, REFRESH_SECRET, { expiresIn: '7d' }); // Expire en 7 jours
};

// Route pour rafraîchir le token
router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) return res.status(401).json({ message: 'Token manquant.' });

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = await User.findById(payload.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: 'Token invalide.' });
    }

    const newAccessToken = generateAccessToken(user);
    res.status(200).json({ accessToken: newAccessToken });

  } catch (error) {
    return res.status(403).json({ message: 'Token expiré ou invalide.' });
  }
});


// Inscription (Register)
router.post('/register', async (req, res) => {
  try {
    const { type, name, email, password, profilePicture, nationality, attachments, address } = req.body;

    // Validation des champs obligatoires
    if (!type || !name || !email || !password) {
      return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis.' });
    }

    if (type === 'student' && !nationality) {
      return res.status(400).json({ error: 'La nationalité est requise pour un étudiant.' });
    }

    if (type === 'university' && !address) {
      return res.status(400).json({ error: 'L\'adresse est requise pour une université.' });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé.' });
    }

    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer un nouvel utilisateur
    const newUser = new User({
      type,
      name,
      email,
      password: hashedPassword,
      profilePicture,
      nationality,
      attachments,
      address
    });

    const savedUser = await newUser.save();

    // Générer un token JWT
    const token = generateAccessToken(savedUser);

    res.status(201).json({ message: 'Utilisateur inscrit avec succès.', token, user: savedUser });
  } catch (err) {
    console.error('Erreur lors de l’inscription:', err);
    res.status(500).json({ error: 'Une erreur est survenue. Veuillez réessayer.' });
  }
});

// Connexion (Login)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation des données
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe sont requis.' });
    }

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Mot de passe incorrect.' });
    }

    // Générer les tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Enregistrer le refreshToken en BDD (optionnel mais recommandé)
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({ 
      message: 'Connexion réussie.', 
      accessToken, 
      refreshToken, 
      user 
    });
  } catch (err) {
    console.error('Erreur lors de la connexion:', err);
    res.status(500).json({ error: 'Une erreur est survenue. Veuillez réessayer.' });
  }
});


// Route protégée pour recupérer le profil de l'utilisateur
router.get('/profile', (req, res) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'Token manquant' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token invalide' });
    res.json({ user });
  });
});

// Récupérer tous les utilisateurs
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error('Erreur lors de la récupération des utilisateurs:', err);
    res.status(500).json({ error: 'Une erreur est survenue. Veuillez réessayer.' });
  }
});

// Recuperer que les universités
router.get('/universities', async (req, res) => {
  try {
    const universities = await User.find({ type: 'university' });
    res.json(universities);
  } catch (err) {
    console.error('Erreur lors de la récupération des universités:', err);
    res.status(500).json({ error: 'Une erreur est survenue. Veuillez réessayer.' });
  }
});

// Recuperer une university par son Id
router.get('/universities/:universityId', async (req, res) => {
  try {
    const university = await User.findById(req.params.universityId); 
    if (!university) {
      return res.status(404).json({ error: 'Université non trouvée.' });
    }
    res.json(university);
  } catch (err) {
    console.error('Erreur lors de la récupération de cette université:', err);
    res.status(500).json({ error: 'Une erreur est survenue. Veuillez réessayer.' });
  }
});



// Se deconnecter
router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const user = await User.findOne({ refreshToken });
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    res.status(200).json({ message: 'Déconnexion réussie.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la déconnexion.' });
  }
});

// Fonction pour s'abonner à une université
router.post('/follow/:universityId',authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const universityId = req.params.universityId;

    if (!userId) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }

    const university = await User.findById(universityId);
    if (!university) return res.status(404).json({ message: 'Université non trouvée' });

    // S'abonner à l'université si tout est bon !!!!

    const abonnement = university.listAbonnements.includes(userId);
    
    if (abonnement) {
      university.listAbonnements.pull(userId); // Désabonner
    } else {
      university.listAbonnements.push(userId); // Abonner
    }

    await university.save();

    res.status(200).json({
      abonnement: abonnement
    });
  } catch (error) {
    console.error('Erreur lors abonnement:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});







module.exports = router;
