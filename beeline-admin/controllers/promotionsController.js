const _ = require('lodash');

angular.module('beeline-admin')
.controller('promotionsController',
['$scope', '$state', 'companyId', function($scope, $state, companyId) {
    $scope.promoCodes = null;
    $scope.promoTypes = ['Promotion'];

    $scope.pageProps = {
      id: $state.params.promoId,
      companyId
    }
}]);
