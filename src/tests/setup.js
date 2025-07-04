process.env.NODE_ENV = 'test';

jest.setTimeout(30000);

beforeEach(() => {
  jest.clearAllMocks();
});

afterAll(async () => {
  await new Promise(resolve => setTimeout(resolve, 1000));
});