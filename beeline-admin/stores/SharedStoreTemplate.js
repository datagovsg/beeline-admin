import Vuex from 'vuex'
import axios from 'axios'
import querystring from 'querystring'
import _ from 'lodash'
import * as resources from '../stores/resources'

export default function SharedStoreTemplate (definition, fetchJobs) {
  return {
    namespaced: true,
    state: () => ({
      ...definition.state,
      ... _.mapValues(fetchJobs, () => null),
      promises: _.mapValues(fetchJobs, () => null)
    }),
    getters: {
      ...definition.getters,
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
      ...definition.mutations,
      updateSharedPromises(state, which) {
        Object.assign(state.promises, which)
      },
      updateShared(state, which) {
        Object.assign(state, which)
      },
    },
    actions: {
      ...definition.actions,
      invalidate(context, jobs) {
        if (!(jobs instanceof Array)) jobs = [jobs]

        jobs.forEach(job => {
          context.commit('updateSharedPromises', {
            [job]: null
          })
          context.commit('updateShared', {
            [job]: null
          })
        })
      },
      refresh(context, jobs) {
        if (!(jobs instanceof Array)) jobs = [jobs]

        return Promise.all(jobs.map(job => {
          const fetcher = fetchJobs[job]
          const fetchData = typeof fetcher === 'function'
            ? fetcher(context.state)
            : fetcher

          const fetchPromise = context.rootGetters.axios.get(fetchData.url)

          context.commit('updateSharedPromises', {
            [job]: fetchPromise
          })

          return fetchPromise.then((response) => {
            context.commit('updateShared', {
              [job]: fetchJobs[job].postProcess
                ? fetchJobs[job].postProcess(response.data)
                : response.data,
            })
          })
        }))
      },
      fetch (context, jobs) {
        if (!(jobs instanceof Array)) jobs = [jobs]

        return Promise.all(jobs.map(job => {
          return context.state.promises[job]
            ? context.state.promises[job] : context.dispatch('refresh', job)
        }))
      }
    }
  }
}
