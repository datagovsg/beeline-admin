import querystring from 'querystring';

export default function($scope, $state, $urlRouter, AdminService, LoadingSpinner) {
  $scope.selectedRoute = null;

  $scope.params = _.assign({}, $state.params);
  var myState = $state.current.name;

  $scope.data = [];
  $scope.filter = {
    perPage: 20,
    page: 1,
  };

  function refreshRoutes() {
    var promise = AdminService.beeline({
      method: 'GET',
      url: '/routes/report?' + querystring.stringify($scope.filter)
    })
    .then((response) => {
      $scope.data = response.data;
    })

    LoadingSpinner.watchPromise(promise);
  }

  $scope.$watch('filter', refreshRoutes, true)
}
