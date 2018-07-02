const issueTicketTemplate = require('../templates/issueTicket.html');
import leftPad from 'left-pad';

const IssueTicketcontroller = [
  '$scope', 'AdminService', 'LoadingSpinner', 'commonModals',
  function ($scope, AdminService, LoadingSpinner, commonModals) {
  // Display functions
  // Get routes
  function formatTime(tm) {
    var dt = new Date(tm)
    return dt.getHours() + ':' + leftPad(dt.getMinutes(), 2, '0');
  }
  $scope.f = {
    displayRoute: (route) => `${route.label}: ${route.from} -- ${route.to}`,
    displayStop: ts => `${formatTime(ts.time)}: ${ts.stop.description}`
  }
  $scope.disp = {
    datepicker: {
      highlightDays: [],
      daysAllowed: []
    }
  };

  $scope.issue = async function () {
    if (!await commonModals.confirm("Are you sure you want to issue these tickets?")) {
      return;
    }

    const oldTransactionIds = $scope.data.cancelledTickets &&
        _($scope.data.cancelledTickets)
          .map(tkt => (tkt.ticketSale && tkt.ticketSale.transactionId) ||
              (tkt.ticketExpense && tkt.ticketExpense.transactionId) || false
          )
          .filter(tid => tid !== false)
          .uniq()
          .value();
    const cancelledTicketIds = $scope.data.cancelledTickets &&
        $scope.data.cancelledTickets.map(ticket => ticket.id)

    const oldTransactionDescription = oldTransactionIds && oldTransactionIds.length ?
        `(Original Txn #${oldTransactionIds.join(', #')})` : '';
    const oldTicketDescription = cancelledTicketIds && cancelledTicketIds.length ?
        `(Replacing tickets #${cancelledTicketIds.join(', #')})` : '';
    const description = $scope.data.reason || '';

    var issueRequest = {
      trips: _.flatten($scope.data.users.map(user => /* for each user */
        $scope.purchaseOrder.map(po => /* for each trip */
          _.assign(
            _.pick(po, ['boardStopId', 'alightStopId', 'tripId']),
            {userId: user.id}
          )
        )
      )),
      cancelledTicketIds,
      description: description + ' ' + oldTransactionDescription + ' ' + oldTicketDescription
    }

    LoadingSpinner.watchPromise(AdminService.beeline({
      method: 'POST',
      url: '/transactions/tickets/issue_free',
      data: issueRequest,
    })
    .then(() => {
      $scope.$close();
      return commonModals.alert('Tickets created!');
    }))
    .catch((err) => {
      return commonModals.alert({
        title: 'Error',
        message: err.data
      });
    })
  }
  // Event handler
  $scope.removeTrip = function(date) {
    var offset = new Date().getTimezoneOffset() * 60000;
    var matchingIndex = $scope.data.selectedDates.findIndex(dt =>
      dt.valueOf() === date.valueOf() + offset)

    $scope.data.selectedDates.splice(matchingIndex, 1);
  }

  // Check for conflicts
  var passengersCache = new PassengersCache();
  $scope.$watchCollection('disp.selectedTrips', (selectedTrips) => {
    if (!selectedTrips) return;
    // TODO: Get the passenger list for these trips, and ensure that
    // the users selected have not chosen them before.
    passengersCache.getPassengersByTripId(selectedTrips.map(t => t.id))
    .then((passengersByTripId) => {
      $scope.passengersByTripId = passengersByTripId;
    });
  })

  $scope.$watchCollection(
    () => [$scope.passengersByTripId].concat(_.map($scope.data.users || [], u => u.id)),
    () => {
      if (!$scope.data.users || !$scope.passengersByTripId) {
        return;
      }
      var conflicts = $scope.data.users.map(user => // For each user
        $scope.purchaseOrder.filter(po => // Find the trips that...
          $scope.passengersByTripId[po.tripId] && // already contain a ticket for this user
          $scope.passengersByTripId[po.tripId].find(ticket => ticket.userId === user.id)));

      $scope.conflictsByUid = _(_.zip(conflicts, $scope.data.users))
        .filter(([conflict, user]) => conflict && conflict.length !== 0)
        .keyBy(([conflict, user]) => user.id)
        .mapValues(([conflict, user]) => conflict)
        .value();
    }, true)

  $scope.$watch('disp.selectedTrips', (trips) => {
    $scope.disp.tripsById = _.keyBy(trips, t => t.id);
  })
  //
  // PassengersCache class
  //
  function PassengersCache() {
    this.requests = {};
  }
  PassengersCache.prototype.getPassengersByTripId = async function (tripIds) {
    if (!tripIds || !tripIds.length) return {};
    var passengerLists = new Array(tripIds.length);

    _.forEach(tripIds, (tripId, index) => {
      this.requests[tripId] = this.requests[tripId] || AdminService.beeline({
        method: 'GET',
        url: `/trips/${tripId}/passengers`,
      })

      this.requests[tripId].then((response) => {
        passengerLists[index] = response.data
      })
    })

    await Promise.all(tripIds.map(tid => this.requests[tid]));

    return _(_.zip(tripIds, passengerLists))
      .keyBy(([tid, passengers]) => tid)
      .mapValues(([tid, passengers]) => passengers)
      .value();
  }
}]

export default ['$rootScope', '$uibModal', function ($rootScope, $uibModal) {
  this.open = function (options) {
    var modalScope = $rootScope.$new();

    modalScope.data = {
      routeId: options.routeId,
      boardStopId: options.boardStopStopId,
      alightStopId: options.alightStopStopId,
      cancelledTickets: options.cancelledTickets,
      users: options.users,
    };

    var modalOptions = {
      controller: IssueTicketController,
      template: issueTicketTemplate,
      scope: modalScope,
      windowClass: 'full-width',
      backdrop: 'static',
      keyboard: false,
    };

    var modal = $uibModal.open(modalOptions);
    modal.result.then(() => {
      modalScope.$destroy();
    }, () => {
      modalScope.$destroy();
    })
    return modal.result;
  }
}]
