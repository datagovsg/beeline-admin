import querystring from 'querystring';

export default function($scope, $state, $urlRouter, AdminService, LoadingSpinner,
  RoutePopup) {

  $scope.selectedRoute = null;

  $scope.params = _.assign({}, $state.params);
  var myState = $state.current.name;

  $scope.data = [];
  $scope.filter = {
    perPage: 20,
    page: 1,
  };

  function refreshRoutes() {
    if (!$scope.filter.transportCompanyId) return;
    
    var promise = AdminService.beeline({
      method: 'GET',
      url: '/routes/report?' + querystring.stringify($scope.filter)
    })
    .then((response) => {
      $scope.data = response.data;
    })
    .then(null, (error) => {
      console.log(error)
    })

    LoadingSpinner.watchPromise(promise);
  }

  $scope.viewRoute = function (routeId) {
    RoutePopup.show({routeId});
  }

  $scope.$watch('filter', refreshRoutes, true)
  $scope.$watch(() => AdminService.getCompanyId(), (companyId) => {
    if (companyId)
      $scope.filter.transportCompanyId = companyId
  });
}
