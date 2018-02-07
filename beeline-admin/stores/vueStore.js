import Vuex from 'vuex'
import axios from 'axios'
import querystring from 'querystring'
import jwtDecode from 'jwt-decode'
import _ from 'lodash'

import SharedStore from './shared'
import CompanySharedStore from './companyShared'

angular.module('beeline-admin')
.factory('vueStore', () => {
  const store = new Vuex.Store({
    modules: {
      shared: SharedStore,
      companyShared: CompanySharedStore,
      spinner: require('./spinner.js'),
      modals: require('./modals.js'),
      resources: require('./resources.js').storeModule,
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

        // FIXME: remove dependency on app_metadata
        // Should rely on (GET /admins/whoami).scope
        const decoded = jwtDecode(state.idToken)
        return _.get(decoded, 'app_metadata.roles', []).includes('superadmin')
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
