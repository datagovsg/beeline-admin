import _ from 'lodash';

angular.module('beeline-admin')
.directive('routeSelect2', function (RoutesService) {
  let allRoutes = [];

  RoutesService.getRoutes().then((routes) => {
    allRoutes = routes
  })

  return {
    restrict: 'E',
    scope: {
      'ngModel': '=',
      'transportCompanyIds': '<',
      'transportCompanyId': '<',
    },
    template: `
      <ui-select ng-model="disp.ngModel">
        <ui-select-match placeholder="Search for a route">
          <span ng-if="$select.selected && $select.selected.id">
            {{$select.selected.label}}:
            {{$select.selected.name}}
          </span>
        </ui-select-match>
        <ui-select-choices repeat="route.id as route in disp.filteredRoutes track by route.id"
           refresh="filterBy($select.search)"
           refresh-delay="300">
          <span ng-if="route.id">
            {{route.label}}:
            {{route.name}}:
          </span>
          <span ng-if="!route.id">
            None
          </span>
        </ui-select-choices>
        <ui-select-no-choice>
          No results found
        </ui-select-no-choice>
      </ui-select>
    `,
    controller($scope) {
      $scope.disp = {
        filteredRoutes: [{id: false, name: '---'}],
        ngModel: $scope.ngModel
      };
      $scope.filter = {
        search: null
      }

      $scope.filterBy = function (search) {
        let filteredRoutes = _(allRoutes)
            .filter(r => !$scope.transportCompanyId || r.transportCompanyId === $scope.transportCompanyId)
            .filter(r => !$scope.transportCompanyIds || $scope.transportCompanyIds.indexOf(r.transportCompanyId) !== -1);

        if (search) {
            filteredRoutes = filteredRoutes.filter(r =>
              r.label.toUpperCase().indexOf(search.toUpperCase()) !== -1 ||
              r.from.toUpperCase().indexOf(search.toUpperCase()) !== -1 ||
              r.to.toUpperCase().indexOf(search.toUpperCase()) !== -1
            )
        }

        filteredRoutes = filteredRoutes
            .sortBy('label')
            .value()

        $scope.disp.filteredRoutes = [{id: false, name: '---'}].concat(filteredRoutes)
      }

      // OMG this is just bad
      $scope.$watch('disp.ngModel', (v) => {
        $scope.ngModel = v
      })
      $scope.$watch('ngModel', (v) => {
        $scope.disp.ngModel = v
      })

      $scope.$watch(() => allRoutes, (routes) => {
        $scope.filterBy('')
      })
    }
  }
})
