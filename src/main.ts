import {md} from 'telegram-escape';

import {AppointmentType, getMVCData} from './@mvc';
import {sendTelegramMessage} from './@telegram';
import {cleanup as redisCleanup, get, set} from './@redis';

process.env.TZ = 'America/New_York';

const SUBSCRIBED_LOCATIONS = [
  125, // Bayonne: 32min
  138, // Newark: 40min
  139, // North Bergen: 59min
];

const REDIS_MESSAGE_KEY = 'mvc_realid_message';

function isTimestampDesired(timestamp: number): boolean {
  const now = Date.now();
  const desiredTimestamp = now + 40 * 24 * 60 * 60 * 1000;
  return timestamp <= desiredTimestamp;
}

async function getMVCMessage(): Promise<string | undefined> {
  const data = await getMVCData(AppointmentType.REAL_ID);
  let message = '';
  for (const locationId of SUBSCRIBED_LOCATIONS) {
    const location = data.get(locationId);
    if (!location || !location.nextAvailability) {
      continue;
    }
    const {timestamp, url} = location.nextAvailability;
    if (!isTimestampDesired(timestamp)) {
      continue;
    }
    const date = new Date(timestamp);
    const dateStr = date.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      timeZoneName: 'short',
    });
    message += md`
\-\-\-\-\-\-\-\-
*Location:* ${location.name}
*Address:* ${location.address}
*Next available slot:* ${dateStr}
*Booking:* [link](${url})`;
  }
  if (message === '') {
    return undefined;
  }
  const head = '*Push: Soonest MVC Knowledge RealID Appointment*';
  return head + message;
}

async function main(): Promise<void> {
  const message = await getMVCMessage();
  if (!message) {
    console.log('No message to send');
    await set(REDIS_MESSAGE_KEY, '');
    return;
  }
  const lastMessage = await get(REDIS_MESSAGE_KEY);
  if (lastMessage === message) {
    console.log('Message is the same as last time, skipping');
    return;
  }
  console.log('Sending message:');
  console.log(message);
  await set(REDIS_MESSAGE_KEY, message);
  await sendTelegramMessage(message);
}

main()
  .catch(console.error)
  .finally(() => {
    redisCleanup();
  });
