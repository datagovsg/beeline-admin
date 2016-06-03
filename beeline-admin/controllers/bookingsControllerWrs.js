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
    orderBy: 'createdAt',
    order: 'desc',
    routeId: false,
    status: {
      valid: true,
      refunded: true,
      failed: false,
    },
    startDate: startOfMonth,
    endDate: endOfMonth,
    userQuery: null,
  }

  $scope.disp = {
    availableRoutes: [],
    month: now,
    datesBetween: [],
    counts: {},
  }

  $scope.selectedTickets = {};

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

  $scope.downloadCsv = function() {
    AdminService.beeline({
      method: 'POST',
      url: '/makeDownloadLink',
      data: {
        uri: $scope.csvUrl
      }
    })
    .then((result) => {
      window.location.href = AdminService.serverUrl() + '/downloadLink?token=' + result.data.token;
    })
  }

  function buildQuery(override) {
    // update the request and CSV url
    var queryOptions = {
      page: $scope.currentPage || 1,
      perPage: $scope.perPage,

      order: $scope.filter.order,
      orderBy: $scope.filter.orderBy,
      tripStartDate: $scope.filter.startDate.getTime(),
      tripEndDate: $scope.filter.endDate.getTime() + 24*60*60*1000,
      statuses: JSON.stringify(Object.keys($scope.filter.status)
        .filter(key => $scope.filter.status[key]))
    }
    if ($scope.filter.routeId) {
      queryOptions.routeId = $scope.filter.routeId
    }
    if ($scope.filter.userQuery) {
      queryOptions.userQuery = $scope.filter.userQuery
    }
    if ($scope.filter.stopQuery) {
      queryOptions.stopQuery = $scope.filter.stopQuery
    }

    _.assign(queryOptions, override);

    var requestUrl = `/custom/wrs/report?` + querystring.stringify(queryOptions)

    return requestUrl;
  }

  function query() {
    var requestUrl = buildQuery();
    $scope.csvUrl = buildQuery({
                      page: 1,
                      perPage: 10000000, // it's a happy problem
                      format: 'csv',
                    })

    var queryPromise = AdminService.beeline({
      method: 'GET',
      url: requestUrl,
    })
    .then((result) => {
      $scope.tickets = result.data.rows;
      $scope.pageCount = Math.ceil(result.data.count / result.data.perPage);

      $scope.disp.counts = result.data.countByDate;
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

  function updateDatesBetween() {
    var start = Date.UTC(
      $scope.filter.startDate.getFullYear(),
      $scope.filter.startDate.getMonth(),
      $scope.filter.startDate.getDate()
    );
    var end = Date.UTC(
      $scope.filter.endDate.getFullYear(),
      $scope.filter.endDate.getMonth(),
      $scope.filter.endDate.getDate()
    );

    $scope.disp.datesBetween = _.range(start, end + 24*3600*1000, 24*3600*1000)
  }

  $scope.$watchGroup(['currentPage', 'perPage'], query)
  $scope.$watchGroup(['filter.startDate', 'filter.endDate'], queryRoutes)
  $scope.$watchGroup(['filter.startDate', 'filter.endDate'], updateDatesBetween)
  $scope.$watch('filter', query, true)
}
