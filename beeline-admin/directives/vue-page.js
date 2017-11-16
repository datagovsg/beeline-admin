import Vue from 'vue'
import Vuex from 'vuex'
import * as VueGoogleMaps from 'vue2-google-maps'
import AsyncComputed from 'vue-async-computed'
import assert from 'assert'

Vue.use(Vuex)
Vue.use(VueGoogleMaps)
Vue.use(AsyncComputed)

// PAGES
Vue.component('RoutesPage', require('../../beeline-admin/pages/routes.vue').default)
Vue.component('RoutePassesPage', require('../../beeline-admin/pages/routePasses.vue').default)
Vue.component('RoutePage', require('../../beeline-admin/pages/route.vue').default)
Vue.component('PromotionPage', require('../../beeline-admin/pages/promotion.vue').default)
Vue.component('PromotionsPage', require('../../beeline-admin/pages/promotions.vue').default)
Vue.component('ExtendRoutesPage', require('../../beeline-admin/pages/extendRoutes.vue').default)
Vue.component('DriversPage', require('../../beeline-admin/pages/drivers.vue').default)

// COMPONENTS
Vue.component('Dropdown', require('../../beeline-admin/components/Dropdown.vue').default)
Vue.component('DatasheetCell', require('../../beeline-admin/components/DatasheetCell.vue').default)
Vue.component('UibPagination', require('../../beeline-admin/components/UibPagination.vue').default)
Vue.component('SortTh', require('../../beeline-admin/components/SortTh.vue').default)
Vue.component('TagsView', require('../components/TagsView.vue').default)
Vue.component('TagsEditor', require('../components/TagsEditor.vue').default)
Vue.component('NumberArrayEditor', require('../components/NumberArrayEditor.vue').default)
Vue.component('CompanySelector', require('../components/CompanySelector.vue').default)
Vue.component('ExpandableArea', require('../../beeline-admin/components/ExpandableArea.vue').default)
Vue.component('ModalHelper', require('../components/ModalHelper'))
Vue.component('PingPath', require('../components/PingPath.vue').default)
Vue.component('TripStopMarker', require('../components/TripStopMarker.vue').default)
Vue.component('LoadingSpinner', require('../../beeline-admin/components/LoadingSpinner.vue').default)
Vue.component('DatePickerDropdown', require('../components/DatePickerDropdown.vue').default)
Vue.component('MonthPickerDropdown', require('../components/MonthPickerDropdown.vue').default)
Vue.component('MonthPicker', require('../components/MonthPicker.vue').default)
Vue.component('PriceInput', require('../components/PriceInput.vue').default)
Vue.component('TimeInput', require('../components/TimeInput.vue').default)
Vue.component('StopSelector', require('../components/StopSelector.vue').default)
Vue.component('Select2', require('../components/Select2.vue').default)
Vue.component('SpanSelect', require('../components/SpanSelect.vue').default)
Vue.component('UserIdSelector', require('../components/UserIdSelector.vue').default)
Vue.component('RouteTagSelector', require('../components/RouteTagSelector.vue').default)

Vue.component('Modal', require('../modals/MyModal.vue').default)
Vue.component('Tabs', require('vue-strap/src/Tabs.vue').default)
Vue.component('Tab', require('vue-strap/src/Tab.vue').default)
Vue.component('VueSelect', require('vue-select').default)

angular.module('beeline-admin')
.directive('vuePage', function (vueStore, uiGmapGoogleMapApi) {

  uiGmapGoogleMapApi.then((googleMaps) => {
    window.vueGoogleMapsInit(googleMaps)
  })

  return {
    scope: {
      component: '@',
      props: '<',
    },
    link (scope, el, attributes) {
      assert(scope.component)

      const vm = new Vue({
        el: el[0],
        data: _.pick(scope, ['component', 'props']),
        store: vueStore,
        render(h) {
          return h(
            Vue.component(scope.component),
            { props: scope.props },
            []
          )
        }
      })

      scope.$on('$destroy', () => {
        vm.$destroy()
      })
    }
  }
})
