import Vuex from 'vuex'
import axios from 'axios'
import querystring from 'querystring'
import _ from 'lodash'
import * as resources from '../stores/resources'
import SharedStoreTemplate from './SharedStoreTemplate'

const fetchJobs = {
  allRoutes: {
    url: '/routes?' + querystring.stringify({
      start_date: '2015-01-01',
      end_date: '2099-01-01',
      include_trips: true,
      include_indicative: true,
      include_dates: true,
    }),
    postProcess: x => x.map(resources.postProcessRoute)
  },
  currentRoutes: {
    url: '/routes?' + querystring.stringify({
      start_date: Date.now(),
      include_trips: true
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
