
export default function(RoutesService) {
  return {
    template: `
<select
    ng-options="stop.id as stop.description for stop in stops | orderBy:stop.name"
    >
</select>
    `,
    replace: true,
    scope: true,
    link(scope, elem, attr) {
      scope.stops = [];

      RoutesService.getStops()

      scope.$watch(() => RoutesService.stopsPromise, () => {
        RoutesService.stopsPromise.then((stops) => {
          scope.stops = stops
        })
      })
    },
  }
}
