import assert from 'assert';
import leftPad from 'left-pad';

export default function(AdminService, RoutesService, $rootScope, LoadingSpinner) {
  return {
    template: require('./tripSelector.html'),
    scope: {
      tripId: '=',
      alightStopId: '=?',
      boardStopId: '=?',
      routeId: '=?',
      tickets: '=?',
    },
    link(scope, elem, attr) {
      var todayUTC = new Date()
      todayUTC = new Date(Date.UTC(todayUTC.getFullYear(), todayUTC.getMonth(), todayUTC.getDate()))

      // The options for the select
      scope.info = {
        routes: [],
        tripDates: [],
        trips: [],
        tripStops: [],
        trip: null,
      }
      scope.query = {
        tripDate: todayUTC,
      }
      scope.disp = {
    //     ng-model="disp.selectedDatesLocal"
    //  days-allowed="disp.daysAllowed"
    //   highlight-days="disp.highlightDays"
    //    disallow-back-past-months="true"
    //     disable-days-before="disp.today"
        datepicker: {
          highlightDays: [],
          daysAllowed: [],
        },
        popupOpen: false,
      }
      scope.data = {
        routeId: null,
        selectedDates: [],
        trips: [],
      }

      // Get routes
      scope.displayRoute = (route) => `${route.label}: ${route.from} -- ${route.to}`
      var routesPromise = RoutesService.getRoutes({
        includeTrips: false,
        startDate: Date.now()
      })
      .then((routes) => {
        scope.info.routes = routes;
      })
      LoadingSpinner.watchPromise(routesPromise);

      // Get trip dates
      scope.$watch('data.routeId', (routeId) => {
        if (!routeId) {
          return null;
        }

        scope.info.tripDates = [];
        scope.info.trips = [];

        var today = new Date();
        today.setHours(0,0,0);

        RoutesService.getRoute(routeId, {
          includeTrips: true,
          includeAvailability: true,
          startDate: today.getTime()
        })
        .then((route) => {
          scope.info.trips = route.trips

          scope.disp.datepicker.daysAllowed = route.trips.map(trip =>
            moment(trip.date));
          scope.disp.datepicker.highlightDays = route.trips.map(trip =>
            ({
              date: trip.date,
              selectable: true,
              annotation: trip.availability.seatsAvailable
            }))
        })
      });

      // Get stops
      scope.$watch('data.selectedDates', (selectedDates) => {
        if (!selectedDates || selectedDates.length === 0) {
          scope.info.tripStops = null;
          return;
        }

        // Find the initial set of stops
        var offset = new Date().getTimezoneOffset() * 60000;
        var initialSubset = scope.info.trips.find(tr =>
            moment(tr.date).valueOf() + offset === selectedDates[0].valueOf())
        assert(initialSubset);

        initialSubset = initialSubset.tripStops;

        // For each day, reduce the subset to the intersection
        scope.data.trips = [];
        for (let day of selectedDates) {
          let trip = scope.info.trips.find(tr =>
            moment(tr.date).valueOf() + offset == day.valueOf());
          let stopsSet = trip.tripStops;

          // Stops must match by id and time
          initialSubset = _.intersectionBy(initialSubset,
                                           ts => `${ts.stop.id};${ts.time.getHours()};${ts.time.getMinutes()}`);
          // push to list of trips
          scope.data.trips.push(trip);
        }
        scope.data.trips = _.sortBy(scope.data.trips, t => t.date)
        scope.info.tripStops = initialSubset;
      }, true);

      scope.$watchGroup(['boardStop', 'alightStop', 'data.trips'], () => {
        // update scope.tickets
        scope.tickets = scope.data.trips.map(trip =>
          ({
            tripId: trip.id,
            boardStopId: scope.boardStop ? trip.tripStops.find(ts => ts.stop.id === scope.boardStop.stop.id).id
                                    : null,
            alightStopId: scope.alightStop ? trip.tripStops.find(ts => ts.stop.id === scope.alightStop.stop.id).id
                                    : null
          }))
      })

      scope.removeTrip = function(date) {
        var offset = new Date().getTimezoneOffset() * 60000;
        var matchingIndex = scope.data.selectedDates.findIndex(dt =>
          dt.valueOf() === date.valueOf() + offset)

        scope.data.selectedDates.splice(matchingIndex, 1);
      }

      // Get the board stops / alight stops
      function formatTime(tm) {
        var dt = new Date(tm)
        return dt.getHours() + ':' + leftPad(dt.getMinutes(), 2, '0');
      }
      scope.isBoardStop = ts => ts.canBoard
      scope.isAlightStop = ts => ts.canAlight
      scope.displayStop = ts => `${formatTime(ts.time)}: ${ts.stop.description}`
    },
  }

}
