import Vuex from 'vuex'
import axios from 'axios'
import querystring from 'querystring'
import _ from 'lodash'

angular.module('beeline-admin')
.factory('vueStore', () => {
  const store = new Vuex.Store({
    modules: {
      shared: require('../stores/sharedStore.js'),
      modals: require('../stores/modals.js'),
      resources: require('../shared/resources.js').storeModule,
    },
    state: {
      idToken: null,
      companyId: null
    },
    getters: {
      axios: state => axios.create({
        baseURL: process.env.BACKEND_URL,
        headers: {
          authorization: state.idToken ? `Bearer ${state.idToken}` : null
        }
      })
    },
    mutations: {
      setCompanyId(state, companyId) {
        state.companyId = companyId
      },
      setIdToken(state, idToken) {
        state.idToken = idToken
      }
    },
    actions: {
    },
  })
  return store
})
