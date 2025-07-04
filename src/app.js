require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/database');
const { Incident } = require('./models');
const { swaggerDocs } = require('./swagger');

// Configuration de base
const PORT = process.env.PORT || 3100;
const app = express();
swaggerDocs(app);


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Gestion des erreurs globales
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

// Initialisation de la base de données
const initializeDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized');
    
    app.set('models', { Incident });
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Route de test simple
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Server is working!', 
    timestamp: new Date().toISOString(),
    database: 'Connected',
    ejs: 'Available'
  });
});

// Route API pour les incidents
app.get('/api/incidents', async (req, res) => {
  try {
    const { zone, type, urgency } = req.query;
    const where = {};
    
    if (zone) where.zone = zone;
    if (type) where.type = type;
    if (urgency) where.urgency = urgency;
    
    const incidents = await Incident.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });
    res.json(incidents);
  } catch (error) {
    console.error('❌ Error fetching incidents:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route API pour créer un incident
app.post('/api/incidents', async (req, res) => {
  try {
    const data = { ...req.body };
    
    // Normaliser l'urgence
    if (data.urgency) {
      data.urgency = data.urgency.toLowerCase();
    }
    
    // Règles métier pour l'urgence
    if (data.type === 'Evasion') {
      data.urgency = 'haute';
    } else if (data.type === 'Blessure' && data.urgency === 'basse') {
      data.urgency = 'moyenne';
    }
    
    const incident = await Incident.create(data);
    console.log('✅ Incident created:', incident.id);
    res.status(201).json(incident);
  } catch (error) {
    console.error('❌ Error creating incident:', error);
    
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(422).json({ errors });
    }
    res.status(400).json({ error: error.message });
  }
});

// Route API pour mettre à jour un incident
app.put('/api/incidents/:id', async (req, res) => {
  try {
    const incident = await Incident.findByPk(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident non trouvé' });
    }

    await incident.update(req.body);
    console.log('✅ Incident updated:', incident.id);
    res.json(incident);
  } catch (error) {
    console.error('❌ Error updating incident:', error);
    
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(422).json({ errors });
    }
    res.status(400).json({ error: error.message });
  }
});

// Route API pour escalader l'urgence
app.patch('/api/incidents/:id/escalate', async (req, res) => {
  try {
    const incident = await Incident.findByPk(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident non trouvé' });
    }

    await incident.escalateUrgency();
    console.log('✅ Incident urgency escalated:', incident.id);
    res.json(incident);
  } catch (error) {
    console.error('❌ Error escalating urgency:', error);
    res.status(400).json({ error: error.message });
  }
});

// Route principale
app.get('/', async (req, res) => {
  try {
    const { zone, type, urgency } = req.query;
    const where = {};
    
    if (zone) where.zone = zone;
    if (type) where.type = type;
    if (urgency) where.urgency = urgency;
    
    const incidents = await Incident.findAll({ 
      where,
      order: [['createdAt', 'DESC']] 
    });
    
    res.render('home', { 
      incidents,
      zones: ['Zone A', 'Zone B', 'Zone C', 'Zone D'],
      types: ['Evasion', 'Panne', 'Blessure'],
      urgencyLevels: ['Basse', 'Moyenne', 'Haute'],
      statuses: ['En cours', 'Résolu'],
      currentFilters: { zone, type, urgency }
    });
  } catch (error) {
    console.error('❌ Error in home route:', error);
    res.status(500).json({ error: 'Erreur serveur lors du chargement des incidents', details: error.message });
  }
});

// Route pour afficher le formulaire de création d'incident
app.get('/incidents/new', (req, res) => {
  try {
    res.render('new-incident', {
      zones: ['Zone A', 'Zone B', 'Zone C', 'Zone D'],
      types: ['Evasion', 'Panne', 'Blessure'],
      urgencyLevels: ['Basse', 'Moyenne', 'Haute']
    });
  } catch (error) {
    console.error('❌ Error in new incident route:', error);
    res.status(500).json({ error: 'Erreur lors du chargement du formulaire', details: error.message });
  }
});

// Route pour créer un incident (formulaire HTML)
app.post('/incidents', async (req, res) => {
  try {
    const data = { ...req.body };
    
    // Normaliser l'urgence
    if (data.urgency) {
      data.urgency = data.urgency.toLowerCase();
    }
    
    // Règles métier pour l'urgence
    if (data.type === 'Evasion') {
      data.urgency = 'haute';
    } else if (data.type === 'Blessure' && data.urgency === 'basse') {
      data.urgency = 'moyenne';
    }
    
    const incident = await Incident.create(data);
    console.log('✅ Incident created via form:', incident.id);
    res.redirect('/?success=Incident créé avec succès');
  } catch (error) {
    console.error('❌ Error creating incident via form:', error);
    res.status(400).render('new-incident', {
      zones: ['Zone A', 'Zone B', 'Zone C', 'Zone D'],
      types: ['Evasion', 'Panne', 'Blessure'],
      urgencyLevels: ['Basse', 'Moyenne', 'Haute'],
      error: error.message,
      ...req.body
    });
  }
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ error: 'Page non trouvée', path: req.path });
});

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.stack);
  res.status(500).json({ error: 'Erreur interne du serveur', details: err.message });
});

// Fonction principale pour démarrer le serveur
const startServer = async () => {
  try {
    await initializeDB();

    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`🦕 Application: http://localhost:${PORT}`);
      console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
      console.log(`📊 API: http://localhost:${PORT}/api/incidents`);
      console.log(`🚨 New incident: http://localhost:${PORT}/incidents/new\n`);
    });

    // Gestion des signaux pour un arrêt propre
    const gracefulShutdown = () => {
      console.log('\n🛑 Shutting down server...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Démarrer le serveur immédiatement
startServer()
  .then(() => {
    console.log('✅ Server successfully started and ready to handle requests');
  })
  .catch(err => {
    console.error('❌ Fatal error during startup:', err);
    process.exit(1);
  });

// Export pour les tests
module.exports = { app, startServer };