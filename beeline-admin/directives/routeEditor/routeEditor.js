import _ from 'lodash';
import assert from 'assert';

export default function (AdminService, RoutesService, $rootScope, commonModals, $state) {
  return {
    template: require('./routeEditor.html'),
    scope: {
      route: '=',
      tab: '=',
    },
    link(scope, elem, attr) {
      scope.adminService = AdminService;
      scope.disp = {
        routeTags: [],
        signage: null
      }
      scope.form ={
        routeEditorForm : {}
      };

      scope.resetRoute = function() {
        if (scope.route && scope.route.id) {
          RoutesService.getRoute(scope.route.id)
          .then((response) => {
            scope.route = response.data;
          })
        }
        else {
          scope.route = {}
        }
      }

      scope.saveRoute = function() {
        if (!scope.route)
          return;

        // Process the route tags and all other processed data
        // here
        let routeDataToSave = _.defaults({
          tags: scope.disp.routeTags.map(t => t.name)
        }, scope.route);

        RoutesService.saveRoute(routeDataToSave)
        .then((route) => {
          scope.route = route;
        })
      }

      scope.deleteRoute = async function() {
        if (scope.route && scope.route.id &&
          await commonModals.confirm(`Are you sure you want to delete Route ${scope.route.label}?`)) {
          RoutesService.deleteRoute(scope.route.id)
          .then(() => {
            scope.route = null
          })
          $state.go('routes')
        }
      }

      scope.$watch('route', () => {
        if (!(scope.route && scope.route.id)) return;

        RoutesService.getRoute(scope.route.id, {
          includeFeatures: true,
          includeTrips: true,
          limit: 1,
        })
        .then((route) => {
          scope.tripStops = route.trips[0].tripStops;
          scope.disp.routeTags = scope.route.tags && scope.route.tags.map(t => ({name: t}));
          // quick hack to convert arrays to polyline string
          if (google.maps.geometry && scope.route.path instanceof Array) {
            scope.route.path = google.maps.geometry.encoding.encodePath(
              scope.route.path.map(latlng => new google.maps.LatLng(latlng.lat, latlng.lng)))
          } else {
            scope.route.path = route.path;
          }
          scope.$broadcast('mapLoaded');
        })
      })
      scope.$watch('route.to', (destination)=>{
        if (!destination) return;
        scope.disp.signage = "To "+destination;
        if (scope.form.routeEditorForm.signage.$pristine) {
          scope.route.notes = scope.route.notes || {};
          scope.route.notes.signage = scope.disp.signage;
        }
      })
    },
  }

}
