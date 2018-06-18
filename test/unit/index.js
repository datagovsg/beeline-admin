import 'angular'
import 'babel-polyfill'
import Vue from 'vue'
import Vuex from 'vuex'

Vue.config.productionTip = false
Vue.use(Vuex)

// Argh: copied from vue-page.js
// COMPONENTS
Vue.component('Dropdown', require('@/components/Dropdown.vue').default)
Vue.component('DatasheetCell', require('@/components/DatasheetCell.vue').default)
Vue.component('UibPagination', require('@/components/UibPagination.vue').default)
Vue.component('SortTh', require('@/components/SortTh.vue').default)
Vue.component('TagsView', require('@/components/TagsView.vue').default)
Vue.component('TagsEditor', require('@/components/TagsEditor.vue').default)
Vue.component('NumberArrayEditor', require('@/components/NumberArrayEditor.vue').default)
Vue.component('CompanySelector', require('@/components/CompanySelector.vue').default)
Vue.component('ExpandableArea', require('@/components/ExpandableArea.vue').default)
Vue.component('ModalHelper', require('@/components/ModalHelper'))
Vue.component('PingPath', require('@/components/PingPath.vue').default)
Vue.component('TripStopMarker', require('@/components/TripStopMarker.vue').default)
Vue.component('LoadingSpinner', require('@/components/LoadingSpinner.vue').default)
Vue.component('DatePickerDropdown', require('@/components/DatePickerDropdown.vue').default)
Vue.component('MonthPickerDropdown', require('@/components/MonthPickerDropdown.vue').default)
Vue.component('MonthPicker', require('@/components/MonthPicker.vue').default)
Vue.component('PriceInput', require('@/components/PriceInput.vue').default)
Vue.component('TimeInput', require('@/components/TimeInput.vue').default)
Vue.component('StopSelector', require('@/components/StopSelector.vue').default)
Vue.component('Select2', require('@/components/Select2.vue').default)
Vue.component('SpanSelect', require('@/components/SpanSelect.vue').default)
Vue.component('UserIdSelector', require('@/components/UserIdSelector.vue').default)
Vue.component('RouteTagSelector', require('@/components/RouteTagSelector.vue').default)

Vue.component('Modal', require('@/modals/MyModal.vue').default)
Vue.component('Tabs', require('vue-strap/src/Tabs.vue').default)
Vue.component('Tab', require('vue-strap/src/Tab.vue').default)
Vue.component('VueSelect', require('vue-select').default)

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
