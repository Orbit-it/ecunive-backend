const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const userRoutes = require('./routes/userRoutes');
const programRoutes = require('./routes/programRoutes');
const publicationRoutes = require('./routes/publicationRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const newsRoutes = require('./routes/newsRoutes');


const app = express();


// Middleware
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use(cors({
  origin: 'http://localhost:3000', // URL du frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: true, // Si vous utilisez des cookies ou des sessions
}));

app.options('*', cors());


// Routes
app.use('/api', userRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/publications', publicationRoutes);
app.use('/media', mediaRoutes);
app.use('/api/news', newsRoutes);

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
