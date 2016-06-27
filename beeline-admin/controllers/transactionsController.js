import querystring from 'querystring'

export default function($scope, $state, $stateParams, $http, AdminService, LoadingSpinner) {
  $scope.transactions = [];

  $scope.filter = {
    currentPage: 1,
    perPage: 100,
    pageCount: 1,

    orderBy: 'createdAt',
    order: 'desc',

    itemTypes: {
      ticketSale: true,
      ticketRefund: true,
      ticketExpense: true,
      payment: true,
      transfer: true,
      refundPayment: true,
      account: true,
    },
    startDate: new Date(),
    endDate: new Date(),

    userQuery: null,
    transactionId: null,
    ticketId: null,
  };
  $scope.disp = {
    month: new Date()
  }
  $scope.filter.startDate.setDate(1)
  $scope.filter.endDate.setDate(1)
  $scope.filter.endDate.setMonth($scope.filter.endDate.getMonth() + 1)
  $scope.filter.endDate.setDate(0)

  // URL handling
  $scope.$watch(() => $stateParams.id, () => {
    $scope.filter.transactionId = $stateParams.id;
    $scope.filter.ticketId = $stateParams.ticketId;
  })
  var myState = $state.current.name;
  $scope.$watchGroup(['filter.transactionId', 'filter.ticketId'], () => {
    var params = {}

    if ($scope.filter.transactionId)
      params.id = $scope.filter.transactionId;

    if ($scope.filter.ticketId)
      params.ticketId = $scope.filter.ticketId;

    $state.go(myState, params, {notify: false, reload: false})
  })

  function buildQuery() {
    var queryOpts = {};

    queryOpts.order = $scope.filter.order;
    queryOpts.orderBy = $scope.filter.orderBy;
    queryOpts.perPage = $scope.filter.perPage;
    queryOpts.page = $scope.filter.currentPage;
    queryOpts.itemTypes = JSON.stringify(Object.keys($scope.filter.itemTypes)
        .filter(k => $scope.filter.itemTypes[k]))
    if ($scope.filter.transactionId) {
      queryOpts.transactionId = $scope.filter.transactionId;
    }
    else if ($scope.filter.ticketId) {
      queryOpts.ticketId = $scope.filter.ticketId;
    }
    else {
      if ($scope.filter.userQuery) {
        queryOpts.userQuery = $scope.filter.userQuery;
      }

      queryOpts.startDate = new Date(
        $scope.filter.startDate.getFullYear(),
        $scope.filter.startDate.getMonth(),
        $scope.filter.startDate.getDate()
      ).getTime();

      queryOpts.endDate = new Date(
        $scope.filter.endDate.getFullYear(),
        $scope.filter.endDate.getMonth(),
        $scope.filter.endDate.getDate() + 1
      ).getTime();
    }

    return '/transactionItems?' + querystring.stringify(queryOpts);
  }

  function query() {
    var queryPromise = AdminService.beeline({
      method: 'GET',
      url: buildQuery(),
    })
    .then((result) => {

      $scope.filter.pageCount = result.data.pageCount;
      $scope.transactionItems = result.data.rows;

      for (let ti of result.data.rows) {
        if (ti.itemType.startsWith('ticket') &&
            ti[ti.itemType]) {
              try {
                ti[ti.itemType].user.json = JSON.parse(ti[ti.itemType].user.name);
              }
              catch (err) {}
            }
      }
    })
    .catch((err) => {
      console.error(err.stack);
    });

    LoadingSpinner.watchPromise(queryPromise)
  }

  $scope.$watch('filter', query, true)
}
