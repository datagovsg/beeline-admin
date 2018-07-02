import querystring from 'querystring';
import _ from 'lodash';

angular.module('beeline-admin')
  .controller(
    'genericVuePageController',
    ['$scope', '$stateParams', function($scope, $stateParams) {
      $scope.pageProps = {
        companyId: parseInt($stateParams.companyId),
      }
    }]
  )
