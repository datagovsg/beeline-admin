import 'angular'
import '@babel/polyfill'
import Vue from 'vue'
import Vuex from 'vuex'

Vue.config.productionTip = false
Vue.use(Vuex)

// Argh: copied from vue-page.js
// COMPONENTS
import ModalHelper from '@/components/ModalHelper'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
Vue.component('ModalHelper', ModalHelper)
Vue.component('LoadingSpinner', LoadingSpinner)

// require all test files (files that ends with .spec.js)
const testsContext = require.context('./specs', true, /\.spec$/)
testsContext.keys().forEach(testsContext)

// require all Vue components for coverage
// TODO - work out why it's broken
const srcContext = require.context('../../beeline-admin/components', true)
srcContext.keys().forEach(srcContext)

angular.module('beeline-admin', [
  'uiGmapgoogle-maps', 'ui.router', 'ui.bootstrap',
  'angular-storage', 'angular-jwt', 'ngCookies', 'multipleDatePicker',
  'ui.select', 'ngTagEditor'])

require('~/beeline-admin/auth0.js')
