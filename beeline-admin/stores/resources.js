import assert from 'assert'
import axios from 'axios'
import querystring from 'querystring'

export const storeModule = {
  namespaced: true,
  actions: {
    getRoute (context, {id, options}) {
      return context.rootGetters.axios
        .get(`/routes/${id}?` + querystring.stringify(options))
        .then((response) => postProcessRoute(response.data))
    },

    saveRoute (context, route) {
      if (route.id) {
        return context.rootGetters.axios
          .put(`/routes/${route.id}`, {
            ..._.omit(route, ['trips', 'regions']),
            features: route.features || '',
          })
          // TODO: you can update the routes cache
          // or you can invalidate the current list
      } else {
        return context.rootGetters.axios
          .post(`/routes`, {
            ..._.omit(route, ['trips', 'regions']),
            features: route.features || '',
          })
          // TODO: you can update the routes cache
          // or you can invalidate the current list
      }
    },

    saveTrip (context, options) {
      throw new Error()
    },

    createTripForDate (context, {date, trip}) {
      const updatableFields = [
        'driverId', 'capacity', 'companyId', 'price',
        'bookingInfo', 'status'
      ];
      const updatableTripStopFields = [
        'canBoard', 'canAlight', 'time', 'stopId'
      ]
      const creatableFields = updatableFields.concat([
        'routeId'
      ])
      const creatableTripStopFields = updatableTripStopFields.concat([])

      // must be round...
      assert.equal(date.getTime() % (24 * 3600 * 1000), 0,
        `Date of trip must be at UTC midnight`)

      function combineDateTime(utcDate, localTime) {
        return new Date(
          utcDate.getUTCFullYear(),
          utcDate.getUTCMonth(),
          utcDate.getUTCDate(),
          localTime.getHours(),
          localTime.getMinutes(),
          localTime.getSeconds(),
        )
      }

      return context.rootGetters.axios.post('/trips', {
        ..._.pick(trip, creatableFields),
        date,
        tripStops: trip.tripStops.map(ts => ({
          ..._.pick(ts, creatableTripStopFields),
          time: combineDateTime(date, ts.time).getTime()
        }))
      })
    },

    getPings(context, {tripId, options}) {
      return context.rootGetters.axios.get(`/trips/${tripId}/pings?` +
        querystring.stringify(_.pick(options, ['startTime', 'endTime', 'byTripId', 'limit'])))
        .then(resp => resp.data.map(postProcessPing))
    },
  }
}

export function postProcessRoute (route) {
  return {
    ...route,
    notes: route.notes || {},
    trips: route.trips && route.trips.map(trip => ({
      ...trip,
      date: new Date(trip.date),
      tripStops: trip.tripStops.map(ts => ({
        ...ts,
        time: new Date(ts.time)
      }))
    }))
  }
}

export function postProcessPing (ping) {
  return {
    ...ping,
    createdAt: new Date(ping.createdAt),
    updatedAt: new Date(ping.updatedAt),
    time: new Date(ping.time),
  }
}
