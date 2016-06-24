import querystring from 'querystring'

export default function($scope, AdminService, RoutesService, LoadingSpinner,
BookingRefund, $state, $stateParams) {
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
    dates: [],
  }

  $scope.selectedTickets = {};

  // URL handling
  $scope.$watch(() => $stateParams.id, () => {
    $scope.filter.routeId = parseInt($stateParams.routeId);
    $scope.filter.tripId = parseInt($stateParams.tripId);
  })
  var myState = $state.current.name;
  $scope.$watchGroup(['filter.routeId', 'filter.tripId'], () => {
    var params = {}

    if ($scope.filter.routeId)
      params.routeId = $scope.filter.routeId;

    if ($scope.filter.tripId)
      params.tripId = $scope.filter.tripId;

    $state.go(myState, params, {notify: false, reload: false})
  })

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

  $scope.showRefundModal = function() {
    var ticketsById = _.keyBy($scope.tickets, t => t.id)
    var ticketsToCancel = Object.keys($scope.selectedTickets)
      .filter(ticketId => $scope.selectedTickets[ticketId])
      .map(ticketId => ticketsById[ticketId])

    BookingRefund.open({
      cancelledTickets: ticketsToCancel,
    })
  }

  $scope.sendWrsEmail = function (ticketId) {
    AdminService.beeline({
      method: 'POST',
      url: `/custom/wrs/email/${ticketId}`
    })
    .then(() => {
      alert("Email sent. Please check your inbox");
    })
    .then(null, () => {
      alert("Email sending failed");
    })
  }

  $scope.refund = function (ticket) {
    if (confirm("Confirm refund?")) {
      AdminService.beeline({
        method: 'POST',
        url: '/transactions/refund',
        data: {
          ticketId: ticket.id,
          // dryRun: true,
        }
      })
      .then((response) => {
        var txn = response.data;
        var payment = txn.transactionItems.find(ts => ts.itemType == 'refundPayment' && ts.refundPayment)

        console.log(txn)

        alert( parseFloat(payment.credit).toFixed(2) + " refunded.")
      })
      .then(null, (response) => {
        console.log(response);
        alert("Failed...")
      })
    }
  }

  function buildQuery(override) {
    // update the request and CSV url
    var queryOptions = {
      page: $scope.currentPage || 1,
      perPage: $scope.perPage,

      order: $scope.filter.order,
      orderBy: $scope.filter.orderBy,
      tripStartDate: Date.UTC(
        $scope.filter.startDate.getFullYear(),
        $scope.filter.startDate.getMonth(),
        $scope.filter.startDate.getDate()
      ),
      tripEndDate: Date.UTC(
        $scope.filter.endDate.getFullYear(),
        $scope.filter.endDate.getMonth(),
        $scope.filter.endDate.getDate()
      ) + 24*60*60*1000,
      statuses: JSON.stringify(Object.keys($scope.filter.status)
        .filter(key => $scope.filter.status[key]))
    }
    if ($scope.filter.routeId) {
      queryOptions.routeId = $scope.filter.routeId
    }
    if ($scope.filter.tripId) {
      queryOptions.tripId = $scope.filter.tripId
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

      $scope.selectedTickets = {};
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

  $scope.$watch('disp.dates', (dates) => {
    if (dates.length == 0)
      return;

    if (dates.length == 1) {
      return;
    }

    if (dates.length == 2) {
      $scope.filter.startDate = dates[0].toDate();
      $scope.filter.endDate = dates[1].toDate();
      return;
    }

    if (dates.length > 2) {
      $scope.disp.dates = [dates[2]];
      return;
    }
  }, true)

  $scope.$watch('disp.counts', (counts) => {
    $scope.disp.highlightDays = _.keys(counts).map((date) => {
      return {
        date: parseInt(date),
        annotation: counts[date],
        selectable: true,
      }
    })
  })

  $scope.$watchGroup(['currentPage', 'perPage'], query)
  $scope.$watchGroup(['filter.startDate', 'filter.endDate'], queryRoutes)
  $scope.$watchGroup(['filter.startDate', 'filter.endDate'], updateDatesBetween)
  $scope.$watch('filter', query, true)
}
