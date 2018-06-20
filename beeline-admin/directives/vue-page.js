import Vue from 'vue'
import Vuex from 'vuex'
import * as VueGoogleMaps from 'vue2-google-maps'
import AsyncComputed from 'vue-async-computed'
import assert from 'assert'

Vue.use(Vuex)
Vue.use(VueGoogleMaps)
Vue.use(AsyncComputed)

// PAGES
Vue.component('AdminsPage', require('../../beeline-admin/pages/admins.vue').default)
Vue.component('AssetsPage', require('../../beeline-admin/pages/assets.vue').default)
Vue.component('ContactListsPage', require('../../beeline-admin/pages/contactLists.vue').default)
Vue.component('RoutesPage', require('../../beeline-admin/pages/routes.vue').default)
Vue.component('RoutePassesPage', require('../../beeline-admin/pages/route-passes.vue').default)
Vue.component('RoutePage', require('../../beeline-admin/pages/route.vue').default)
Vue.component('PromotionPage', require('../../beeline-admin/pages/promotion.vue').default)
Vue.component('PromotionsPage', require('../../beeline-admin/pages/promotions.vue').default)
Vue.component('ExtendRoutesPage', require('../../beeline-admin/pages/extend-routes.vue').default)
Vue.component('DriversPage', require('../../beeline-admin/pages/drivers.vue').default)
Vue.component('SummaryPage', require('../../beeline-admin/pages/ridershipSummary.vue').default)
Vue.component('RouteTimelinessPage', require('../../beeline-admin/pages/route-timeliness.vue').default)

// COMPONENTS
Vue.component('ModalHelper', require('../components/ModalHelper'))
Vue.component('LoadingSpinner', require('../../beeline-admin/components/LoadingSpinner.vue').default)

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
