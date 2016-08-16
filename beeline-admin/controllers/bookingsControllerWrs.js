import querystring from 'querystring'
import assert from 'assert';

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
  )
  var endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
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
  //
  // $scope.showRefundModal = function() {
  //   var ticketsById = _.keyBy($scope.tickets, t => t.id)
  //   var ticketsToCancel = Object.keys($scope.selectedTickets)
  //     .filter(ticketId => $scope.selectedTickets[ticketId])
  //     .map(ticketId => ticketsById[ticketId])
  //
  //   BookingRefund.open({
  //     cancelledTickets: ticketsToCancel,
  //   })
  // }

  $scope.sendWrsEmail = function (ticket) {
    var transactionId = _.get(ticket, 'ticketSale.transactionId') ||
      _.get(ticket, 'ticketExpense.transactionId')

    LoadingSpinner.watchPromise(AdminService.beeline({
      method: 'POST',
      url: `/custom/wrs/email/${transactionId}`
    }))
    .then(() => {
      return commonModals.alert("Email sent to your Beeline Admin Login Email ID. Please check your inbox");
    })
    .then(null, () => {
      return commonModals.alert("Email sending failed");
    });
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

        return commonModals.alert( parseFloat(payment.credit).toFixed(2) + " refunded.")
      })
      .then(null, (response) => {
        console.log(response);
        return commonModals.alert("Failed...")
      })
    }
  }
  $scope.issueTickets = function () {
    var selectedTicketIds = _($scope.selectedTickets)
      .keys()
      .filter(key => $scope.selectedTickets[key])
      .value();
    var selectedTickets = selectedTicketIds.map(tid =>
      $scope.tickets.find(t => t.id.toString() === tid))
    var firstTicket = selectedTickets.length > 0 ? selectedTickets[0] : null;
    var issueTicketModalOptions = {};

    assert(selectedTickets.length === 0 || firstTicket);

    issueTicketModalOptions.users = _(selectedTickets)
      .filter()
      .map(t => t.user)
      .uniqBy('id')
      .value()

    if (firstTicket) {
      Object.assign(issueTicketModalOptions, {
        routeId: firstTicket.boardStop.trip.routeId,
        boardStopStopId: firstTicket.boardStop.stopId,
        alightStopStopId: firstTicket.alightStop.stopId,
        cancelledTicketIds: selectedTicketIds
      })
    }

    issueTicketModal.open(issueTicketModalOptions);
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

  $scope.$watchCollection('selectedTickets', (tickets) => {
    $scope.disp.selectedTicketsCount = _.filter(tickets).length
  }, true);

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
