import _ from 'lodash';
import leftPad from 'left-pad';

function formatTime(tm) {
  if (!tm) return '';

  var time = (tm.hours || 0) * 60 + (tm.minutes || 0) + 8*60;
  var hours = Math.floor(time / 60);
  var minutes = Math.floor(time % 60);

  return `${leftPad(hours)}:${leftPad(minutes, 2, '0')}`
}

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

      scope.data = {}

      // The event definitions strictly don't allow unknown fields
      // Strictly separate the settings for each event type, don't allow
      // one event's unknown fields to mess with that of another
      if (scope.type) scope.data[scope.type] = scope.ngModel;
      scope.$watch('type', (type) => {
        if (!type) return;

        scope.ngModel = scope.data[type] = scope.data[type] || {}
      })

      scope.disp.noPingTimeOptions = [
        [5, '5 minutes before trip'],
        [15, '15 minutes before trip'],
        [25, '25 minutes before trip'],
      ]

      scope.disp.urgentBookingTimeOptions = [
        [60000 * 5, '5 minutes before trip'],
        [60000 * 10, '10 minutes before trip'],
        [60000 * 15, '15 minutes before trip'],
        [60000 * 30, '30 minutes before trip'],
      ]

      scope.disp.lateArrivalTimeOptions = [
        [60000 * 5, 'more than 5 mins late'],
        [60000 * 10, 'more than 10 mins late'],
        [60000 * 15, 'more than 15 mins late'],
      ]

      scope.disp.lateETATimeOptions = [
        [60000 * 10, 'more than 10 mins late'],
      ]

      scope.$watch(() => AdminService.getCompanyId(), (cid) => {
        RoutesService.getCurrentRoutes()
        .then((routes) => {
          scope.routes = _.sortBy(routes.filter(r => r.transportCompanyId == cid), 'label')
          scope.routes.forEach((route) => {
            route._description  = scope.renderRoute(route);
          })
          scope.$apply();
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

      scope.renderRoute = (route) =>
        `${route.label}: ${route.from} to ${route.to} (${formatTime(route.indicativeTrip && (route.indicativeTrip.nextStartTime || route.indicativeTrip.lastStartTime))})`
    }
  }
}
