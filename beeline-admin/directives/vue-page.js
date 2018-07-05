import Vue from 'vue'
import Vuex from 'vuex'
import * as VueGoogleMaps from 'vue2-google-maps'
import AsyncComputed from 'vue-async-computed'
import assert from 'assert'

Vue.use(Vuex)
Vue.use(VueGoogleMaps)
Vue.use(AsyncComputed)

// PAGES
Vue.component('AdminsPage', require('@/pages/admins.vue').default)
Vue.component('AssetsPage', require('@/pages/assets.vue').default)
Vue.component('BookingsPage', require('@/pages/bookings.vue').default)
Vue.component('CompaniesPage', require('@/pages/companies.vue').default)
Vue.component('ContactListPage', require('@/pages/contact-list.vue').default)
Vue.component('ContactListsPage', require('@/pages/contact-lists.vue').default)
Vue.component('CrowdstartSummaryPage', require('@/pages/crowdstart-summary.vue').default)
Vue.component('RoutesPage', require('@/pages/routes.vue').default)
Vue.component('RoutePassesPage', require('@/pages/route-passes.vue').default)
Vue.component('RoutePage', require('@/pages/route.vue').default)
Vue.component('PromotionPage', require('@/pages/promotion.vue').default)
Vue.component('PromotionsPage', require('@/pages/promotions.vue').default)
Vue.component('TransactionsPage', require('@/pages/transactions.vue').default)
Vue.component('ExtendRoutesPage', require('@/pages/extend-routes.vue').default)
Vue.component('DriversPage', require('@/pages/drivers.vue').default)
Vue.component('SummaryPage', require('@/pages/ridership-summary.vue').default)
Vue.component('RouteTimelinessPage', require('@/pages/route-timeliness.vue').default)

// COMPONENTS
import ModalHelper from '@/components/ModalHelper'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
Vue.component('ModalHelper', ModalHelper)
Vue.component('LoadingSpinner', LoadingSpinner)

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
