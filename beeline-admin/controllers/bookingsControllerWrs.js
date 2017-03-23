import querystring from 'querystring'
import assert from 'assert';
const pickOneModalTemplate = require('../templates/modals/pickOne.html')

export default function($scope, AdminService, RoutesService, LoadingSpinner, TagsService,
  $state, $stateParams, issueTicketModal, issueRouteCreditsModal, commonModals, $uibModal) {
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
    routeId: false,
    status: {
      valid: true,
      refunded: true,
      void: true,
      failed: false,
      bidded: true,
      pending: false,
    },
    startDate: startOfMonth,
    endDate: endOfMonth,
    userQuery: null,
    transactionId: null,
    chargeId: null,
    paymentId: null,
    ticketId: null
  }

  $scope.disp = {
    availableRoutes: [],
    month: now,
    datesBetween: [],
    counts: {},
    dates: [],
    pagination: {firstRow: 1, lastRow: 1, totalRows: 1},
    isLoading: 0,
  }

  $scope.selectedTickets = {};

  // URL handling
  $scope.$watch(() => $stateParams.id, () => {
    $scope.filter.routeId = parseInt($stateParams.routeId);
    $scope.filter.tripId = parseInt($stateParams.tripId);
    $scope.filter.userQuery = parseInt($stateParams.userId);
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

  $scope.refundPayment = async function (ticket) {
    const originalPrice = ticket.boardStop.trip.priceF
    const discount = ticket.notes.discountValue || 0

    if (await commonModals.confirm("Confirm refund?")) {
      LoadingSpinner.watchPromise(
        AdminService.beeline({
          method: 'POST',
          url: '/transactions/refund/payment',
          data: {
            ticketId: ticket.id,
            targetAmt: originalPrice - discount,
          }
        })
      ).then((response) => {
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

  // // Unused -- for replacing multiple tickets
  $scope.issueTickets = function () {
    var selectedTickets = $scope.selectedTickets.$selectedObjects();
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
        cancelledTickets: selectedTickets
      })
    }

    issueTicketModal.open(issueTicketModalOptions).then(query);
  }

  $scope.issueRouteCredits = async function (ticket) {
    issueRouteCreditsModal.open(ticket)
    .then(async (data)=>{
      if(!data) return
      let numPassesToRefund = data.numPasses

      try {
        if(data.refundTicket){
          await LoadingSpinner.watchPromise(
            AdminService.beeline({
              method: 'POST',
              url: '/transactions/refund/routePass',
              data: {
                ticketId: data.ticket.id,
                targetAmt: data.price,
                creditTag: data.tag
              }
            })
          )

          numPassesToRefund--
        }

        if(numPassesToRefund > 0){
          await LoadingSpinner.watchPromise(AdminService.beeline({
            method: 'POST',
            url: '/transactions/issueFreeRoutePass',
            data: {
              userId: data.user.id,
              amount: numPassesToRefund * data.price,
              routeId: data.route.id,
              tag: data.tag,
              description: data.description,
            }
          }))
        }

        return commonModals.alert(`Credits issued!`);

      } catch (err) {
        return commonModals.alert({
          title: 'Failed',
          message: `${err.data.statusCode} 
            ${err.data.error}: ${err.data.message}`
        })
      }

    })
    .then(query)
  }

  // Edit ticket button
  $scope.editTicket = function (ticket) {
    var selectedTicketIds = [ticket.id];
    var selectedTickets = [ticket];
    var issueTicketModalOptions = {
      users: [ticket.user],
      routeId: ticket.boardStop.trip.routeId,
      boardStopStopId: ticket.boardStop.stopId,
      alightStopStopId: ticket.alightStop.stopId,
      cancelledTickets: selectedTickets
    };
    issueTicketModal.open(issueTicketModalOptions).then(query);
  }
  // Add ticket button -- don't cancel earlier ticket
  $scope.addTicket = function (ticket) {
    var selectedTicketIds = [ticket.id];
    var selectedTickets = [ticket];
    var issueTicketModalOptions = {
      users: [ticket.user],
      routeId: ticket.boardStop.trip.routeId,
      boardStopStopId: ticket.boardStop.stopId,
      alightStopStopId: ticket.alightStop.stopId,
    };
    issueTicketModal.open(issueTicketModalOptions).then(query);
  }

  function buildQuery(override) {
    // update the request and CSV url
    // tripStartDate & tripEndDate should be converted to
    // UTC midnight of the intended dates
    var queryOptions = {
      page: $scope.currentPage || 1,
      perPage: $scope.perPage,

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

    if ($scope.filter.tripId || $scope.filter.paymentId ||
        $scope.filter.chargeId || $scope.filter.ticketId) {
      delete queryOptions.tripStartDate;
      delete queryOptions.tripEndDate;
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
    if ($scope.filter.transactionId) {
      queryOptions.transactionId = $scope.filter.transactionId;
    }
    if ($scope.filter.chargeId) {
      queryOptions.chargeId = $scope.filter.chargeId
    }
    if ($scope.filter.paymentId) {
      queryOptions.paymentId = $scope.filter.paymentId
    }
    if ($scope.filter.ticketId) {
      queryOptions.ticketId = $scope.filter.ticketId
    }

    if (AdminService.getCompanyId()) {
      queryOptions.transportCompanyId = AdminService.getCompanyId();
    }

    _.assign(queryOptions, override);

    var requestUrl = `/custom/wrs/report?` + querystring.stringify(queryOptions)

    return requestUrl;
  }

  $scope.monthChanged = function (newMonth) {
    startOfMonth = newMonth.clone().startOf('month').toDate()
    endOfMonth = newMonth.clone().startOf('month').add(1, 'month').add(-1, 'day').toDate()
    $scope.filter.startDate = startOfMonth;
    $scope.filter.endDate = endOfMonth;
  }

  function query(newV, oldV) {
    var requestUrl = buildQuery();
    $scope.csvUrl = buildQuery({format: 'csv'})

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

    // Update the annotations for the month
    var requestUrlOR = buildQuery({
      tripStartDate: Date.UTC(
        startOfMonth.getFullYear(),
        startOfMonth.getMonth(),
        startOfMonth.getDate()
      ),
      tripEndDate: Date.UTC(
        endOfMonth.getFullYear(),
        endOfMonth.getMonth(),
        endOfMonth.getDate() + 1
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

    $scope.disp.isLoading++;
    queryPromise
    queryPromise.finally(() => $scope.disp.isLoading--);
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
    [_.defaults({
        startDate: $scope.filter.startDate.getTime(),
        endDate: $scope.filter.endDate.getTime(),
      }, $scope.filter),
      $scope.currentPage,
      $scope.perPage],
    _.debounce(query, 1000, {leading: false, trailing: true}), true)
}
