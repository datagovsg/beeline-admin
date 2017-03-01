const issueRoutePassTemplate = require('../templates/issueRoutePassModal.html');
import leftPad from 'left-pad';

export default function ($rootScope, $uibModal) {
  this.open = function (options) {
    var modalScope = $rootScope.$new();
    modalScope.data = options;
    modalScope.data.numPasses = 1;
    modalScope.data.creditAmt = modalScope.data.numPasses * modalScope.data.price

    var modalOptions = {
      controller: IssueRoutePassController,
      template: issueRoutePassTemplate,
      scope: modalScope,
      // windowClass: 'full-width',
      backdrop: 'static',
      keyboard: false,
    };

    var modal = $uibModal.open(modalOptions);
  }
}

function IssueRoutePassController($scope, AdminService, LoadingSpinner, commonModals) {
  $scope.$watch('data.numPasses', () => {
    $scope.data.creditAmt = $scope.data.numPasses * $scope.data.price 
  })

  $scope.issue = async function () {
    if (!await commonModals.confirm("Are you sure you want to issue these passes?")) {
      return;
    }

    var issueRequest = {
      userId: $scope.data.user.id,
      amount: $scope.data.creditAmt,
      routeId: $scope.data.route.id,
      tag: $scope.data.tag,
      description: $scope.data.description,
    }

    LoadingSpinner.watchPromise(AdminService.beeline({
      method: 'POST',
      url: '/transactions/issueFreeRoutePass',
      data: issueRequest,
    })
    .then(() => {
      $scope.$close();
      return commonModals.alert('Passes Issued!');
    }))
    .catch((err) => {
      return commonModals.alert({
        title: 'Error',
        message: err.data
      });
    })
  }

}
