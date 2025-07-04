const request = require('supertest');
const { Sequelize } = require('sequelize');
const { createApp } = require('../app');

describe('Incident API', () => {
  let server;
  let sequelize;
  let app;
  let IncidentModel;

  beforeAll(async () => {
    try {
      sequelize = new Sequelize('sqlite::memory:', { 
        logging: false,
        dialect: 'sqlite'
      });

    // Pass the sequelize instance to createApp
    app = createApp(sequelize);
    IncidentModel = app.get('models').Incident;
    
    await sequelize.sync({ force: true });
    server = app.listen(0);
  } catch (error) {
      console.error('Test setup failed:', error);
      throw error;
    }
  });

  afterAll(async () => {
  await sequelize.close(); // Fermez proprement la connexion
});

  it('GET /api/incidents should return 200 with incidents', async () => {
    // Create test data directly in the database
    await IncidentModel.create({
      title: 'Test Incident',
      description: 'Test Description',
      type: 'Panne',
      zone: 'Test Zone',
      urgency: 'Moyenne'
    });

    const res = await request(server).get('/api/incidents');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('POST /api/incidents should create a new incident', async () => {
    const newIncident = {
      title: 'T-Rex Escape',
      description: 'T-Rex broke the fence',
      type: 'Evasion',
      zone: 'T-Rex Valley',
      urgency: 'Haute'
    };

    const res = await request(server)
      .post('/api/incidents')
      .send(newIncident);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe(newIncident.title);
  });
});