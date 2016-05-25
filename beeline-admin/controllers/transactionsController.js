import querystring from 'querystring'

export default function($scope, $http, AdminService) {
  $scope.transactions = [];
  $scope.currentPage = 1;
  $scope.perPage = 20;
  $scope.pageCount=1;

  function query() {
    AdminService.beeline({
      method: 'GET',
      url: `/transactions?` + querystring.stringify({
        page: $scope.currentPage || 1,
        perPage: $scope.perPage,
      }),
    })
    .then((result) => {
      console.log(result)
      $scope.transactions = result.data.transactions;
      $scope.pageCount = result.data.pageCount;
    })
    .catch((err) => {
      console.error(err.stack);

    });
  }

  query();

  $scope.$watchGroup(['currentPage', 'perPage'], query)
}
