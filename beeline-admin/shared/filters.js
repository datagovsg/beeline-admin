import _ from 'lodash'

export function makeRoutePath() {
  return (routePath) => {
    return routePath ? routePath.map((point) => ({
      latitude: point.lat,
      longitude: point.lon,
    })) : []
  }
}


export function makeRange() {
  return (i) => _.range(i)
}

export function hasStop() {
  return (trip, stopId) => {
    return trip.tripStops.findIndex(ts => ts.stop.id == stopId) != -1;
  }
}
