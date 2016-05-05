

export default function() {
  return {
    template: require('./pathEditor.html'),
    scope: {
      path: '=',
    },
    link(scope, elem, attr) {
      scope.events = {
        click(map, eventName, args) {
          scope.$apply(() => {``
            if (scope.addToWhere == 'end') {
              scope.path = scope.path || []
              scope.path.push({
                lat: args[0].latLng.lat(),
                lng: args[0].latLng.lng(),
              })
            }
            else if (scope.addToWhere == 'start') {
              scope.path = scope.path || []
              scope.path.splice(0,0,{
                lat: args[0].latLng.lat(),
                lng: args[0].latLng.lng(),
              })
            }
          })
        },
      };
      scope.addToWhere = 'end'

      // For display purposes
      scope.pathX = []
      scope.$watch('path', () => {
        if (!scope.path) {
          scope.pathX = [];
          return;
        }
        scope.pathX = scope.path.map((latlng) => ({
          latitude: latlng.lat,
          longitude: latlng.lng,
        }))
      }, true)
    }
  }
}
