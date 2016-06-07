import assert from 'assert';
import leftPad from 'left-pad';

export default function(AdminService, RoutesService, $rootScope) {
  return {
    template: require('./tripSelector.html'),
    scope: {
      tripId: '=',
      alightStopId: '=?',
      boardStopId: '=?',
      routeId: '=?',
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
        datepickerOptions: {
          dateDisabled: ({date, mode}) => {
            return true;
          }
        },
        popupOpen: false,
      }

      // Get routess
      scope.displayRoute = (route) => `${route.label}: ${route.from} -- ${route.to}`
      RoutesService.getRoutes()
      .then((routes) => {
        scope.info.routes = routes;
      })

      // If tripId changes (due to external force)
      // need to ensure that the route & the stops are valid
      scope.$watch('tripId', (tripId) => {
        if (!tripId) return;
        
        // FIXME: use caching here
        RoutesService.getTrip(scope.tripId)
        .then((trip) => {
          if (scope.routeId != trip.routeId) {
            scope.routeId = trip.routeId;
          }
        })
      })

      // Get trip dates
      scope.$watch('routeId', () => {
        if (!scope.routeId) {
          return null;
        }

        scope.disp.datepickerOptions.dateDisabled = () => true
        scope.$broadcast('refreshDatepickers')

        scope.info.tripDates = []
        scope.info.trips = []
        RoutesService.getRoute(scope.routeId, {
          includeTrips: true,
          includeAvailability: true,
        })
        .then((route) => {
          scope.info.trips = route.trips

          var tripDatesObj = _.keyBy(scope.info.trips, t => t.date.getTime())
          scope.disp.datepickerOptions.dateDisabled = ({date, mode}) => {
            var dateInUtc = new Date(Date.UTC(date.getFullYear(),
                        date.getMonth(),
                        date.getDate()));
            return !(dateInUtc.getTime() in tripDatesObj)
          }
          scope.$broadcast('refreshDatepickers')
        })
      })

      // Get the board stops / alight stops
      function formatTime(tm) {
        var dt = new Date(tm)
        return dt.getHours() + ':' + leftPad(dt.getMinutes(), 2, '0');
      }
      scope.isBoardStop = ts => ts.canBoard
      scope.isAlightStop = ts => ts.canAlight
      scope.displayStop = ts => `${formatTime(ts.time)}: ${ts.stop.description}`

      // When date changes, update trip stops
      scope.$watchGroup(['info.trips', 'query.tripDate'], () => {
        var theTrip  = scope.info.trips
          .find(tr => tr.date.getTime() == scope.query.tripDate.getTime())

        scope.info.trip = theTrip;

        if (!theTrip) {
          scope.info.tripId = null;
          scope.info.tripStops = null;
          return;
        }

        // Find the previous stops
        if (scope.info.tripStops) {
          var previousBoardStop = scope.info.tripStops
            .find(ts => ts.id == scope.boardStopId)
          previousBoardStop = previousBoardStop ? previousBoardStop.stop.id : null;

          var previousAlightStop = scope.info.tripStops
            .find(ts => ts.id == scope.alightStopId)
          previousAlightStop = previousAlightStop ? previousAlightStop.stop.id : null;

          // Update the board stop id, alight stop id
          scope.boardStopId = theTrip.tripStops.find(ts => ts.stop.id == previousBoardStop)
          scope.alightStopId = theTrip.tripStops.find(ts => ts.stop.id == previousAlightStop)

          scope.boardStopId = scope.boardStopId ? scope.boardStopId.id : null;
          scope.alightStopId = scope.alightStopId ? scope.alightStopId.id : null;
        }
        // update trip ID, trip stops
        scope.tripId = theTrip.id
        scope.info.tripStops = theTrip.tripStops

      })
    },
  }

}
