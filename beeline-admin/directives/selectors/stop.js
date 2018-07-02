
export default ['RoutesService', function(RoutesService) {
  return {
    template: `
<ui-select ng-model="data.stop" on-select="updateModel()">
  <ui-select-match placeholder="Select a bus stop...">
    {{$select.selected.description}}
  </ui-select-match>
  <ui-select-choices repeat="stop in stops"
    refresh="updateSearch($select.search)"
    refresh-delay="150">
    <div>{{stop.description}}</div>
  </ui-select-choices>
</ui-select>
    `,
    scope: {
      ngModel: '=',
    },
    link(scope, elem, attr) {
      var allStops = [];

      scope.stops = [];
      scope.data = {
        stop: {
          id: scope.ngModel,
          description: 'Loading...'
        }
      };

      RoutesService.getStops()

      ////////////////////////////////////////////
      // Methods
      scope.updateModel = function() {
        console.log(scope.ngModel, scope.data.stop)
        console.log(scope.ngModel, scope.data.stop.id)
        scope.ngModel = scope.data.stop.id;
      }

      scope.updateSearch = function (search) {
        RoutesService.stopsPromise.then((allStops) => {
          scope.stops = allStops.filter(s =>
            s.description.toUpperCase().indexOf(search.toUpperCase()) !== -1)
            .slice(0, 20)
        });
      }

      // Load the data
      scope.$watch(() => RoutesService.stopsById, () => {
        if (scope.data.stop) {
          scope.data.stop = RoutesService.stopsById[scope.data.stop.id]
        }
      })
    },
  }
}]
