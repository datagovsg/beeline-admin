import querystring from 'querystring'

export default function($scope, $http, AdminService, LoadingSpinner) {
  $scope.transactions = [];
  $scope.currentPage = 1;
  $scope.perPage = 20;
  $scope.pageCount=1;

  function query() {
    var queryPromise = AdminService.beeline({
      method: 'GET',
      url: `/transactions?` + querystring.stringify({
        page: $scope.currentPage || 1,
        perPage: $scope.perPage,
      }),
    })
    .then((result) => {
      $scope.transactions = result.data.transactions;
      $scope.pageCount = result.data.pageCount;


      for (let transaction of $scope.transactions) {
        for (let ti of transaction.transactionItems) {
          if (ti.itemType.startsWith('ticket') &&
              ti[ti.itemType]) {
                try {
                  ti[ti.itemType].user.json = JSON.parse(ti[ti.itemType].user.name);
                }
                catch (err) {}
              }
        }
      }
    })
    .catch((err) => {
      console.error(err.stack);
    });

    LoadingSpinner.watchPromise(queryPromise)
  }

  query();

  $scope.$watchGroup(['currentPage', 'perPage'], query)
}
