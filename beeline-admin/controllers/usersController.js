import assert from 'assert';

angular.module('beeline-admin')
  .controller('usersController', function ($scope, AdminService, RoutesService, 
    LoadingSpinner, $state, $stateParams, issueRouteCreditsModal, commonModals, $uibModal) {

  $scope.user = null
  $scope.selector = { userId: $stateParams.userId || null }
  $scope.routeCredits = null
  $scope.adminService = AdminService
  $scope.companyId = $stateParams.companyId || null
  $scope.now = Date.now()

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
        commonModals.alert(
          `${err && err.data && err.data.message}`
        ).then(()=>{
          $state.go('c.users', { userId: null })
        })
      })

      if($scope.companyId){
        LoadingSpinner.watchPromise(
          loadRouteCreditsAndRoutes(userId)
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

  $scope.issueRouteCredits = async function(routeCredit) {
    assert(routeCredit.routes 
        && routeCredit.routes.length > 0)
    assert(routeCredit.routes[0].trips 
        && routeCredit.routes[0].trips.length > 0)

    let context = {
      user: $scope.user,
      route: routeCredit.routes[0],
      price: routeCredit.routes[0].trips[0].price
    }
    
    if(await issueRouteCreditsModal.issueOn(context)){
      await LoadingSpinner.watchPromise(
        loadRouteCreditsAndRoutes($scope.user.id)
      )  
      commonModals.alert('Credits issued')
    }
    
  }

  function loadRouteCreditsAndRoutes(userId){
    return Promise.all([
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

        for(let route of rc.routes){
          const tripDates = route.trips.map(trip => trip.date)
          route.startDate = new Date(_.min(tripDates));
          route.endDate = new Date(_.max(tripDates));
        }
      }

      $scope.routeCredits = routeCredits

      $scope.$apply()
    })
  }

})