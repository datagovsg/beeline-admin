import Vue from 'vue'
import Vuex from 'vuex'
import assert from 'assert'

Vue.use(Vuex)

// PAGES
Vue.component('RoutesPage', require('../../beeline-admin/pages/routes.vue'))

// COMPONENTS
Vue.component('UibPagination', require('../../beeline-admin/components/pagination.vue'))
Vue.component('SortTh', require('../../beeline-admin/components/SortTh.vue'))
Vue.component('TagsView', require('../../beeline-admin/components/TagsView.vue'))
Vue.component('ExpandableArea', require('../../beeline-admin/components/ExpandableArea.vue'))

angular.module('beeline-admin')
.directive('vuePage', function (vueStore) {
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
