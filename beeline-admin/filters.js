import numeral from 'numeral'

const _monthNames =
  'January,February,March,April,May,June,July,August,September,October,November,December'
    .split(',')

export const date = require('dateformat')
export const number = (n, f) => numeral(n).format(f)
export const _ = require('lodash')
export const pointToLatLng = p => ({lat: p.coordinates[1], lng: p.coordinates[0]})
export const leftPad = require('left-pad')
export const titleCase = require('title-case')
export const monthNames = n => _monthNames[n]

export function moveUp (arr, index) {
  if (index === 0) return arr

  return arr.slice(0, index - 1).concat([arr[index], arr[index - 1]]).concat(arr.slice(index + 1))
}

export function moveDown (arr, index) {
  if (index === arr.length - 1) return arr

  return arr.slice(0, index).concat([arr[index + 1], arr[index]]).concat(arr.slice(index + 2))
}

export function isRouteACrowdstart (route) {
  return route && (
    route.tags.includes('crowdstart') ||
    route.tags.includes('crowdstart-private')
  )
}

export function isCrowdstartClosed (route) {
  return route && (
    route.tags.includes('success') ||
    route.tags.includes('failed')
  )
}

export function makeRoutePath () {
  return (routePath) => {
    return routePath ? routePath.map((point) => ({
      latitude: point.lat,
      longitude: point.lon
    })) : []
  }
}

export function timeSinceMidnight (date) {
  if (!(date instanceof Date)) {
    date = new Date(date)
  }
  return date.getHours() * 3600000 +
    date.getMinutes() * 60000 +
    date.getSeconds() * 1000 +
    date.getMilliseconds()
}

export function makeRange () {
  return (i) => _.range(i)
}

export function equalsIgnoreCase (a, b) {
  return (!a && !b) ||
    (a && b && a.toLowerCase() === b.toLowerCase())
}

export function intervalToTime () {
  return (interval) => {
    if (!interval) return null

    var offset = 0

    offset += interval.days || 0
    offset *= 24
    offset += interval.hours || 0
    offset *= 60
    offset += interval.minutes || 0
    offset *= 60
    offset += interval.seconds || 0
    offset *= 1000

    return new Date(offset)
  }
}
