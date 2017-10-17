import Vuex from 'vuex'
import axios from 'axios'
import querystring from 'querystring'
import _ from 'lodash'
import * as resources from '../stores/resources'
import SharedStoreTemplate from './SharedStoreTemplate'

const fetchJobs = {
  allRoutes: {
    url: '/routes?' + querystring.stringify({
      startDate: '2015-01-01',
      endDate: '2099-01-01',
      includeTrips: true,
      includeIndicative: true,
      includeDates: true,
    }),
    postProcess: x => x.map(resources.postProcessRoute)
  },
  currentRoutes: {
    url: '/routes?' + querystring.stringify({
      startDate: Date.now(),
      includeTrips: true
    }),
    postProcess(routes) {
      return routes.map(r => ({
        ...r,
        trips: r.trips.map(trip => ({
          ...trip,
          date: new Date(trip.date),
          tripStops: trip.tripStops.map(ts => ({
            ...ts,
            time: new Date(ts.time)
          }))
        })),
      }))
    }
  },
  companies: {
    url: '/companies'
  },
  stops: {url: '/stops'},
  publicHolidays: {url: '/publicHolidays'},
  vehicles: {url: '/vehicles'},
}

export default SharedStoreTemplate({}, fetchJobs)
