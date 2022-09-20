import Axios from 'axios';

const APPOINTMENT_URL_PREFIX =
  'https://telegov.njportal.com/njmvc/AppointmentWizard';

const REGEX_LOCATION_DATA = /var\s+locationData\s+=\s+(\[(.*?)\]);/;
const REGEX_TIME_DATA = /var\s+timeData\s+=\s+(\[(.*?)\])\s*\n/;
const REGEX_NEXT_AVAIL_DATA = /Next\s+Available:\s*([\d\/ :]+ (?:AM|PM))/i;

export enum AppointmentType {
  REAL_ID = 12,
}

export interface Availability {
  timestamp: number;
  url: string;
}

export interface Location {
  id: number;
  name: string;
  city: string;
  phone: string;
  address: string;
  zipCode: string;
  nextAvailability: Availability | undefined;
}

interface RawLocationItem {
  Id: number;
  Name: string;
  City: string;
  State: string;
  PhoneNumber: string;
  Street1: string;
  Street2: string | null;
  Zip: string;
}

interface RawTimeItem {
  LocationId: number;
  FirstOpenSlot: string;
}

interface RawMVCData {
  locations: RawLocationItem[];
  times: RawTimeItem[];
}

async function getRawMVCData(type: AppointmentType): Promise<RawMVCData> {
  const response = await Axios.get<string>(
    `${APPOINTMENT_URL_PREFIX}/${type}`,
    {
      responseType: 'text',
    },
  );
  const html = response.data;

  let matches = REGEX_LOCATION_DATA.exec(html);

  if (!matches) {
    throw new Error('Cannot find location data in portal');
  }

  const locations: RawLocationItem[] = JSON.parse(matches[1]);

  matches = REGEX_TIME_DATA.exec(response.data);

  if (!matches) {
    throw new Error('Cannot find time data in portal');
  }

  const times: RawTimeItem[] = JSON.parse(matches[1]);

  return {
    locations,
    times,
  };
}

function getAppointmentURL(
  locationId: number,
  type: AppointmentType,
  timeSlot: number,
) {
  function fillTimeDigits(time: string): string {
    if (time.length === 1) {
      return '0' + time;
    }
    return time;
  }

  let time = new Date(timeSlot);
  let year = String(time.getFullYear());
  let month = fillTimeDigits(String(time.getMonth() + 1));
  let day = fillTimeDigits(String(time.getDate()));
  let hour = String(time.getHours());
  let minute = fillTimeDigits(String(time.getMinutes()));

  return `${APPOINTMENT_URL_PREFIX}/${type}/${locationId}/${year}-${month}-${day}/${hour}${minute}`;
}

function processRawMVCData(
  type: AppointmentType,
  data: RawMVCData,
): Map<number, Location> {
  const locations = new Map<number, Location>();

  for (const location of data.locations) {
    locations.set(location.Id, {
      id: location.Id,
      name: location.Name,
      city: location.City,
      phone: location.PhoneNumber,
      address: `${location.Street1}, ${location.City}, ${location.State} ${location.Zip}`,
      zipCode: location.Zip,
      nextAvailability: undefined,
    });
  }

  for (const time of data.times) {
    const location = locations.get(time.LocationId);

    if (!location) {
      continue;
    }

    const matches = REGEX_NEXT_AVAIL_DATA.exec(time.FirstOpenSlot);

    if (!matches) {
      continue;
    }

    const nextAvailabilityDate = new Date(matches[1]);
    const nextAvailabilityTimestamp = nextAvailabilityDate.getTime();
    const nextAvailabilityURL = getAppointmentURL(
      location.id,
      type,
      nextAvailabilityTimestamp,
    );

    location.nextAvailability = {
      timestamp: nextAvailabilityTimestamp,
      url: nextAvailabilityURL,
    };
  }

  return locations;
}

export async function getMVCData(
  type: AppointmentType,
): Promise<Map<number, Location>> {
  const rawMVCData = await getRawMVCData(type);
  return processRawMVCData(type, rawMVCData);
}
