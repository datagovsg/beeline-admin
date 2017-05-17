const _ = require('lodash');
const titleCase = require('title-case')

angular.module('beeline-admin')
.directive('promoDiscountEditor', function (RoutesService) {
  const routesPromise = RoutesService.getCurrentRoutes();

  return {
    template: require('./discountEditor.html'),
    scope: {
      ngModel: '='
    },
    controller($scope) {
      $scope.discountTypes = [
        {type: 'simpleRate'},
        {type: 'simpleFixed'},
        {type: 'flatPrice'},
        {type: 'tieredRateByQty'},
      ];
      $scope.discountTypes.forEach(dt => {
        dt.description = titleCase(dt.type)
      })

      // Create a parameter buffer for each type
      $scope.params = _($scope.discountTypes)
        .keyBy(x => x.type)
        .mapValues(x => ({}))
        .value();
      $scope.disp = _($scope.discountTypes)
        .keyBy(x => x.type)
        .mapValues(x => ({}))
        .value();

      // Shallow watch the ngModel
      $scope.$watch('ngModel', crit => {
        if (crit) {
          $scope.editDiscount = crit;
          if (crit.type && crit.params) {
            $scope.params[crit.type] = crit.params
          }
        } else {
          $scope.editDiscount = $scope.ngModel = {}
        }
      })

      // Switch the buffer
      $scope.$watch('editDiscount.type', t => {
        if (t) {
          $scope.editDiscount.params = $scope.params[t];
        } else {
          $scope.editDiscount.params = null;
        }
      });

      $scope.addTier = function (obj) {
        $scope.params[$scope.editDiscount.type][obj] =
          $scope.params[$scope.editDiscount.type][obj] || []

        $scope.params[$scope.editDiscount.type][obj].push([undefined, undefined])
      }
    }
  }
})
