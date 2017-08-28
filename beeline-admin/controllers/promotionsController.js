const _ = require('lodash');

angular.module('beeline-admin')
.controller('promotionsController',
['$scope', 'companyId', function($scope, companyId) {
    $scope.promoCodes = null;
    $scope.promoTypes = ['Promotion'];

    $scope.pageProps = {
      id: $state.params.promoId,
      companyId
    }
}]);
