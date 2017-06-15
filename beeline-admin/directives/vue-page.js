import Vue from 'vue'
import Vuex from 'vuex'
import * as VueGoogleMaps from 'vue2-google-maps'
import assert from 'assert'

Vue.use(Vuex)
Vue.use(VueGoogleMaps)

// PAGES
Vue.component('RoutesPage', require('../../beeline-admin/pages/routes.vue'))

// COMPONENTS
Vue.component('UibPagination', require('../../beeline-admin/components/pagination.vue'))
Vue.component('SortTh', require('../../beeline-admin/components/SortTh.vue'))
Vue.component('TagsView', require('../../beeline-admin/components/TagsView.vue'))
Vue.component('ExpandableArea', require('../../beeline-admin/components/ExpandableArea.vue'))
Vue.component('Modal', require('vue-strap/src/Modal.vue'))
Vue.component('PingPath', require('../components/PingPath.vue'))
Vue.component('TripStopMarker', require('../components/TripStopMarker.vue'))
Vue.component('LoadingSpinner', require('../../beeline-admin/components/LoadingSpinner.vue'))

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
