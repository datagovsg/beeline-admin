
const monthNames =
  'January,February,March,April,May,June,July,August,September,October,November,December'
  .split(',')

module.exports = {
  date: require('dateformat'),
  _: require('lodash'),
  pointToLatLng: p => ({ lat: p.coordinates[1], lng: p.coordinates[0]}),
  leftPad: require('left-pad'),
  monthNames: n => monthNames[n]
}
