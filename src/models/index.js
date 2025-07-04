// models/index.js
const path = require('path');
const sequelize = require(path.join(__dirname, '../config/database'));
const { Sequelize } = require('sequelize');
const Incident = require('./Incident')(sequelize);


// Synchronisation des modèles (optionnel - à utiliser avec précaution en production)
async function syncModels(options = {}) {
  try {
    await sequelize.sync(options);
    console.log('Modèles synchronisés avec la base de données');
  } catch (error) {
    console.error('Erreur lors de la synchronisation des modèles:', error);
    throw error;
  }
}

module.exports = {
  sequelize,
  Incident,
  syncModels
};