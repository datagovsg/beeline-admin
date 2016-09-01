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

      scope.options.setTransportCompanyIds = _.get(scope, 'ngModel.transportCompanyIds', false) && true
      scope.options.setRouteIds = _.get(scope, 'ngModel.routeIds', false) && true

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
