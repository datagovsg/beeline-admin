
export default function($scope, $state, $urlRouter, AdminService) {
  $scope.selectedRoute = null;

  $scope.params = _.assign({}, $state.params);
  var myState = $state.current.name;

  // Update the hash when we go to different views
  // But don't allow page to reload
  $scope.$watch('params', () => {
    console.log(JSON.stringify($scope.params));
    $state.go(myState, $scope.params, {notify: false, reload: false})
  }, true)
}
