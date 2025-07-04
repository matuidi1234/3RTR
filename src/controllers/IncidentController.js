const { Incident } = require('../models');

class IncidentController {
  constructor(service) {
    this.service = service;
  }

  async getAll(req, res) {
    try {
      const { urgent, zone, type, urgency, status } = req.query;
      let incidents;
      
      if (urgent) {
        incidents = await Incident.scope('urgent').findAll({
          order: [['createdAt', 'DESC']]
        });
      } else if (zone || type || urgency || status) {
        incidents = await this.service.getByFilters({ zone, type, urgency, status });
      } else {
        incidents = await this.service.getAll();
      }
      
      res.json(incidents);
    } catch (error) {
      console.error('❌ Error in getAll:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req, res) {
    try {
      const incident = await this.service.getById(req.params.id);
      if (!incident) {
        return res.status(404).json({ error: 'Incident non trouvé' });
      }
      res.json(incident);
    } catch (error) {
      console.error('❌ Error in getById:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async create(req, res) {
    try {
      // Validation et normalisation des données
      const data = { ...req.body };
      
      // Normaliser l'urgence
      if (data.urgency) {
        data.urgency = data.urgency.toLowerCase();
      }
      
      // Règles métier pour l'urgence
      if (data.type === 'Evasion') {
        data.urgency = 'haute';
      } else if (data.type === 'Blessure' && data.urgency === 'basse') {
        data.urgency = 'moyenne'; // Minimum pour une blessure
      }
      
      const incident = await Incident.create(data);
      
      console.log('✅ Incident created:', incident.id);
      res.status(201).json(incident);
    } catch (error) {
      console.error('❌ Error creating incident:', error);
      
      // Gestion des erreurs de validation
      if (error.name === 'SequelizeValidationError') {
        const errors = error.errors.map(err => ({
          field: err.path,
          message: err.message
        }));
        return res.status(422).json({ errors });
      }
      res.status(400).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const incident = await Incident.findByPk(req.params.id);
      if (!incident) {
        return res.status(404).json({ error: 'Incident non trouvé' });
      }

      // Utilisation des méthodes d'instance
      if (req.body.action === 'escalate') {
        await incident.escalateUrgency();
        console.log('✅ Incident urgency escalated:', incident.id);
        return res.json(incident);
      }

      // Mise à jour standard
      const updatedIncident = await this.service.update(req.params.id, req.body);
      console.log('✅ Incident updated:', incident.id);
      res.json(updatedIncident);
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
  }

  async delete(req, res) {
    try {
      const incident = await this.service.getById(req.params.id);
      if (!incident) {
        return res.status(404).json({ error: 'Incident non trouvé' });
      }

      await this.service.delete(req.params.id);
      console.log('✅ Incident deleted:', req.params.id);
      res.json({ message: 'Incident supprimé avec succès' });
    } catch (error) {
      console.error('❌ Error deleting incident:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getUrgent(req, res) {
    try {
      // Utilisation spécifique du scope urgent
      const urgentIncidents = await Incident.scope('urgent').findAll({
        order: [['createdAt', 'DESC']]
      });
      res.json(urgentIncidents);
    } catch (error) {
      console.error('❌ Error in getUrgent:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async escalateUrgency(req, res) {
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
  }
}

module.exports = IncidentController;