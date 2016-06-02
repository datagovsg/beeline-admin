import querystring from 'querystring'

export default function($scope, AdminService, RoutesService, LoadingSpinner) {
  $scope.tickets = [];
  $scope.currentPage = 1;

  $scope.perPage = 20;
  $scope.pageCount = 1;

  $scope.filter = {
    showPartial: false,
    orderBy: 'transaction-date',
    orderDirection: true,
    routeId: false,
    statuses: [],
    date: new Date(),
  }

  $scope.disp = {
    availableRoutes: []
  }

  function query() {
    var startOfMonth = new Date(
      $scope.filter.date.getFullYear(),
      $scope.filter.date.getMonth(),
      1
    )
    var endOfMonth = new Date(
      $scope.filter.date.getFullYear(),
      $scope.filter.date.getMonth() + 1,
      1
    )

    var queryOptions =
      {
        page: $scope.currentPage || 1,
        perPage: $scope.perPage,

        partial: $scope.filter.showPartial,
        order: JSON.stringify($scope.filter.orderBy ?
            [$scope.filter.orderBy + ($scope.filter.orderDirection ? ',1' : ',-1')]
            : []),
        startDate: startOfMonth.getTime(),
        endDate: endOfMonth.getTime(),
      }
    if ($scope.filter.routeId) {
      queryOptions.routeIds = JSON.stringify([$scope.filter.routeId])
    }
    if ($scope.filter.statuses.length) {
      queryOptions.statuses = JSON.stringify($scope.filter.statuses)
    }
    var queryPromise = AdminService.beeline({
      method: 'GET',
      url: `/custom/wrs/report?` + querystring.stringify(queryOptions),
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
    });


    LoadingSpinner.watchPromise(queryPromise)
  }

  function queryRoutes() {
    var startOfMonth = new Date(
      $scope.filter.date.getFullYear(),
      $scope.filter.date.getMonth(),
      1
    )
    var endOfMonth = new Date(
      $scope.filter.date.getFullYear(),
      $scope.filter.date.getMonth() + 1,
      1
    )

    RoutesService.getRoutes({
      startDate: startOfMonth.getTime(),
      endDate: endOfMonth.getTime(),
      includeTrips: true,
      includeAvailability: false,
    }).then((routes) => {
      console.log(routes)
      $scope.disp.availableRoutes = routes
    })
  }

  $scope.$watchGroup(['currentPage', 'perPage'], query)
  $scope.$watch('filter', query, true)
  $scope.$watch('filter.date', queryRoutes, true)
}
