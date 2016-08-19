import querystring from 'querystring'

export default function($scope, AdminService, RoutesService, LoadingSpinner,
  $state, $stateParams, issueTicketModal, commonModals) {
  $scope.tickets = [];
  $scope.currentPage = 1;

  $scope.perPage = 50;
  $scope.pageCount = 1;

  var now = new Date();
  var startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );
  var endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  );

  $scope.filter = {
    showPartial: false,
    orderBy: 'createdAt',
    order: 'desc',
    routeId: false,
    status: {
      valid: true,
      refunded: true,
      void: true,
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
    pagination: {firstRow: 1, lastRow: 1, totalRows: 1}
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

  $scope.sendWrsEmail = function (ticketId) {
    AdminService.beeline({
      method: 'POST',
      url: `/custom/wrs/email/${ticketId}`
    })
    .then(() => {
      return commonModals.alert("Email sent to your Beeline Admin Login Email ID. Please check your inbox");
    })
    .then(null, () => {
      return commonModals.alert("Email sending failed");
    })
  }

  $scope.refund = async function (ticket) {
    if (await commonModals.confirm("Confirm refund?")) {
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

        query()
        return commonModals.alert( parseFloat(payment.credit).toFixed(2) + " refunded.")
      })
      .catch(err => {
        console.log(err);
        return commonModals.alert("Failed...")
      })
    }
  }
  $scope.replace = function (ticket) {
    issueTicketModal.open({
      user: ticket.user,
      userId: ticket.userId,
      routeId: ticket.boardStop.trip.routeId,
      boardStopId: ticket.boardStop.stopId,
      alightStopId: ticket.alightStop.stopId,
    }).then(query)
  }

  function buildQuery(override) {
    // update the request and CSV url
    // tripStartDate & tripEndDate should be converted to
    // UTC midnight of the intended dates
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
        $scope.filter.endDate.getDate() + 1
      ),
      statuses: JSON.stringify(Object.keys($scope.filter.status)
        .filter(key => $scope.filter.status[key]))
    }

    if ($scope.filter.routeId) {
      queryOptions.routeId = $scope.filter.routeId
    }
    if ($scope.filter.tripId) {
      queryOptions.tripId = $scope.filter.tripId
      delete queryOptions.tripStartDate;
      delete queryOptions.tripEndDate;
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

  $scope.monthChanged = function (newMonth) {
    startOfMonth = newMonth.clone().startOf('month').toDate()
    endOfMonth = newMonth.clone().endOf('month').startOf('day').toDate()
    $scope.filter.startDate = startOfMonth;
    $scope.filter.endDate = endOfMonth;
  }

  function query(newV, oldV) {
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
      $scope.disp.pagination.firstRow = ($scope.currentPage - 1) * result.data.perPage + 1;
      $scope.disp.pagination.lastRow = Math.min($scope.currentPage * result.data.perPage, result.data.count)
      $scope.disp.pagination.totalRows = result.data.count
      $scope.pageCount = Math.ceil(result.data.count / result.data.perPage);

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

    var requestUrlOR = buildQuery({
      tripStartDate: Date.UTC(
        startOfMonth.getFullYear(),
        startOfMonth.getMonth(),
        startOfMonth.getDate()
      ),
      tripEndDate: Date.UTC(
        endOfMonth.getFullYear(),
        endOfMonth.getMonth(),
        endOfMonth.getDate()
      )
    });

    AdminService.beeline({
      method: 'GET',
      url: requestUrlOR,
    })
    .then((result) => {
      $scope.disp.counts = result.data.countByDate;
    })
    .catch((err) => {
      console.error(err.stack);
      console.log(err)
    });

    LoadingSpinner.watchPromise(queryPromise)
  }

  function queryRoutes(newV, oldV) {
    RoutesService.getRoutes({
      startDate: $scope.filter.startDate.getTime(),
      endDate: $scope.filter.endDate.getTime() + 24*60*60*1000,
      includeTrips: false,
      includeAvailability: false,
    }).then((routes) => {
      $scope.disp.availableRoutes = routes
    })
  }

  $scope.$watch('disp.counts', (counts) => {
    $scope.disp.highlightDays = _.keys(counts).map((date) => {
      return {
        date: parseInt(date),
        annotation: counts[date],
        selectable: true,
      }
    })
  })

  $scope.$watch(() => [
      $scope.filter.startDate.getTime(),
      $scope.filter.endDate.getTime()],
    queryRoutes, true)
  $scope.$watch(() =>
    [_.assign({}, $scope.filter, {
        startDate: $scope.filter.startDate.getTime(),
        endDate: $scope.filter.endDate.getTime(),
      }),
      $scope.currentPage,
      $scope.perPage],
    query, true)
}
