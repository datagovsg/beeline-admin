import SharedStore from '@/stores/shared'
import CompanySharedStore from '@/stores/companyShared'
import sinon from 'sinon'
import axios from 'axios'
import Vuex from 'vuex'

export function delay (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * This shared store should reflect what we have in vueStore.js
 *
 * @param {} param0
 */
export function testStore ({modules, state, getters, mutations, actions}, fakeAxiosRoute) {
  return new Vuex.Store({
    modules: {
      shared: SharedStore,
      companyShared: CompanySharedStore,
      spinner: require('@/stores/spinner.js'),
      modals: require('@/stores/modals.js'),
      resources: require('@/stores/resources.js').storeModule,
      // ...modules,
    },
    state: {
      idToken: null,
      companyId: null,
      ...state,
    },
    getters: {
      axios: () => axios,

      isSuperAdmin (state) {
        if (!state.idToken) return false

        // FIXME: remove dependency on app_metadata
        // Should rely on (GET /admins/whoami).scope
        const decoded = jwtDecode(state.idToken)
        return _.get(decoded, 'app_metadata.roles', []).includes('superadmin')
      },

      ...getters,
    },
    mutations: {
      setCompanyId(state, companyId) {
        state.companyId = companyId
      },
      setIdToken(state, idToken) {
        state.idToken = idToken
      },

      ...mutations,
    },
    actions: {
      ...actions,
    },
  })
}



/**
 * Help: is there a good ajax mocking library?
 *
 * Idea:
 * {
 *    'GET /a/b/c': [200, {
 *      hello: 'world'
 *    }]
 * }
 *
 * --> axios.get('/a/b/c') => Promise.resolve({ data: {hello: world}})
 */
export async function mockAjax(routes, fn) {

  // Build up the routes
  const routesByMethod = {}

  for (let route in routes) {
    const parts = route.split(/ /, 2)
    const method = parts[0].toLowerCase()
    const path = parts[1]
    const [status, value, callback] = routes[route]

    routesByMethod[method] = routesByMethod[method] || []
    routesByMethod[method].push({
      path,
      value: JSON.parse(JSON.stringify(value)),
      status,
      callback
    })
  }

  let v = null

  try {
    // Stub
    const stubs = []
    for (let method in routesByMethod) {
      const stub = sinon.stub(axios, method).callsFake(async (path, maybeData, options) => {
        const result = routesByMethod[method].find(s => s.path === path)

        // axios.{post, patch, put} accepts a `data` argument
        // also -- must make sure requests are JSON serializable
        if (method === 'get' || method === 'delete' || method === 'head' || method === 'options') {
          options = maybeData
        } else {
          maybeData = JSON.parse(JSON.stringify(maybeData))
        }

        if (result) {
          if (result.callback) {
            // TODO: Should this be asynchronous or synchronous?
            await result.callback({
              data: maybeData,
              path,
              ...options
            }, {
              status: result.status,
              data: result.value,
              method
            })
          }

          if (result.status >= 200 && result.status < 300) {
            return {
              status: result.status,
              data: result.value,
            }
          } else {
            const e = new Error('Simulated HTTP Error')
            e.response = {
              status: result.status,
              data: result.value
            }
            throw e
          }
        } else {
          const message = `"${path}" was not found. We have ` +
          `${routesByMethod[method].map(s => '"' + s.path + '"').join(',')}`
          const e = new Error(message)
          e.response = {
            status: 404,
            data: message
          }
          throw e
        }

      })
      stubs.push(stub)
    }

    v = await fn()
  } finally {
    for (let method in routesByMethod) {
      axios[method].restore()
    }
  }

  return v
}
