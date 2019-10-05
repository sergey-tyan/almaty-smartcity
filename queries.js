const Pool = require('pg').Pool;
const pool = new Pool({
  user: 'styan',
  host: 'localhost',
  database: 'almaty',
  password: '',
  port: 5432,
});

const getDistance = (p1, p2) => {
  const lat1 = p1.latitude;
  const lat2 = p2.latitude;
  const lon1 = p1.longitude;
  const lon2 = p2.longitude;
  if (lat1 == lat2 && lon1 == lon2) {
    return 0;
  } else {
    let radlat1 = (Math.PI * lat1) / 180;
    let radlat2 = (Math.PI * lat2) / 180;
    let theta = lon1 - lon2;
    let radtheta = (Math.PI * theta) / 180;
    let dist =
      Math.sin(radlat1) * Math.sin(radlat2) +
      Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
      dist = 1;
    }
    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515;
    dist = dist * 1.609344 * 1000;
    return dist;
  }
};

const getMiddle = (p1, p2) => {
  return {
    latitude: p1.latitude + (p2.latitude - p1.latitude) * 0.5,
    longitude: p1.longitude + (p2.longitude - p1.longitude) * 0.5,
  };
};

const getItems = (request, response) => {
  const { lat1, lon1, lat2, lon2, time } = request.query;
  console.log({ lat1, lon1, lat2, lon2 });
  const p1 = {
    latitude: Number(lat1),
    longitude: Number(lon1),
  };
  const p2 = {
    latitude: Number(lat2),
    longitude: Number(lon2),
  };
  const distance = getDistance(p1, p2);
  const radius = distance / 2;
  const middle = getMiddle(p1, p2);
  const [hours, minutes] = time.split(':');
  const seconds = Number(minutes) * 60 + Number(hours) * 3600;
  const max = 86340;
  const left = seconds - 1800 < 0 ? max + (seconds - 1800) : seconds - 1800;
  const right = (seconds + 1800) % max;
  console.log({ distance, middle });
  pool.query(
    left > right
      ? `SELECT * FROM items WHERE ST_DWithin(geog, ST_SetSRID(ST_Point(${middle.latitude}, ${middle.longitude}), 4326), ${radius}) 
    AND (EXTRACT(hour FROM time)*60*60 + EXTRACT(minutes FROM time)*60 + EXTRACT(seconds FROM time) > ${left} 
    OR EXTRACT(hour FROM time)*60*60 + EXTRACT(minutes FROM time)*60 + EXTRACT(seconds FROM time) < ${right}) limit 20`
      : `SELECT * FROM items WHERE ST_DWithin(geog, ST_SetSRID(ST_Point(${middle.latitude}, ${middle.longitude}), 4326), ${radius}) 
    AND (EXTRACT(hour FROM time)*60*60 + EXTRACT(minutes FROM time)*60 + EXTRACT(seconds FROM time) > ${left} 
    AND EXTRACT(hour FROM time)*60*60 + EXTRACT(minutes FROM time)*60 + EXTRACT(seconds FROM time) < ${right}) limit 20`,
    (error, results) => {
      if (error) {
        throw error;
      }
      response.status(200).json(results.rows);
    },
  );
};

module.exports = {
  getItems,
};
