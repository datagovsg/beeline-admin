import assert from 'assert';

angular.module('beeline-admin')
  .controller('usersController', function ($scope, AdminService, RoutesService, 
    LoadingSpinner, $state, $stateParams, issueTicketModal, commonModals, $uibModal) {

  $scope.user = null
  $scope.selector = { userId: $stateParams.userId || null }
  $scope.routeCredits = null
  $scope.adminService = AdminService
  $scope.companyId = $stateParams.companyId || null

  $scope.$watch('selector.userId', userId => {
    if(userId){
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

      if($scope.companyId){
        RoutesService.fetchRouteCredits(userId, $scope.companyId)
        .then(routeCredits => {
          $scope.routeCredits = routeCredits
        })
      }
    }
  })

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
    ).catch(err => {
      console.log(err)
    })
  }

})