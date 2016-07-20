const issueTicketTemplate = require('../templates/issueTicket.html');
import _ from 'lodash';

export default function ($rootScope, $uibModal) {
  this.open = function (options) {
    var modalScope = $rootScope.$new();

    _.assign(modalScope, _.pick(options, [
      'userId', 'user', 'boardStopId', 'alightStopId', 'routeId'
    ]))

    var modalOptions = {
      controller: IssueTicketController,
      template: issueTicketTemplate,
      scope: modalScope,
      windowClass: 'full-width',
    };

    console.log(options);

    $uibModal.open(modalOptions);
  }
}

function IssueTicketController($scope, AdminService) {
  $scope.issue = function () {
    if (!confirm("Are you sure you want to issue these tickets?")) {
      return;
    }

    var issueRequest = {
      trips: $scope.trips.map(tr =>
        _.assign(
          _.pick(tr, ['boardStopId', 'alightStopId', 'tripId']),
          {userId: $scope.userId}
        )
      ),
      description: $scope.reason
    }
    console.log(issueRequest);

    AdminService.beeline({
      method: 'POST',
      url: '/transactions/issueFreeTicket',
      data: issueRequest,
    })
    .then(() => {
      alert('Tickets created!');
      $scope.$close();
    })
    .catch((err) => {
      alert('Error: ' + err.data);
    })
  }
}
