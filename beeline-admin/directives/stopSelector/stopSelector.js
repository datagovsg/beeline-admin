
export default function(RoutesService) {
  return {
    template: `
<select
    ng-model="selectedStop"
    ng-options="stop.description for stop in stops | orderBy:stop.name track by stop.id"
    >
</select>
    `,
    scope: {
      ngModel: '=',
    },
    link(scope, elem, attr) {
      scope.stops = [
      ];
      scope.selectedStop = null;

      // Some bug in ngSelect??
      scope.$watchGroup(['ngModel', 'stops'], () => {
        scope.selectedStop = scope.stops.find(x => x.id == scope.ngModel)
      })
      scope.$watch('selectedStop', () => {
        if (scope.selectedStop) {
          scope.ngModel = scope.selectedStop.id;
        }
        else {
        }
      })

      RoutesService.getStops()

      scope.$watch(() => RoutesService.stopsPromise, () => {
        RoutesService.stopsPromise.then((stops) => {
          scope.stops = stops
        })
      })
    },
  }
}
