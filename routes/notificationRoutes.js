const express = require('express');
const Candidature = require('../models/Candidature');
const Notification = require('../models/Notification');
const router = express.Router();


/**
 * Récupérer notifications par user
 */
router.get('/:id', async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.id })
    .sort({ createdAt: -1 }); // Trier par date de création
    res.json(notifications);
  } catch (err) {
    console.error('Erreur:', err.message);
    res.status(500).json({ error: err.message });
  }
});





module.exports = router;
