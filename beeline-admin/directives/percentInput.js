
angular.module('beeline-admin')
.directive('percentInput', function () {
  return {
    template: `
<span class="input-group">
  <input type="number" ng-change="updateModel()" ng-model="localModel"
    placeholder="{{placeholder}}"
    class="form-control"
    ng-class="ngClass"
    ng-style="ngStyle"
  >
  <span class="input-group-addon">%</span>
</span>
    `,
    scope: {
      ngModel: '=',
      placeholder: '@',
      ngClass: '<',
      ngStyle: '<',
      /* and any other attributes you may need */
    },
    controller($scope) {
      $scope.$watch('ngModel', model => $scope.localModel = model * 100)

      $scope.updateModel = function () {
        $scope.ngModel = parseFloat($scope.localModel) / 100
      }
    }
  }
})
