
export default function($scope, $state, $urlRouter, AdminService, RoutesService) {
  var myState = $state.current.name;

  //
  if ($state.params.routeId) {
    RoutesService.getRoute($state.params.routeId)
    .then((route) => $scope.selectedRoute = route);
  }
  else {
    $scope.selectedRoute = {};
  }

  $scope.action = $state.params.action;

  // Update the hash when tabs/routes are selected
  // But don't allow page to reload
  $scope.$watchGroup(['action', 'selectedRoute.id'], ([action, routeId]) => {
    $state.go(myState, {
      action: action,
      routeId: routeId
    }, {notify: false, reload: false})
  })
}
