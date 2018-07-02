import _ from 'lodash';
const bookingRefundTemplate = require('./bookingRefund.html');

const BookingRefundcontroller = ['$scope', 'LoadingSpinner', 'RoutesService', 'AdminService',
  function ($scope, LoadingSpinner, RoutesService, AdminService) {
  var lastId = 1;

  // The selected ticket in the issue list
  $scope.disp = {};
  $scope.disp.selectedCancelled = []
  $scope.disp.selectedIssued = []
  $scope.disp.selectedTicket = {};
  $scope.availableUsers = [];

  $scope.removeFromIssued = function() {
    var ticket = $scope.disp.selectedIssued;
    var index = $scope.issuedTickets.indexOf(ticket)
    if (index == -1) {
      return;
    }
    $scope.issuedTickets.splice(index, 1)
    $scope.disp.selectedIssued = null;
  }

  $scope.editIssued = function() {
    var ticket = $scope.selectedIssued;
    $scope.disp.selectedTicket = ticket;
    $scope.disp.selectedIssued = null;
  }

  $scope.$watchGroup(['disp.selectedTicket.trip', 'disp.selectedTicket.boardStopId',
    'disp.selectedTicket.alightStopId', 'disp.selectedTicket.userId'], () => {
    if ($scope.disp.selectedTicket.id) {
      var renderTicket = $scope.disp.selectedTicket;
      var promise = RoutesService.getTrip(renderTicket.tripId)
      .then((trip) => {
        console.log(JSON.stringify(trip, null, 2))
        console.log(JSON.stringify(renderTicket, null, 2))
        renderTicket.trip = trip;
        renderTicket.boardStop = trip.tripStops.find(ts => ts.id == renderTicket.boardStopId)
        renderTicket.alightStop = trip.tripStops.find(ts => ts.id == renderTicket.alightStopId)
        renderTicket.user = $scope.availableUsers.find(u => u.id == renderTicket.userId)
      })
    }
  })
  $scope.updateTicket = function(ticket) {
    if (ticket.id) {
      // it's been immediately updated -- since they are the same
      // object!
    }
    else {
      var renderTicket = {
        id: lastId++,
      };
      $scope.issuedTickets.push(_.assign(renderTicket, ticket));
      console.log(JSON.stringify(ticket, null, 2))

      var promise = RoutesService.getTrip(renderTicket.tripId)
      .then((trip) => {
        renderTicket.trip = trip;
        renderTicket.boardStop = trip.tripStops.find(ts => ts.id == renderTicket.boardStopId)
        renderTicket.alightStop = trip.tripStops.find(ts => ts.id == renderTicket.alightStopId)
        renderTicket.user = $scope.availableUsers.find(u => u.id == renderTicket.userId)
      })

      LoadingSpinner.watchPromise(promise)
    }
  }

  // watch the list of available users
  $scope.$watch($scope.cancelledTickets, () => {
    $scope.availableUsers = $scope.cancelledTickets.map(
      ticket => ticket.user
    )
    $scope.availableUsers = _.uniqBy($scope.availableUsers, u => u.id)
    $scope.availableUsersById = _.keyBy($scope.availableUsers, u => u.id)
  })
}]

export default ['$uibModal', '$rootScope', function ($uibModal, $rootScope) {
  this.open = function (options) {
    var modalScope = $rootScope.$new();
    modalScope.cancelledTickets = options.cancelledTickets || [];
    modalScope.issuedTickets = options.issuedTickets || [];
    modalScope.selectedTicket = options.selectedTicket || {};

    var modalOptions = {
      controller: BookingRefundController,
      template: bookingRefundTemplate,
      scope: modalScope,
      windowClass: 'full-width',
    };

    $uibModal.open(modalOptions);
  }
}]

