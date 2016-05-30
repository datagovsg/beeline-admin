import querystring from 'querystring'

export default function($scope, AdminService, RoutesService, LoadingSpinner) {
  $scope.tickets = [];
  $scope.currentPage = 1;

  $scope.perPage = 20;
  $scope.pageCount = 1;

  var now = new Date();
  var startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  )
  var endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1
  )

  $scope.filter = {
    showPartial: false,
    filterBy: 'transaction.createdAt',
    order: 'desc',
    routeId: false,
    status: {
      valid: true,
      refunded: true,
      failed: false,
    },
    startDate: startOfMonth,
    endDate: endOfMonth,
  }

  $scope.disp = {
    availableRoutes: [],
    month: now,
  }

  $scope.$watch('disp.month', () => {
    $scope.filter.startDate = new Date(
      $scope.disp.month.getFullYear(),
      $scope.disp.month.getMonth(),
      1
    )
    $scope.filter.endDate = new Date(
      $scope.disp.month.getFullYear(),
      $scope.disp.month.getMonth() + 1,
      0
    )
  })

  function query() {
    // update the request and CSV url
    var queryOptions = {
      page: $scope.currentPage || 1,
      perPage: $scope.perPage,

      order: $scope.filter.order,
      filterBy: $scope.filter.filterBy,
      startDate: $scope.filter.startDate.getTime(),
      endDate: $scope.filter.endDate.getTime() + 24*60*60*1000,
      statuses: JSON.stringify(Object.keys($scope.filter.status)
        .filter(key => $scope.filter.status[key]))
    }
    var requestUrl = `/custom/wrs/report?` + querystring.stringify(queryOptions)
    $scope.csvUrl = AdminService.serverUrl()
      + `/custom/wrs/report?`
      + querystring.stringify(_.assign(queryOptions, {
        page: 1,
        perPage: 10000000, // it's a happy problem
        format: 'csv',
      }))

    if ($scope.filter.routeId) {
      queryOptions.routeId = $scope.filter.routeId
    }
    var queryPromise = AdminService.beeline({
      method: 'GET',
      url: requestUrl,
    })
    .then((result) => {
      $scope.tickets = result.data.rows;
      $scope.pageCount = Math.ceil(result.data.count / result.data.perPage);

      for (let ticket of $scope.tickets) {
        try {
          ticket.user.json = JSON.parse(ticket.user.name)
        }
        catch (err) {
        }
      }
    })
    .catch((err) => {
      console.error(err.stack);
      console.log(err)
    });


    LoadingSpinner.watchPromise(queryPromise)
  }

  function queryRoutes() {
    RoutesService.getRoutes({
      startDate: $scope.filter.startDate.getTime(),
      endDate: $scope.filter.endDate.getTime() + 24*60*60*1000,
      includeTrips: true,
      includeAvailability: false,
    }).then((routes) => {
      console.log(routes)
      $scope.disp.availableRoutes = routes
    })
  }

  $scope.$watchGroup(['currentPage', 'perPage'], query)
  $scope.$watchGroup(['filter.startDate', 'filter.endDate'], queryRoutes)
  $scope.$watch('filter', query, true)
}
