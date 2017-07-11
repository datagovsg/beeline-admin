
export default function($scope, $state, $urlRouter, AdminService, RoutesService,
    companyId) {
      
  $scope.pageProps = {
    companyId,
    routeId: $state.params.routeId,
    tab: $state.params.action,
  }
}
