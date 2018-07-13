import Vuex from 'vuex'
import axios from 'axios'
import jwtDecode from 'jwt-decode'
import _ from 'lodash'

import SharedStore from './shared'
import CompanySharedStore from './companyShared'

export default {
  modules: {
    shared: SharedStore,
    companyShared: CompanySharedStore,
    spinner: require('./spinner.js'),
    modals: require('./modals.js'),
    auth: require('./auth.js'),
    dropdown: require('./dropdown.js'),
    resources: require('./resources.js').storeModule,
  },
  state: () => ({
    idToken: null,
    companyId: null,
  }),
  getters: {
    axios: (state, getters, rootState) => {
      return axios.create({
        baseURL: process.env.BACKEND_URL,
        headers: {
          authorization: rootState.auth.idToken ? `Bearer ${rootState.auth.idToken}` : null
        }
      })
    },

    isSuperAdmin (state, getters, rootState) {
      if (!rootState.auth.idToken) return false

      // FIXME: remove dependency on app_metadata
      // Should rely on (GET /admins/whoami).scope
      const decoded = jwtDecode(rootState.auth.idToken)
      return _.get(decoded, 'app_metadata.roles', []).includes('superadmin')
    },

    sessionEmail (state, getters, rootState) {
      return rootState.auth.idToken &&
        jwtDecode(rootState.auth.idToken).email
    }
  },
  mutations: {
    setCompanyId(state, companyId) {
      state.companyId = companyId
    },
  },
  actions: {
  },
}
