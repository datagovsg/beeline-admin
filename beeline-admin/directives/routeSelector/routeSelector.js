import _ from 'lodash'

export default function(RoutesService, TripsService, LoadingSpinner, $rootScope,
  commonModals, $uibModal) {

  return {
    template: require('./routeSelector.html'),
    scope: {
      selectedRoute: '=',
      selectedRouteId: '=?',
    },
    link(scope, elem, attr) {

      scope.availableRoutes = [];

      scope.selectRoute = function(route) {
        scope.selectedRoute = route
        if (route) scope.selectedRouteId = route.id;
      };
      scope.copySelected = async function() {
        if (scope.selectedRoute) {
          var newRoute = _.omit(scope.selectedRoute, ['id']);

          // Prompt for a new label
          newRoute.label = await commonModals.prompt({
            message: 'New route label',
            'default': newRoute.label
          })

          if (!newRoute.label) {return;}

          // Prompt for the dates
          var trips = await promptForTripsToCopy(scope.selectedRoute);

          var createdRoute = await RoutesService.saveRoute(newRoute);

          // Created the associated trips
          var tripPromises = trips.map((trip) => {
            trip.id = null;
            trip.routeId = createdRoute.id;
            for (let tripStop of trip.tripStops) {
              tripStop.id = null;
            }
            return TripsService.createTrips(
              [moment(trip.date).utcOffset(0)],
              trip
            )
          })
          await LoadingSpinner.watchPromise(Promise.all(tripPromises));

          // scope.availableRoutes.push(createdRoute);
          scope.selectRoute(createdRoute)

          scope.$apply();
        }
      }
      scope.refreshList = function() {
        LoadingSpinner.watchPromise(RoutesService.getRoutes()
        .then((routes) => {
          scope.availableRoutes = routes;
        }))
      }

      scope.$watchGroup(['selectedRouteId', 'availableRoutes'], () => {
        if (scope.selectedRouteId) {
          scope.selectRoute(scope.availableRoutes.find(r => r.id == scope.selectedRouteId))
        }
      })

      scope.refreshList();
    },
  }

  async function promptForTripsToCopy(route) {
    var childScope = $rootScope.$new();

    childScope.route = route;
    childScope.data = {};

    var modal = $uibModal.open({
      controller: DatesController,
      keyboard: false,
      backdrop: 'static',
      template: require('../tripsEditor/createTripsDateTemplate.html'),
      scope: childScope
    })

    try {
      var dates = await modal.result;
      var filteredTrips = childScope.data.trips.filter(
        (trip) => _.some(dates, d => d.valueOf() === trip.date.getTime())
      )

      return filteredTrips;
    } catch (err) {
      throw err;
    } finally {
      childScope.$destroy();
    }
  }
}

function DatesController($scope, TripsService) {
  var lastPromise = null;
  var now = new Date();

  $scope.datepicker = {
    highlightDays: [],
    daysAllowed: [],
    month: moment(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()), 'x'
    ).utcOffset(0)
  }

  $scope.monthChanged = function () {}

  function loadTrips(newMonth) {
    var promise = lastPromise = TripsService.getTrips({
      routeId: $scope.route.id,
      startDate: new Date(
        newMonth.year(),
        newMonth.month() - 2,
        1
      ),
      endDate: new Date(
        newMonth.year(),
        newMonth.month() + 2,
        1
      ),
    })
    .then((trips) => {
      if (promise !== lastPromise) return;
      $scope.data.trips = trips;
      $scope.datepicker.daysAllowed = trips.map(t => moment(t.date));
      // block out the days with trips
      $scope.datepicker.highlightDays = trips.map(
        trip => ({
          date: moment(trip.date),
          css: 'trip-exists',
          selectable: true,
        })
      )
    });
  }
  loadTrips(moment());
}
