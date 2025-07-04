const { Incident } = require('../models');

class IncidentService {
  constructor() {
    this.model = Incident;
  }

  async getAll() {
    return await this.model.findAll({
      order: [['createdAt', 'DESC']]
    });
  }

  async create(data) {
    return await this.model.create(data);
  }

  async update(id, data) {
    const incident = await this.model.findByPk(id);
    if (!incident) throw new Error('Incident not found');
    return await incident.update(data);
  }

  async getById(id) {
    return await this.model.findByPk(id);
  }

  async delete(id) {
    const incident = await this.model.findByPk(id);
    if (!incident) throw new Error('Incident not found');
    return await incident.destroy();
  }

  async getByFilters(filters) {
    const where = {};
    
    if (filters.zone) where.zone = filters.zone;
    if (filters.type) where.type = filters.type;
    if (filters.urgency) where.urgency = filters.urgency;
    if (filters.status) where.status = filters.status;
    
    return await this.model.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });
  }
}

module.exports = IncidentService;