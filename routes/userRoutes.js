const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
require('dotenv').config();

// Secret key pour JWT (vous devriez la garder dans un fichier .env)
const JWT_SECRET = process.env.JWT_SECRET;
const SECRET_KEY = process.env.SECRET_KEY;
const REFRESH_SECRET = process.env.REFRESH_SECRET;


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


module.exports = router;
