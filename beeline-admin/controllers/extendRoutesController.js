import querystring from 'querystring';

angular.module('beeline-admin')
.controller('extendRoutesController',
function($scope, $state, $urlRouter, AdminService, LoadingSpinner,
  RoutePopup, commonModals, RoutesService, $rootScope, $uibModal, TripsService,
  companyId) {

  $scope.pageProps = {
    companyId
  }
})
