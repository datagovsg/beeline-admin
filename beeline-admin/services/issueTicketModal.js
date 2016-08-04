const issueTicketTemplate = require('../templates/issueTicket.html');
import _ from 'lodash';

export default function ($rootScope, $uibModal) {
  this.open = function (options) {
    var modalScope = $rootScope.$new();

    _.assign(modalScope, _.pick(options, [
      'boardStopId', 'alightStopId', 'routeId'
    ]))
    modalScope.users = [
      options.user || {id: options.userId}
    ]

    var modalOptions = {
      controller: IssueTicketController,
      template: issueTicketTemplate,
      scope: modalScope,
      windowClass: 'full-width',
    };

    console.log(options);

    var modal = $uibModal.open(modalOptions);
    modal.result.then(() => {
      modalScope.$destroy();
    }, () => {
      modalScope.$destroy();
    })
  }
}

function IssueTicketController($scope, AdminService, commonModals, LoadingSpinner) {
  $scope.issue = async function () {
    if (!await commonModals.confirm("Are you sure you want to issue these tickets?")) {
      return;
    }

    var issueRequest = {
      trips: _.flatten($scope.users.map(user => /* for each user */
        $scope.trips.map(tr => /* for each trip */
          _.assign(
            _.pick(tr, ['boardStopId', 'alightStopId', 'tripId']),
            {userId: user.id}
          )
        )
      )),
      description: $scope.reason
    }
    console.log(issueRequest);

    LoadingSpinner.watchPromise(AdminService.beeline({
      method: 'POST',
      url: '/transactions/issueFreeTicket',
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
}
