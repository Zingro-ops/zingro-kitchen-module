const axios = require('axios');

const cache = new Map();
const TTL_MS = (Number(process.env.DISTANCE_CACHE_TTL_MIN) || 15) * 60 * 1000;

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function getDistanceAndEta(origin, destination) {
  const key = `${origin.lat},${origin.lng}->${destination.lat},${destination.lng}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  try {
    const res = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: `${origin.lat},${origin.lng}`,
        destinations: `${destination.lat},${destination.lng}`,
        key: process.env.GOOGLE_MAPS_API_KEY
      },
      timeout: 4000
    });

    const element = res.data?.rows?.[0]?.elements?.[0];
    if (element?.status === 'OK') {
      const data = {
        distanceKm: Math.round((element.distance.value / 1000) * 10) / 10,
        etaMinutes: Math.round(element.duration.value / 60),
        estimated: false
      };
      cache.set(key, { data, expiresAt: Date.now() + TTL_MS });
      return data;
    }
    throw new Error('Distance Matrix element status not OK');
  } catch (err) {
    const distanceKm = Math.round(haversineKm(origin.lat, origin.lng, destination.lat, destination.lng) * 10) / 10;
    const etaMinutes = Math.round((distanceKm / 25) * 60);
    const data = { distanceKm, etaMinutes, estimated: true };
    cache.set(key, { data, expiresAt: Date.now() + TTL_MS / 3 });
    return data;
  }
}

module.exports = { getDistanceAndEta, haversineKm };
