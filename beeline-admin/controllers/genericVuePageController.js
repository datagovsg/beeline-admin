import querystring from 'querystring';
import _ from 'lodash';

angular.module('beeline-admin')
  .controller(
    'genericVuePageController',
    function($scope, $state, $stateParams) {
      $scope.pageProps = {
        ...$stateParams
      }
      $scope.page = $state.current.data.page
    }
  )
