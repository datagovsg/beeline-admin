import assert from 'assert';
import querystring from 'querystring';


angular.module('beeline-admin')
.controller(
'routePassesController',
function($scope, $stateParams) {
  $scope.pageProps = {
    companyId: $stateParams.companyId,
    userId: $stateParams.userId,
  };
});
