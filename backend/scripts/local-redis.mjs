import { RedisMemoryServer } from 'redis-memory-server';

const redis = new RedisMemoryServer({
  instance: { port: 6379, ip: '127.0.0.1' },
  autoStart: true,
});

const host = await redis.getHost();
const port = await redis.getPort();
console.log(`LOCAL_REDIS_READY=redis://${host}:${port}`);
await new Promise(() => {});

