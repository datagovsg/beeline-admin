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


export function intervalToTime() {
  return (interval) => {
    var offset = 0;

    offset += interval.days || 0;
    offset *= 24;
    offset += interval.hours || 0;
    offset *= 60;
    offset += interval.minutes || 0;
    offset *= 60;
    offset += interval.seconds || 0;
    offset *= 1000;

    return new Date(offset);
  }
}
