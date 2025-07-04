const express = require('express');
const router = express.Router();
const IncidentService = require('../services/IncidentService');
const IncidentController = require('../controllers/IncidentController');

const initRoutes = () => {
    const service = new IncidentService();
    const controller = new IncidentController(service);

    // Routes API REST
    router.get('/', controller.getAll.bind(controller));
    router.get('/urgent', controller.getUrgent.bind(controller));
    router.post('/', controller.create.bind(controller));
    router.get('/:id', controller.getById.bind(controller));
    router.put('/:id', controller.update.bind(controller));
    router.delete('/:id', controller.delete.bind(controller));
    router.patch('/:id/escalate', controller.escalateUrgency.bind(controller));

    return router;
};

module.exports = initRoutes;