import assert from 'assert';

angular.module('beeline-admin')
  .controller('usersController', function ($scope, AdminService, RoutesService,
    LoadingSpinner, $state, $stateParams, issueRouteCreditsModal,
    expireRouteCreditsModal, commonModals, $uibModal, companyId) {

  $scope.user = null
  $scope.selector = { userId: $stateParams.userId || null }
  $scope.routeCredits = null
  $scope.adminService = AdminService
  $scope.companyId = $stateParams.companyId || null
  $scope.now = Date.now()

  $scope.$watch('selector.userId', (userId) => {
    if (userId != $stateParams.userId) {
      $state.go('c.users', {userId, companyId})
    }
  })

  if ($scope.selector.userId){
    $scope.showRouteCreditHistory = null;

    LoadingSpinner.watchPromise(
      AdminService.beeline({
        method: 'GET',
        url: `/user/${$scope.selector.userId}`
      })
    ).then(resp => {
      if(resp){
        $scope.user = resp.data;
      }

      if($scope.companyId){
        return loadRouteCreditsAndRoutes($scope.selector.userId)
      }
    }).catch(err => {
      commonModals.alert(
        `${err && err.data && err.data.message}`
      )
    })
  }

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
      commonModals.alert(
        `${err && err.data && err.data.message}`
      )
    })
  }

  $scope.issueRouteCredits = function(routeCredit) {
    assert(routeCredit.routes
        && routeCredit.routes.length > 0)
    assert(routeCredit.routes[0].trips
        && routeCredit.routes[0].trips.length > 0)

    let context = {
      user: $scope.user,
      route: routeCredit.routes[0],
      price: routeCredit.routes[0].trips[0].price
    }

    issueRouteCreditsModal.issueOn(context)
    .then((issueResult) => {
      if (issueResult) {
        return issueRouteCreditsModal.processModalResult(issueResult)
        .then(() => loadRouteCreditsAndRoutes($scope.user.id))
        .then(() => commonModals.alert('Credits issued'))
      }
    })
    .catch(err => commonModals.alert(
      `${err && err.data && err.data.message}`))
  }

  $scope.expireRouteCredits = function(routeCredit) {
    assert(routeCredit.routes
        && routeCredit.routes.length > 0)
    assert(routeCredit.routes[0].trips
        && routeCredit.routes[0].trips.length > 0)

    let context = {
      user: $scope.user,
      route: routeCredit.routes[0],
      price: routeCredit.routes[0].trips[0].price
    }

    expireRouteCreditsModal.showExpireModal(context)
    .then((expireResult) => {
      if (expireResult) {
        return expireRouteCreditsModal.processModalResult(expireResult)
        .then(() => loadRouteCreditsAndRoutes($scope.user.id))
        .then(() => commonModals.alert('Credits expired'))
      }
    })
    .catch(err => commonModals.alert(
      `${err && err.data && err.data.message}`))
  }

  $scope.showHistory = function (credit) {
    $scope.showRouteCreditHistory = credit;
  }

  function loadRouteCreditsAndRoutes(userId){
    let companyRoutesPromise = RoutesService.getRoutes()
      .then(routes => routes.filter(r => r.transportCompanyId == $scope.companyId))

    return LoadingSpinner.watchPromise(Promise.all([
      RoutesService.fetchRouteCredits(userId, $scope.companyId),
      companyRoutesPromise
    ])
    .then(([routeCredits, companyRoutes]) => {
      let routeCreditsWithRoutes =
        routeCredits.map(rc => {
          rc.routes = companyRoutes.filter(
            r => r.tags.indexOf(rc.tag) !== -1)
          return rc
        })

      let getRouteWithTrips = _(routeCreditsWithRoutes)
        .map(rc => rc.routes)
        .flatten()
        .map(r => RoutesService.getRoute(r.id, { includeTrips: true }))
        .value()

      $scope.routeCredits = routeCredits

      return Promise.all(getRouteWithTrips)
    })).then(routeTrips => {
      let routeWithTripsByRouteId = _.keyBy(routeTrips, r => r.id)

      $scope.routeCredits = $scope.routeCredits.map(rc => {
        rc.routes = rc.routes.map(route => {
          let routeWithTrips = routeWithTripsByRouteId[route.id]
          const tripDates = routeWithTrips.trips.map(trip => trip.date)
          routeWithTrips.startDate = new Date(_.min(tripDates));
          routeWithTrips.endDate = new Date(_.max(tripDates));
          return routeWithTrips
        })
        return rc
      })

      if ($scope.showRouteCreditHistory) {
        $scope.showRouteCreditHistory = $scope.routeCredits.find(r => r.tag == $scope.showRouteCreditHistory.tag)
      }

      $scope.$apply()
    })
  }

})
