import assert from 'assert';

export default function($scope, AdminService, RoutesService, LoadingSpinner,
  $state, $stateParams, issueTicketModal, commonModals, $uibModal) {

  $scope.user = null
  $scope.selector = { userId: null }
  $scope.routeCredits = null
  $scope.adminService = AdminService

  $scope.$watch('selector.userId', userId => {
    LoadingSpinner.watchPromise(
      AdminService.beeline({
        method: 'GET',
        url: `/user/${userId}`
      })
    ).then(resp => {
      $scope.user = resp.data;
    }).catch(err => {
      console.log(err)
      // popup of error, then redirect back to main page
    })
  })

  $scope.selector.userId = $stateParams.userId 
  $scope.companyId = $stateParams.companyId

  $scope.getUserPin = async function (){
    const userId = $scope.user.id
    let pinPromise = AdminService.beeline({
      method: 'GET',
      url: `/user/${userId}/telephoneCode`,
    })
    
    pinPromise.then(pin => {
        commonModals.alert({
          title: 'User Login PIN',
          message: pin.data
        })
      }
    )
  }  

}