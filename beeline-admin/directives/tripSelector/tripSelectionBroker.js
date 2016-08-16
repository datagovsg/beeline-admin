import assert from 'assert';

export default function(AdminService, RoutesService, $rootScope, LoadingSpinner) {

  return {
    transclude: true,
    scope: {
      /* When these change */
      alightStop: '=?',
      boardStop: '=?',
      alightStopId: '=?',
      boardStopId: '=?',
      routeId: '<?',
      selectedDates: '=?',

      /* Update these */
      boardStops: '=',
      alightStops: '=',
      routes: '=',
      datepickerHighlightDays: '=?',
      datepickerDaysAllowed: '=?',
      selectedTrips: '=?',
      trips: '=?',
      purchaseOrder: '=?',
      /* ... boardStop, alightStop */
    },
    link(scope, elem, attr) {
      // The options for the select
      scope.info = {
        tripDates: [],
        tripStops: [],
      }

      // Pull the list of routes
      var routesPromise = RoutesService.getRoutes({
        includeTrips: false,
        startDate: Date.now()
      })
      .then((routes) => {
        scope.routes = routes;
      })
      LoadingSpinner.watchPromise(routesPromise);

      // Get trip dates
      scope.$watch('routeId', (routeId) => {
        if (!routeId) {
          return null;
        }

        scope.info.tripDates = [];
        scope.trips = [];

        var today = new Date();
        today.setHours(0,0,0);

        RoutesService.getRoute(routeId, {
          includeTrips: true,
          includeAvailability: true,
          startDate: today.getTime()
        })
        .then((route) => {
          scope.trips = route.trips.filter(t => t.isRunning);

          scope.datepickerDaysAllowed = scope.trips.map(trip =>
            new Date(
                trip.date.getFullYear(),
                trip.date.getMonth(),
                trip.date.getDate()));
          scope.datepickerHighlightDays = route.trips.map(trip =>
            ({
              date: new Date(
                  trip.date.getFullYear(),
                  trip.date.getMonth(),
                  trip.date.getDate()),
              selectable: true,
              annotation: `${trip.availability.seatsAvailable}`
            }))

          // Unselect the dates that are now unselectable
          var offset = new Date().getTimezoneOffset() * 60000;
          scope.selectedDates = scope.selectedDates.filter(
            d => route.trips.some(t => t.date.valueOf() + offset === d.valueOf())
          )
        })
      });

      // Get stops
      scope.$watch('selectedDates', (selectedDates) => {
        if (!selectedDates || selectedDates.length === 0) {
          scope.selectedTrips = [];
          scope.info.tripStops = null;
          return;
        }

        // Find the initial set of stops
        var offset = new Date().getTimezoneOffset() * 60000;
        var initialSubset = scope.trips.find(tr =>
            moment(tr.date).valueOf() + offset === selectedDates[0].valueOf())
        assert(initialSubset);

        initialSubset = initialSubset.tripStops;

        // For each day, reduce the subset to the intersection
        var selectedTrips = [];
        for (let day of selectedDates) {
          let trip = scope.trips.find(tr =>
            moment(tr.date).valueOf() + offset == day.valueOf());
          let stopsSet = trip.tripStops;

          // Stops must match by id and time
          initialSubset = _.intersectionBy(initialSubset,
                                           ts => `${ts.stop.id};${ts.time.getHours()};${ts.time.getMinutes()}`);
          // push to list of trips
          selectedTrips.push(trip);
        }
        scope.selectedTrips = _.sortBy(selectedTrips, t => t.date)

        // Update the list of boarding/alighting stops
        var tripStops = initialSubset;
        scope.boardStops = tripStops.filter(ts => ts.canBoard);
        scope.alightStops = tripStops.filter(ts => ts.canAlight);

        // Update boardStop / alightStop
        if (scope.boardStopId) {
          scope.boardStop = scope.boardStops.find(ts =>
            ts.stopId === scope.boardStopId)
        }
        if (scope.alightStopId) {
          scope.alightStop = tripStops.find(ts =>
            ts.stopId === scope.alightStopId)
        }
      }, true);

      scope.$watchGroup(['boardStop', 'alightStop', 'selectedTrips'], () => {
        if (scope.boardStop) {
          scope.boardStopId = scope.boardStop.stopId;
        }
        if (scope.alightStop) {
          scope.alightStopId = scope.alightStop.stopId;
        }

        if (!scope.selectedTrips) {
          return;
        }

        // update scope.trips
        scope.purchaseOrder = scope.selectedTrips.map(trip =>
          ({
            tripId: trip.id,
            boardStopId: scope.boardStop ? trip.tripStops.find(ts => ts.stopId === scope.boardStop.stopId).id
                                    : null,
            alightStopId: scope.alightStop ? trip.tripStops.find(ts => ts.stopId === scope.alightStop.stopId).id
                                    : null
          }))
      })
    },
  }
}
