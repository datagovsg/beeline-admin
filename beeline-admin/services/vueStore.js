import Vuex from 'vuex'
import axios from 'axios'
import querystring from 'querystring'
import jwtDecode from 'jwt-decode'
import _ from 'lodash'

angular.module('beeline-admin')
.factory('vueStore', () => {
  const store = new Vuex.Store({
    modules: {
      shared: require('../stores/sharedStore.js'),
      spinner: require('../stores/spinner.js'),
      modals: require('../stores/modals.js'),
      resources: require('../shared/resources.js').storeModule,
    },
    state: {
      idToken: null,
      companyId: null,
    },
    getters: {
      axios: state => axios.create({
        baseURL: process.env.BACKEND_URL,
        headers: {
          authorization: state.idToken ? `Bearer ${state.idToken}` : null
        }
      }),

      isSuperAdmin (state) {
        if (!state.idToken) return false

        const decoded = jwtDecode(state.idToken)
        return decoded.app_metadata.roles.includes('superadmin')
      }
    },
    mutations: {
      setCompanyId(state, companyId) {
        state.companyId = companyId
      },
      setIdToken(state, idToken) {
        state.idToken = idToken
      },
    },
    actions: {
    },
  })
  return store
})
