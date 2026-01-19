import appConfig from './app.config';

describe('appConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return default values when env vars are not set', () => {
    delete process.env.PORT;
    delete process.env.NODE_ENV;
    delete process.env.API_PREFIX;
    delete process.env.CORS_ORIGIN;

    const config = appConfig();

    expect(config.port).toBe(3000);
    expect(config.nodeEnv).toBe('development');
    expect(config.apiPrefix).toBe('api');
    expect(config.cors.origin).toEqual(['http://localhost:3001']);
    expect(config.cors.credentials).toBe(true);
  });

  it('should use environment variables when set', () => {
    process.env.PORT = '4000';
    process.env.NODE_ENV = 'production';
    process.env.API_PREFIX = 'v1';
    process.env.CORS_ORIGIN = 'http://example.com,http://test.com';

    const config = appConfig();

    expect(config.port).toBe(4000);
    expect(config.nodeEnv).toBe('production');
    expect(config.apiPrefix).toBe('v1');
    expect(config.cors.origin).toEqual(['http://example.com', 'http://test.com']);
  });
});
