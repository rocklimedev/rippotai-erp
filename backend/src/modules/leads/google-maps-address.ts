import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';

import {
  isGoogleMapsShortLink,
  parseGoogleMapsUrl,
} from '@/common/google-maps-url';

type GeocodingResult = {
  status?: string;
  results?: { formatted_address?: string }[];
};

function coordinates(value: string): string | undefined {
  const match = /^\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\s*$/.exec(value);
  if (
    match &&
    Math.abs(Number(match[1])) <= 90 &&
    Math.abs(Number(match[2])) <= 180
  ) {
    return `${match[1]},${match[2]}`;
  }
}

export async function resolveGoogleMapsAddress(value: unknown) {
  let link = parseGoogleMapsUrl(value);
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!key) {
    throw new ServiceUnavailableException(
      'Google Maps lookup is not configured. Enter the address manually.',
    );
  }

  const signal = AbortSignal.timeout(8000);
  try {
    // Only contact the approved short-link hosts. Never follow a redirect automatically.
    for (let hops = 0; isGoogleMapsShortLink(link) && hops < 3; hops += 1) {
      const response = await fetch(link, { redirect: 'manual', signal });
      const next = response.headers.get('location');
      await response.body?.cancel();
      if (response.status < 300 || response.status >= 400 || !next) break;
      link = parseGoogleMapsUrl(new URL(next, link).href);
    }
  } catch {
    throw new BadRequestException(
      'Could not open this Google Maps link. Try sharing the place again.',
    );
  }
  if (isGoogleMapsShortLink(link)) {
    throw new BadRequestException(
      'Could not open this Google Maps link. Try sharing the place again.',
    );
  }

  let path: string;
  try {
    path = decodeURIComponent(link.pathname);
  } catch {
    throw new BadRequestException('Paste a valid Google Maps link.');
  }
  const query =
    link.searchParams.get('query') || link.searchParams.get('q') || '';
  const placeId =
    link.searchParams.get('query_place_id') ||
    link.searchParams.get('place_id') ||
    /^place_id:(.+)$/.exec(query)?.[1];
  const pin = /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/.exec(path);
  const placeName =
    /\/maps\/place\/([^/]+)/.exec(path)?.[1]?.replace(/\+/g, ' ') || '';
  const latlng =
    coordinates(query) ||
    (pin && coordinates(`${pin[1]},${pin[2]}`)) ||
    coordinates(placeName);
  const endpoint = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  endpoint.searchParams.set('key', key);
  if (placeId) endpoint.searchParams.set('place_id', placeId);
  else if (latlng) endpoint.searchParams.set('latlng', latlng);
  else if (query || placeName) {
    endpoint.searchParams.set('address', query || placeName);
  } else {
    throw new BadRequestException(
      'Share a specific place or dropped pin from Google Maps.',
    );
  }

  let result: GeocodingResult | null;
  try {
    const response = await fetch(endpoint, { redirect: 'error', signal });
    if (!response.ok) throw new Error();
    result = (await response.json()) as GeocodingResult | null;
  } catch {
    throw new ServiceUnavailableException(
      'Google Maps lookup is unavailable. Enter the address manually or try again.',
    );
  }
  if (result?.status === 'ZERO_RESULTS') {
    throw new BadRequestException(
      'No address was found for this location. Check the pin or enter the address manually.',
    );
  }
  const address = result?.results?.[0]?.formatted_address;
  if (
    result?.status !== 'OK' ||
    typeof address !== 'string' ||
    !address.trim()
  ) {
    throw new ServiceUnavailableException(
      'Google Maps could not complete the lookup. Enter the address manually.',
    );
  }
  return { address };
}
