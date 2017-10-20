import _ from 'lodash'
import querystring from 'querystring'
import assert from 'assert'

export default function (AdminService, DriverService, $q) {
  /**
    @param options
      @prop routeId
      @prop startDate
    **/
  var tripCache = [];
  this.getTrips = function(options) {
    return AdminService.beeline({
      method: 'GET',
      url: `/routes/${options.routeId}?`+ querystring.stringify({
        includeTrips: true,
        startDate: options.startDate.getTime(),
        endDate: options.endDate.getTime(),
      })
    })
    .then((response) => {
      // Cache the last 100 trips
      tripCache = tripCache.concat(response.data.trips);
      tripCache = tripCache.slice(Math.max(0, tripCache.length - 100))

      return response.data.trips;
    })
    .then((trips) => {
      // convert the trip dates and tripstop times into Date objects
      for (let trip of trips) {
        trip.price = parseFloat(trip.price);
        trip.date = new Date(trip.date);
        for (let tripStop of trip.tripStops) {
          tripStop.time = new Date(tripStop.time);
        }
      }
      return trips;
    })
  }
  this.getTrip = function(tripId) {
    var trip;
    if (trip = tripCache.find(t => t.id == tripId)) {
      return $q((resolve) => resolve(trip));
    }
    return AdminService.beeline({
      method: 'GET',
      url: `/trips/${tripId}`,
    })
    .then((response) => {
      tripCache = tripCache.concat([response.data]);
      tripCache.slice(Math.max(0, tripCache.length - 100));
      return response.data;
    })
  }

  this.deleteTrip = function(trip) {
    return AdminService.beeline({
      method: 'DELETE',
      url: `/trips/${trip}`,
    })
  }

  this.getPings = function (options) {
    _.defaults(options, {
      limit: 100000,
    })
    return AdminService.beeline({
      method: 'GET',
      url: `/trips/${options.tripId}/pings?`
        + querystring.stringify(_.pick(options, [
          'startTime', 'endTime', 'byTripId', 'limit'
        ])),
    })
    .then((response) => {
      for (let ping of response.data) {
        ping.time = new Date(ping.time);
        ping.createdAt = new Date(ping.createdAt);
        ping.updatedAt = new Date(ping.updatedAt);
      }
      return response.data;
    })
  }
}
