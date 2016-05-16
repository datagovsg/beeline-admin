export default function(AdminService, RoutesService) {
  return {
    template: require('./routeEditor.html'),
    scope: {
      route: '=',
      edit: '=?',
    },
    link(scope, elem, attr) {
      scope.edit = scope.edit || 'route'

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

      scope.deleteRoute = function() {
        if (scope.route && scope.route.id &&
          confirm(`Are you sure you want to delete Route ${scope.route.label}?`)) {
          RoutesService.deleteRoute(scope.route.id)
          .then(() => {
            scope.route = null
          })
        }
      }
    },
  }

}
