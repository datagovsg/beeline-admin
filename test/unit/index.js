import '@babel/polyfill'
import Vue from 'vue'
import Vuex from 'vuex'

Vue.config.productionTip = false
Vue.use(Vuex)

// require all test files (files that ends with .spec.js)
const testsContext = require.context('./specs', true, /\.spec$/)
testsContext.keys().forEach(testsContext)

// require all Vue components for coverage
// TODO - work out why it's broken
const srcContext = require.context('../../beeline-admin/components', true)
srcContext.keys().forEach(srcContext)

