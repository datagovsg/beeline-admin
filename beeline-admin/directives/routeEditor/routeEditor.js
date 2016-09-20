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
        RoutesService.saveRoute(scope.route)
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
        scope.route && scope.route.id &&
        RoutesService.getRoute(scope.route.id, {includeIndicative: true, includeFeatures: true})
        .then((route) => {
          scope.tripStops = route.indicativeTrip && route.indicativeTrip.tripStops
          scope.disp.routeTags = scope.route.tags && scope.route.tags.map(t => ({name: t}));
          // quick hack to convert arrays to polyline string
          if (google.maps.geometry && scope.route.path instanceof Array) {
            scope.route.path = google.maps.geometry.encoding.encodePath(
              scope.route.path.map(latlng => new google.maps.LatLng(latlng.lat, latlng.lng)))
          }
          scope.$broadcast('mapLoaded');
        })
      })
      scope.$watchCollection('disp.routeTags', (rawTags) => {
        if (!scope.route) return;
        scope.route.tags = rawTags ? rawTags.map(t => t.name) : [];
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
