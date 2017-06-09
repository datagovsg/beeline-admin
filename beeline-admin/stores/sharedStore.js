import Vuex from 'vuex'
import axios from 'axios'
import querystring from 'querystring'
import _ from 'lodash'


const fetchJobs = {
  allRoutes: {
    url: '/routes?' + querystring.stringify({
      start_date: '2015-01-01',
      end_date: '2099-01-01',
      include_trips: true,
      include_indicative: true
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
        indicativeTrip: {
          ...r.indicativeTrip,
        }
      }))
    }
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
  }
}

module.exports = {
  namespaced: true,
  state: {
    ... _.mapValues(fetchJobs, () => null),
    promises: _.mapValues(fetchJobs, () => null)
  },
  getters: {
    ... _(fetchJobs).toPairs()
      .map(([job, data]) => {
        const getter = (state) => {
          return _.keyBy(state[job], 'id')
        }
        return [`${job}ById`, getter]
      })
      .fromPairs()
      .value(),
  },
  mutations: {
    updateSharedPromises(state, which) {
      _.assign(state.promises, which)
    },
    updateShared(state, which) {
      _.assign(state, which)
    },
  },
  actions: {
    invalidate(context, job) {
      context.commit('updateSharedPromises', {
        [job]: null
      })
      context.commit('updateShared', {
        [job]: null
      })
    },
    refresh(context, job) {
      const fetchPromise = context.rootGetters.axios.get(fetchJobs[job].url)

      context.commit('updateSharedPromises', {
        [job]: fetchPromise
      })

      fetchPromise.then((response) => {
        context.commit('updateShared', {
          [job]: (fetchJobs[job].postProcess || (x => x))(response.data),
        })
      })
    },
    fetch (context, job) {
      if (context.state.promises[job]) return

      context.dispatch('refresh', job)
    }
  }
}
