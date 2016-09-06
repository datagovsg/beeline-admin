import _ from 'lodash'

export default function(RoutesService, LoadingSpinner, $rootScope, commonModals) {

  return {
    template: require('./routeSelector.html'),
    scope: {
      selectedRoute: '=',
      selectedRouteId: '=?',
    },
    link(scope, elem, attr) {

      scope.availableRoutes = [];

      scope.selectRoute = function(route) {
        scope.selectedRoute = route
        if (route) scope.selectedRouteId = route.id;
      };
      scope.copySelected = async function() {
        if (scope.selectedRoute) {
          var newRoute = _.omit(scope.selectedRoute, ['id']);

          // Prompt for a new label
          newRoute.label = await commonModals.prompt({
            message: 'New route label',
            'default': newRoute.label
          })

          if (!newRoute.label) {return;}

          var createdRoute = await RoutesService.saveRoute(newRoute);

          scope.availableRoutes.push(createdRoute);
          scope.selectRoute(createdRoute)

          scope.$apply();
        }
      }
      scope.refreshList = function() {
        LoadingSpinner.watchPromise(RoutesService.getRoutes()
        .then((routes) => {
          scope.availableRoutes = routes;
        }))
      }

      scope.$watchGroup(['selectedRouteId', 'availableRoutes'], () => {
        if (scope.selectedRouteId) {
          scope.selectRoute(scope.availableRoutes.find(r => r.id == scope.selectedRouteId))
        }
      })

      scope.refreshList();
    },
  }

}
