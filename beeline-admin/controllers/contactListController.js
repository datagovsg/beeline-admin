angular.module('beeline-admin')
.controller('contactListController', function($scope, $stateParams) {
  $scope.pageProps = {
    companyId: parseInt($stateParams.companyId),
    contactListId: parseInt($stateParams.contactListId),
  }
});
