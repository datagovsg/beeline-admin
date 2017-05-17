const _ = require('lodash');
const titleCase = require('title-case')

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
        {
          type: 'limitByCompany',
          default: {companyId: null}
        },
        {
          type: 'limitByRoute',
          default: {routeIds: []}
        },
        {
          type: 'limitByRouteTags'
        },
        {
          type: 'limitByTripDate',
          default: {startDate: null, endDate: null}
        },
        {
          type: 'limitByTripDayOfWeek',
          default: {0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false}
        },
        {
          type: 'limitByPurchaseDate',
          default: {startDate: null, endDate: null}
        },
        {
          type: 'limitByContactList',
          default: {contactListId: null}
        },
      ];
      $scope.criterionTypes.forEach(ct => {
        ct.description = titleCase(ct.type)
      })

      // Create a parameter buffer for each type
      $scope.params = _($scope.criterionTypes)
        .keyBy(x => x.type)
        .mapValues(x => (x.default || {}))
        .value();
      $scope.disp = _($scope.criterionTypes)
        .keyBy(x => x.type)
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
          if ($scope.params.limitByTripDate) {
            $scope.params.limitByTripDate.$$startDate = $scope.params.limitByTripDate.startDate
              && new Date($scope.params.limitByTripDate.startDate)
            $scope.params.limitByTripDate.$$endDate = $scope.params.limitByTripDate.endDate
              && new Date($scope.params.limitByTripDate.endDate)
          }
          if ($scope.params.limitByPurchaseDate) {
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

        $scope.$digest()
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
