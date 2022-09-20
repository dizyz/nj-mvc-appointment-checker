import Redis from 'ioredis';

import {REDIS_URL} from './@env';

const redis = new Redis(REDIS_URL);

export async function getObj<T>(key: string): Promise<T | undefined> {
  const data = await redis.get(key);
  if (data === null) {
    return undefined;
  }
  return JSON.parse(data);
}

export async function setObj<T>(key: string, value: T): Promise<void> {
  await redis.set(key, JSON.stringify(value));
}

export async function get(key: string): Promise<string | undefined> {
  const data = await redis.get(key);
  if (data === null) {
    return undefined;
  }
  return data;
}

export async function set(key: string, value: string): Promise<void> {
  await redis.set(key, value);
}

export function cleanup(): void {
  redis.disconnect();
}
