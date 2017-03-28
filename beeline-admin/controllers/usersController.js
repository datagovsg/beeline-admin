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
        if(resp){
          $scope.user = resp.data;
        }
      }).catch(err => {
        commonModals.alert(`${err && err.data && err.data.message}`)
        .then(()=>{
          $state.go('c.users', { userId: null })
        })
      })

      if($scope.companyId){
        LoadingSpinner.watchPromise(
          Promise.all([
            RoutesService.fetchRouteCredits(userId, $scope.companyId),
            RoutesService.getRoutes({includeTrips: true})
          ]).then(([routeCredits, routes]) => {
            let companyRoutes = routes.filter(
              r => r.transportCompanyId == $scope.companyId
            )

            for(let rc of routeCredits){
              rc.routes = companyRoutes.filter(
                r => r.tags.indexOf(rc.tag) !== -1
              )
            }

            $scope.routeCredits = routeCredits

            $scope.$apply()
          })
        )
      }
    }
  })

  $scope.getUserPin = async function (){
    if(!$scope.user) return
      
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
    }).catch(err => {
      console.log(err)
    })
  }

})