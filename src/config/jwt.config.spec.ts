import jwtConfig from './jwt.config';

describe('jwtConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return default values when env vars are not set', () => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRES_IN;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.JWT_REFRESH_EXPIRES_IN;

    const config = jwtConfig();

    expect(config.secret).toBe('your-secret-key-change-in-production');
    expect(config.expiresIn).toBe('1d');
    expect(config.refreshSecret).toBe('your-refresh-secret-key-change-in-production');
    expect(config.refreshExpiresIn).toBe('7d');
  });

  it('should use environment variables when set', () => {
    process.env.JWT_SECRET = 'custom-secret';
    process.env.JWT_EXPIRES_IN = '2h';
    process.env.JWT_REFRESH_SECRET = 'custom-refresh-secret';
    process.env.JWT_REFRESH_EXPIRES_IN = '14d';

    const config = jwtConfig();

    expect(config.secret).toBe('custom-secret');
    expect(config.expiresIn).toBe('2h');
    expect(config.refreshSecret).toBe('custom-refresh-secret');
    expect(config.refreshExpiresIn).toBe('14d');
  });
});
