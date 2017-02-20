
const env = require('../env.json')
const _ = require('lodash');

export default function($scope, $state, $urlRouter, AdminService, store,
  LoadingSpinner, commonModals, companyId) {
  $scope.company = {};
  $scope.AdminService = AdminService;


  if (companyId) {
    AdminService.beeline({
      method: 'GET',
      url: `/companies/${companyId}`,
    })
    .then((response) => {
      $scope.company = response.data;
    })
    $scope.companyLogoUrl = `${env.BACKEND_URL}/companies/${companyId}/logo`
  }

  $scope.$watch(() => store.get('sessionToken'), sessionToken => {
    $scope.sessionToken = sessionToken;
  });

  $scope.updateCompanyInfo = function () {
    var updatePromise = AdminService.beeline({
      method: 'PUT',
      url: `/companies/${$scope.company.id}`,
      data: _.pick($scope.company, ['terms', 'features', 'email', 'contactNo',
        'smsOpCode'])
    })
    .then((response) => {
      $scope.company = response.data;
    })
    LoadingSpinner.watchPromise(updatePromise)
    .catch((err) => {
      commonModals.alert(_.get(err, 'data.message'))
    });
  }

  $scope.stripeConnect = function() {
    // Get the redirect URL from server
    AdminService.beeline({
      method: 'POST',
      url: `/companies/${companyId}/stripeConnect`,
      data: {
        redirect: window.location.href
      }
    })
    .then((response) => {
      window.location.href = response.data;
    })
    .catch((err) => {
      commonModals.alert(_.get(err, 'data.message'))
    })
  }

}
