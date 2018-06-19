import querystring from 'querystring';
import _ from 'lodash';

angular.module('beeline-admin')
  .controller(
    'genericVuePageController',
    function($scope, $stateParams) {
      $scope.pageProps = {
        companyId: parseInt($stateParams.companyId),
      }
    }
  )
