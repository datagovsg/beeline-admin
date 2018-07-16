import Vue from 'vue'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import AsyncComputed from 'vue-async-computed'
import * as VueGoogleMaps from 'vue2-google-maps'
import assert from 'assert'

import App from './App.vue'
import StoreDefinition from '@/stores'
import createRouter from '@/router'

document.addEventListener('DOMContentLoaded', () => {
  Vue.use(Vuex)
  Vue.use(VueGoogleMaps, {
    load: {
      key: 'AIzaSyBkFH42PlbFrsfdAnjw37qMLAxjhkMT-54',
      libraries: 'geometry'
    }
  })
  Vue.use(AsyncComputed)
  Vue.use(VueRouter)

  new Vue({
    el: '#app',
    store: new Vuex.Store(StoreDefinition),
    router: createRouter(),
    render (h) {
      return h(App)
    }
  })
})
