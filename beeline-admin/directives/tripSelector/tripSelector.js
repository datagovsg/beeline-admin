import assert from 'assert';
import leftPad from 'left-pad';

export default function(AdminService, RoutesService, $rootScope) {
  return {
    template: require('./tripSelector.html'),
    scope: {
      tripId: '=',
      alightStopId: '=?',
      boardStopId: '=?',
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
        routeId: undefined,
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

      // Get trip dates
      scope.$watch('query.routeId', () => {
        if (!scope.query.routeId) {
          return null;
        }

        scope.disp.datepickerOptions.dateDisabled = () => true
        scope.$broadcast('refreshDatepickers')

        scope.info.tripDates = []
        scope.info.trips = []
        RoutesService.getRoute(scope.query.routeId, {
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

        scope.tripId = theTrip.id
        scope.info.tripStops = theTrip.tripStops
      })

    },
  }

}
