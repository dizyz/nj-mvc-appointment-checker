export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

if (!TELEGRAM_BOT_TOKEN) {
  throw new Error('Env TELEGRAM_BOT_TOKEN is not set');
}

export const TELEGRAM_USER_ID = process.env.TELEGRAM_USER_ID!;
if (!TELEGRAM_USER_ID) {
  throw new Error('Env TELEGRAM_USER_ID is not set');
}

export const REDIS_URL = process.env.REDIS_URL!;

if (!REDIS_URL) {
  throw new Error('Env REDIS_URL is not set');
}
