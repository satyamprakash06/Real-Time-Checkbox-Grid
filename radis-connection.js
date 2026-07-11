import Redis from 'ioredis';

function createRedisConnection() {
  return new Redis({
    host: 'localhost', // Redis server hostname
    port: 6379,        // Redis server port
  });
}


export const publisher = createRedisConnection();
export const subscriber = createRedisConnection();
  
