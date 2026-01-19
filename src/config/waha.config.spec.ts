import wahaConfig from './waha.config';

describe('wahaConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return default values when env vars are not set', () => {
    delete process.env.WAHA_BASE_URL;
    delete process.env.WAHA_API_KEY;
    delete process.env.WAHA_WEBHOOK_URL;
    delete process.env.WAHA_TIMEOUT;

    const config = wahaConfig();

    expect(config.baseUrl).toBe('http://localhost:3000');
    expect(config.apiKey).toBe('');
    expect(config.webhookUrl).toBe('');
    expect(config.timeout).toBe(30000);
  });

  it('should use environment variables when set', () => {
    process.env.WAHA_BASE_URL = 'https://waha.example.com';
    process.env.WAHA_API_KEY = 'api-key-123';
    process.env.WAHA_WEBHOOK_URL = 'https://webhook.example.com';
    process.env.WAHA_TIMEOUT = '60000';

    const config = wahaConfig();

    expect(config.baseUrl).toBe('https://waha.example.com');
    expect(config.apiKey).toBe('api-key-123');
    expect(config.webhookUrl).toBe('https://webhook.example.com');
    expect(config.timeout).toBe(60000);
  });
});
