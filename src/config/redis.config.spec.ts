import redisConfig from './redis.config';

describe('redisConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return default values when env vars are not set', () => {
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
    delete process.env.REDIS_PASSWORD;
    delete process.env.REDIS_DB;
    delete process.env.REDIS_TTL;

    const config = redisConfig();

    expect(config.host).toBe('localhost');
    expect(config.port).toBe(6379);
    expect(config.password).toBeUndefined();
    expect(config.db).toBe(0);
    expect(config.ttl).toBe(3600);
  });

  it('should use environment variables when set', () => {
    process.env.REDIS_HOST = 'redis.example.com';
    process.env.REDIS_PORT = '6380';
    process.env.REDIS_PASSWORD = 'password123';
    process.env.REDIS_DB = '1';
    process.env.REDIS_TTL = '7200';

    const config = redisConfig();

    expect(config.host).toBe('redis.example.com');
    expect(config.port).toBe(6380);
    expect(config.password).toBe('password123');
    expect(config.db).toBe(1);
    expect(config.ttl).toBe(7200);
  });
});
