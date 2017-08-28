
const monthNames =
  'January,February,March,April,May,June,July,August,September,October,November,December'
  .split(',')

module.exports = {
  date: require('dateformat'),
  _: require('lodash'),
  pointToLatLng: p => ({ lat: p.coordinates[1], lng: p.coordinates[0]}),
  leftPad: require('left-pad'),
  titleCase: require('title-case'),
  monthNames: n => monthNames[n],

  moveUp(arr, index) {
    if (index === 0) return arr

    return arr.slice(0, index - 1).concat([arr[index], arr[index - 1]]).concat(arr.slice(index + 1))
  },

  moveDown(arr, index) {
    if (index === arr.length - 1) return arr

    return arr.slice(0, index).concat([arr[index + 1], arr[index]]).concat(arr.slice(index + 2))
  }
}
