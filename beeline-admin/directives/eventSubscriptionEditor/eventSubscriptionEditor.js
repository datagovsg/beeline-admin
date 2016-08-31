export default function ($rootScope, $location, uiGmapGoogleMapApi, $q,
  RoutesService) {
  return {
    template: require('./eventSubscriptionEditor.html'),
    scope: {
      type: '<',
      ngModel: '=',
      ngRequired: '<'
    },
    link (scope, elem, attr) {
      scope.options = {};
      
      RoutesService.getCurrentRoutes()
      .then((routes) => {
        scope.routes = routes
      })

      scope.$watch('options.setTransportCompanyIds', (isSet) => {
        if (!isSet) {
          _.set(scope, 'ngModel.transportCompanyIds', undefined);
        }
      });
      scope.$watch('options.setRouteIds', (isSet) => {
        console.log(isSet, scope);

        if (!isSet) {
          _.set(scope, 'ngModel.routeIds', undefined);
        }
      });
    }
  }
}
