import _ from 'lodash'

export default function(RoutesService) {

  return {
    scope: {
      routeId: '='
    },
    template: require('./tripsEditor.html'),
    link(scope, elem, attr) {
      /* Date filters require UTC time */
      var now = new Date()
      now.setUTCHours(0, 0, 0, 0)
      scope.filter = {
        startDate: now,
      }
      scope.disp = {
        stopsList: [],
        newDates: [],
        existingDates: [],
        validDates: [],
        tripStops: [],
        trip: null,
      }
      scope.refreshTrips = function() {
        RoutesService.getTrips({
          routeId: scope.routeId,
          startDate: new Date(scope.filter.startDate)
        })
        .then((trips) => {
          scope.trips = trips;

          // populate dates
          scope.disp.existingDates = _.uniq(trips.map(tr => tr.date.substr(0,10)))
            .map(dtStr => new Date(dtStr));

          // populate stops
          var stopsSet = {}

          for (let trip of trips) {
            for (let tripStop of trip.tripStops) {
              if (!(tripStop.stop.id in stopsSet)) {
                stopsSet[tripStop.stop.id] = tripStop
              }
            }
          }

          var stopsList = _.values(stopsSet);
          stopsList = _.sortBy(stopsList, s => s.time)
          scope.disp.stopsList = stopsList;

        });
      }
      scope.findStop = function(trip, stopId) {
        return trip.tripStops.find(ts => ts.stop.id == stopId)
      }
      scope.referenceTrip = function(trip) {
        scope.disp.tripStops = trip.tripStops.map(ts => ({
          stopId: ts.stopId,
          time: new Date(ts.time),
        }));
      }
      scope.deleteTrip = function(trip) {
        if (confirm("Are you sure you want to delete?")) {
          RoutesService.deleteTrip(trip.id)
        }
      }
      scope.editTrip = function(trip) {
        scope.disp.trip = trip;
        scope.disp.tripStops = trip.tripStops.map(ts => ({
          tripStopId: ts.tripStopId,
          stopId: ts.stopId,
          time: new Date(ts.time),
        }));
      }
      scope.clearEdit = function() {
        scope.disp.trip = null;
        scope.disp.tripStops = [];
      }
      scope.saveTrips = function() {
        RoutesService.saveTrips(scope.routeId, disp.newDates, disp.tripStops)
      }

      scope.$watchGroup(['filter.startDate', 'filter.endDate'], scope.refreshTrips)
      scope.$watch('routeId', scope.refreshTrips)
      scope.$watch('startDate', () => {
        scope.disp.validDates = _.range(0, 365)
          .map(i => new Date(now.getTime() + i * 24 * 3600 * 1000));
      })
    }
  }
}
