import _ from 'lodash'

export default function(RoutesService) {

  return {
    template: require('./routeSelector.html'),
    scope: {
      selectedRoute: '=',
    },
    link(scope, elem, attr) {

      scope.availableRoutes = [];

      scope.selectRoute = function(route) {
        scope.selectedRoute = route
      };
      scope.copySelected = function() {
        if (scope.selectedRoute) {
          var newRoute = _.assign({}, scope.selectedRoute);

          delete newRoute.id;
          RoutesService.saveRoute(newRoute);
        }
      }
      scope.refreshList = function() {
        RoutesService.getRoutes()
        .then((routes) => {
          scope.availableRoutes = routes;
        })
      }

      scope.refreshList();
    },
  }

}
