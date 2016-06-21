
const env = require('../env.json')

export default function($scope, $state, $urlRouter, AdminService, store,
  LoadingSpinner) {
  $scope.company = {};

  $scope.$watch(() => AdminService.getCompanyId(), () => {
    var companyId = AdminService.getCompanyId();

    if (!companyId) return;

    AdminService.beeline({
      method: 'GET',
      url: `/companies/${companyId}`,
    })
    .then((response) => {
      $scope.company = response.data;
    })

    $scope.companyLogoUrl = `${env.BACKEND_URL}/companies/${companyId}/logo`
  })

  $scope.$watch(() => store.get('sessionToken'), sessionToken => {
    $scope.sessionToken = sessionToken;
  });

  $scope.updateCompanyInfo = function () {
    var updatePromise = AdminService.beeline({
      method: 'PUT',
      url: `/companies/${$scope.company.id}`,
      data: _.pick($scope.company, ['terms', 'features', 'email', 'contactNo'])
    })
    .then((response) => {
      $scope.company = response.data;
    })
    LoadingSpinner.watchPromise(updatePromise);
  }

}
