const _ = require('lodash');

angular.module('beeline-admin')
.directive('promoCriterionEditor', function (RoutesService) {
  const routesPromise = RoutesService.getCurrentRoutes();

  return {
    template: require('./criterionEditor.html'),
    scope: {
      ngModel: '='
    },
    controller($scope) {
      $scope.criterionTypes = [
        'limitByCompany',
        'limitByRoute',
        'limitByRouteTags',
        'limitByTripDate',
        'limitByPurchaseDate',
      ];
      // Create a parameter buffer for each type
      $scope.params = _($scope.criterionTypes)
        .keyBy(x => x)
        .mapValues(x => ({}))
        .value();
      $scope.disp = _($scope.criterionTypes)
        .keyBy(x => x)
        .mapValues(x => ({}))
        .value();

      // Shallow watch the ngModel
      $scope.$watch('ngModel', crit => {
        $scope.editCriterion = crit;
        $scope.currentCrit = crit;
        if (crit.type && crit.params) {
          $scope.params[crit.type] = crit.params

          ///////////////// Rendering
          if ($scope.params.limitByRouteTags.tags) {
            $scope.params.limitByRouteTags.$$tags = $scope.params.limitByRouteTags.tags
              .map((t, k) => ({id: k, name: t}))
          }
          if ($scope.params.limitByTripDate.tags) {
            $scope.params.limitByTripDate.$$startDate = $scope.params.limitByTripDate.startDate
              && new Date($scope.params.limitByTripDate.startDate)
            $scope.params.limitByTripDate.$$endDate = $scope.params.limitByTripDate.endDate
              && new Date($scope.params.limitByTripDate.endDate)
          }
          if ($scope.params.limitByPurchaseDate.tags) {
            $scope.params.limitByPurchaseDate.$$startDate = $scope.params.limitByPurchaseDate.startDate
              && new Date($scope.params.limitByPurchaseDate.startDate)
            $scope.params.limitByPurchaseDate.$$endDate = $scope.params.limitByPurchaseDate.endDate
              && new Date($scope.params.limitByPurchaseDate.endDate)
          }
        }
      })

      routesPromise.then(routes => {
        $scope.disp.routes = routes.map(r => ({
          ...r,
          _description: `${r.label}: ${r.name} from ${r.from} to ${r.to}`
        }))
      })

      // Switch the buffer
      $scope.$watch('editCriterion.type', t => {
        if (t) {
          $scope.editCriterion.params = $scope.params[t];
        } else {
          $scope.editCriterion.params = null;
        }
      });

      ///////////////// Rendering
      // Match the tags
      $scope.$watch(() => $scope.params.limitByRouteTags.$$tags, tags => {
        if (tags) {
          $scope.params.limitByRouteTags.tags = tags.map(t => t.name)
        }
      }, true)

      function watchDates(watch) {
        $scope.$watch(watch, dt => {
          if (dt) {
            _.set($scope, watch.replace('$$', ''), dt.toISOString())
          } else {
            _.set($scope, watch.replace('$$', ''), null)
          }
        })
      }
      watchDates('params.limitByPurchaseDate.$$startDate')
      watchDates('params.limitByPurchaseDate.$$endDate')
      watchDates('params.limitByTripDate.$$startDate')
      watchDates('params.limitByTripDate.$$endDate')
    }
  }
})
