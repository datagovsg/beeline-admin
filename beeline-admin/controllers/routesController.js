import querystring from 'querystring';

export default function($scope, $state, $urlRouter, AdminService, LoadingSpinner,
  RoutePopup, commonModals, RoutesService, $rootScope, $uibModal, TripsService,
  companyId) {

  $scope.pageProps = {
    companyId,
  }
}
