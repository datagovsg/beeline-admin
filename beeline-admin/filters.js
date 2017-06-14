module.exports = {
  date: require('dateformat'),
  _: require('lodash'),
  pointToLatLng: p => ({ lat: p.coordinates[1], lng: p.coordinates[0]})
}
