angular.module('beeline-admin')
  .controller(
    'driversController',
    function($scope, $stateParams) {
      $scope.pageProps = {
        companyId: parseInt($stateParams.companyId),
      };
    }
  );
