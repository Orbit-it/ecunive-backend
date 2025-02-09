const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  
  const token = req.header('Authorization')?.split(' ')[1]; // Format: Bearer <token>


  if (!token) {
    return res.status(401).json({ error: 'Accès non autorisé. Token manquant.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Vérifie le token

    console.log('ID utilisateur décodé :', decoded.id);

    const user = await User.findById(decoded.id); // Vérifier si l'utilisateur existe

    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé.' });
    }

    req.user = user; 
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expiré, veuillez vous reconnecter.' });
    }

    return res.status(401).json({ error: 'Token invalide.' });
  }
};

module.exports = authenticate;
