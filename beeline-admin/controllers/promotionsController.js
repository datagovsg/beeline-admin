const _ = require('lodash');

angular.module('beeline-admin')
.controller('promotionsController', function($scope, $state, $stateParams,
  $urlRouter, AdminService, store, LoadingSpinner, commonModals, companyId) {
    $scope.promoCodes = null;
    $scope.promoTypes = ['Promotion'];

    $scope.pageProps = {
      id: $state.params.promoId,
      companyId
    }
});
