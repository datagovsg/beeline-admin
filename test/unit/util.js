import sinon from 'sinon'
import querystring from 'querystring'
import axios from 'axios'
import Vuex from 'vuex'
import { mount } from '@vue/test-utils'

import TestSkeleton from './TestSkeleton.vue'
import StoreDefinition from '@/stores'

export function delay (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * This shared store should reflect what we have in vueStore.js
 *
 * @param {} param0
 */
export function testStore ({modules, state, getters, mutations, actions}) {
  return new Vuex.Store({
    ...StoreDefinition,
    modules: {
      ...StoreDefinition.modules,
      ...modules
    },
    state: () => ({
      ...(StoreDefinition.state && StoreDefinition.state()),
      _isSuperAdmin: false,
      ...state
    }),
    getters: {
      ...StoreDefinition.getters,
      
      axios: () => axios,

      isSuperAdmin (state) {
        return state._isSuperAdmin
      },
      ...getters,
    },
    mutations: {
      ...StoreDefinition.mutations,
      ...mutations
    },
    actions: {
      ...StoreDefinition.actions,
      ...actions
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
 *    }],
 *
 *    'GET /a/b/c?d&e&f
 * }
 *
 * --> axios.get('/a/b/c') => Promise.resolve({ data: {hello: world}})
 * --> axios.get('/a/b/c?d=1&e=2&f=3') => Promise.resolve({ data: {hello: world}, query: {...}})
 */
export async function mockAjax(routes, fn) {

  // Build up the routes
  const routesByMethod = {
    get: [],
    post: [],
    put: [],
    head: [],
    delete: [],
  }

  for (let route in routes) {
    const parts = route.split(/ /, 2)
    const method = parts[0].toLowerCase()
    const pathAndQuery = parts[1]
    const [path, query] = pathAndQuery.split(/\?/, 2)
    const queryParts = query && query.split(/&/g)
      .map(q => q.split(/=/, 2))
      .reduce(
        (acc, [key, value]) => {
          acc[key] = (value === undefined) ? null : decodeURIComponent(value)
          return acc
        }, {}
      )
    const [status, value, callback] = routes[route]

    routesByMethod[method] = routesByMethod[method] || []
    routesByMethod[method].push({
      path,
      queryParts,
      value: (request) => JSON.parse(JSON.stringify(
        typeof value === 'function' ? value(request) : value)),
      status,
      callback
    })
  }

  let sandbox = sinon.createSandbox({})

  try {
    // Stub
    for (let method in routesByMethod) {
      sandbox.stub(axios, method).callsFake(async (path, maybeData, options) => {
        const [pathOnly, query] = path.split(/\?/, 2)
        const queryData = querystring.parse(query)

        const result = routesByMethod[method].find(s =>
          s.path === pathOnly &&
          (!s.queryParts || (
            Object.keys(s.queryParts).every((key) => {
              if (s.queryParts[key] === null) {
                return key in queryData
              } else {
                return queryData[key] === s.queryParts[key]
              }
            })
          ))
        )

        // axios.{post, patch, put} accepts a `data` argument
        // also -- must make sure requests are JSON serializable
        if (method === 'get' || method === 'delete' || method === 'head' || method === 'options') {
          options = maybeData
          maybeData = undefined
        } else {
          maybeData = maybeData && JSON.parse(JSON.stringify(maybeData))
        }

        if (result) {
          const generatedValue = await result.value({
            query: queryData,
            method,
            path,
            data: maybeData
          })

          if (result.callback) {
            // TODO: Should this be asynchronous or synchronous?
            await result.callback({
              data: maybeData,
              query: queryData,
              path,
              ...options
            }, {
              status: result.status,
              data: generatedValue,
              method
            })
          }

          if (result.status >= 200 && result.status < 300) {
            return {
              status: result.status,
              data: generatedValue
            }
          } else {
            const e = new Error('Simulated HTTP Error')
            e.response = {
              status: result.status,
              data: generatedValue
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
    }

    return await fn()
  } finally {
    sandbox.restore()
  }
}

/**
 * Wrapper around vue-test-utils::mount so that mounted components
 * can continue to get access to modals and spinners.
 * 
 * @param {string|component definition} component 
 * @param {object} mountOptions 
 */
export function mountTestPage (component, mountOptions) {
  const store = testStore({})

  // i need to be logged in
  store.commit('auth/authenticate', {
    idToken: [
      {},
      {},
      {}
    ].map(d => btoa(JSON.stringify(d))).join('.')
  })

  return mount(
    TestSkeleton,
    {
      sync: false,
      store,
      ...mountOptions,
      attrs: {
        ...mountOptions.propsData,
      },
      propsData: {
        skelComponent: component,
      }
    }
  )
}
