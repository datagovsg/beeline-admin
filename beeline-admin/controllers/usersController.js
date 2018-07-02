import assert from 'assert';
import _ from 'lodash';

angular.module('beeline-admin')
  .controller('usersController', [
    '$scope', 'AdminService', 'RoutesService',
    'LoadingSpinner', '$state', '$stateParams', 'issueRouteCreditsModal',
    'expireRouteCreditsModal', 'commonModals', '$uibModal', 'companyId',
    function ($scope, AdminService, RoutesService,
    LoadingSpinner, $state, $stateParams, issueRouteCreditsModal,
    expireRouteCreditsModal, commonModals, $uibModal, companyId) {

  $scope.user = null
  $scope.selector = { userId: $stateParams.userId || null }
  $scope.routePasses = null
  $scope.adminService = AdminService
  $scope.companyId = $stateParams.companyId || null
  $scope.now = Date.now()

  $scope.$watch('selector.userId', (userId) => {
    if (userId != $stateParams.userId) {
      $state.go('c.users', {userId, companyId})
    }
  })

  if ($scope.selector.userId){
    $scope.showRoutePassHistory = null;

    LoadingSpinner.watchPromise(
      AdminService.beeline({
        method: 'GET',
        url: `/user/${$scope.selector.userId}`
      })
    ).then(resp => {
      if(resp){
        $scope.user = resp.data;
      }

      return Promise.all([
        $scope.companyId ? loadRoutePassesAndRoutes($scope.selector.userId) : Promise.resolve(),
        loadBids($scope.selector.userId),
      ])
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

  $scope.issueRouteCredits = function(routeCredit, arbitrary) {
    if (!arbitrary) {
      assert(routeCredit.routes
          && routeCredit.routes.length > 0)
      assert(routeCredit.routes[0].trips
          && routeCredit.routes[0].trips.length > 0)
    }
    let context = arbitrary
      ? {
        user: $scope.user,
        price: 0,
      }
      : {
        user: $scope.user,
        price: routeCredit.routes[0].trips[0].price,
        tag: routeCredit.tag
      }

    issueRouteCreditsModal.issueOn(context)
    .then((issueResult) => {
      if (issueResult) {
        return issueRouteCreditsModal.processModalResult(issueResult)
        .then(() => loadRoutePassesAndRoutes($scope.user.id))
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
      quantity: 1,
      tag: routeCredit.tag,
    }

    expireRouteCreditsModal.showExpireModal(context)
    .then((expireResult) => {
      if (expireResult) {
        return expireRouteCreditsModal.processModalResult(expireResult)
        .then(() => loadRoutePassesAndRoutes($scope.user.id))
        .then(() => commonModals.alert('Passes expired'))
      }
    })
    .catch(err => commonModals.alert(
      `${err && err.data && err.data.message}`))
  }

  $scope.showHistory = function (credit) {
    $scope.showRoutePassHistory = credit;
  }

  function loadBids(userId) {
    LoadingSpinner.watchPromise(
      Promise.all([
        RoutesService.getRoutes(),
        AdminService.beeline({
          url: `/crowdstart/users/${userId}/bids`
        })
      ])
      .then(([routes, bidsResponse]) => {
        $scope.crowdstarts = _(bidsResponse.data)
          .map(b => ({
            ...b,
            route: routes.find(r => b.routeId === r.id)
          }))
          .filter(b => !$scope.companyId || _.get(b, 'route.transportCompanyId') === +$scope.companyId)
          .orderBy(['createdAt'], ['desc'])
          .value()
        setTimeout(() => $scope.$digest())
      })
    )
  }

  function loadRoutePassesAndRoutes(userId){
    let companyRoutesPromise = RoutesService.getRoutes()
      .then(routes => routes.filter(r => r.transportCompanyId == $scope.companyId))

    return LoadingSpinner.watchPromise(Promise.all([
      RoutesService.fetchRoutePasses(userId, $scope.companyId),
      companyRoutesPromise
    ])
    .then(([routePasses, companyRoutes]) => {
      let routePassesWithRoutes =
        routePasses.map(rp => {
          rp.routes = companyRoutes.filter(
            r => r.tags.indexOf(rp.tag) !== -1)
          return rp
        })

      let getRouteWithTrips = _(routePassesWithRoutes)
        .map(rp => rp.routes)
        .flatten()
        .map(r => RoutesService.getRoute(r.id, { includeTrips: true }))
        .value()

      $scope.routePasses = routePasses

      return Promise.all(getRouteWithTrips)
    })).then(routeTrips => {
      let routeWithTripsByRouteId = _.keyBy(routeTrips, r => r.id)

      $scope.routePasses = $scope.routePasses.map(rp => {
        rp.routes = rp.routes.map(route => {
          let routeWithTrips = routeWithTripsByRouteId[route.id]
          const tripDates = routeWithTrips.trips.map(trip => trip.date)
          routeWithTrips.startDate = new Date(_.min(tripDates));
          routeWithTrips.endDate = new Date(_.max(tripDates));
          return routeWithTrips
        })
        return rp
      })

      if ($scope.showRoutePassHistory) {
        $scope.showRoutePassHistory = $scope.routePasses.find(r => r.tag == $scope.showRoutePassHistory.tag)
      }

      $scope.$apply()
    })
  }
}])
