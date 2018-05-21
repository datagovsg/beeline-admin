angular.module('beeline-admin')
.controller('routeTimelinessController',
['$scope', 'companyId', function($scope, companyId) {
  $scope.pageProps = { companyId }
}])
