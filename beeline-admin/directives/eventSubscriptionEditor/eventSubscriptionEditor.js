import _ from 'lodash';

export default function ($rootScope, $location, uiGmapGoogleMapApi, $q,
  RoutesService, AdminService) {
  return {
    template: require('./eventSubscriptionEditor.html'),
    scope: {
      type: '<',
      ngModel: '=',
      ngRequired: '<'
    },
    link (scope, elem, attr) {
      scope.options = {};
      scope.disp = {};

      scope.disp.timeOptions = [
        [60000 * 5, '5 minutes before trip'],
        [60000 * 15, '15 minutes before trip'],
        [60000 * 25, '25 minutes before trip'],
        [60000 * 30, '30 minutes before trip'],
      ]


      scope.$watch(() => AdminService.getCompanyId(), (cid) => {
        RoutesService.getCurrentRoutes()
        .then((routes) => {
          scope.routes = _.sortBy(routes.filter(r => r.transportCompanyId == cid), 'label')
        })
      });

      scope.options.setTransportCompanyIds = _.get(scope, 'ngModel.transportCompanyIds', false) && true
      scope.options.setRouteIds = _.get(scope, 'ngModel.routeIds', false) && true
      scope.$watch('options.setTransportCompanyIds', (isSet) => {
        if (!isSet) {
          _.set(scope, 'ngModel.transportCompanyIds', undefined);
        }
      });
      scope.$watch('options.setRouteIds', (isSet) => {
        if (!isSet) {
          _.set(scope, 'ngModel.routeIds', undefined);
        }
      });
      scope.$watch(() => AdminService.getCompanyId(), (cid) => {
        _.set(scope, 'ngModel.transportCompanyIds', [cid]);
      })
    }
  }
}
