import TelegramBot from 'node-telegram-bot-api';

import {TELEGRAM_BOT_TOKEN, TELEGRAM_USER_ID} from './@env';

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);

export async function sendTelegramMessage(message: string): Promise<void> {
  await bot.sendMessage(TELEGRAM_USER_ID, message, {parse_mode: 'MarkdownV2'});
}
