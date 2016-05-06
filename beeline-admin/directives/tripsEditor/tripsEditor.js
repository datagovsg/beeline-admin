import _ from 'lodash'

export default function(RoutesService, AdminService, StopsPopup) {

  return {
    scope: {
      routeId: '=',
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

        addTripStop() {
          this.tripStops.push({
            time: new Date(2015,1,1,8,30,0),
            canBoard: true,
            canAlight: false
          })
        },
        deleteTripStop(index) {
          this.tripStops.splice(index, 1)
        }
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
      scope.resetTrips = function() {
        scope.disp.newDates = [];
        scope.disp.tripStops = [];
      }
      scope.findStop = function(trip, stopId) {
        return trip.tripStops.find(ts => ts.stop.id == stopId)
      }
      scope.referenceTrip = function(trip) {
        scope.disp.tripStops = trip.tripStops.map(ts => ({
          stopId: ts.stopId,
          time: new Date(ts.time),
          canBoard: ts.canBoard,
          canAlight: ts.canAlight,
        }));
      }
      scope.deleteTrip = function(trip) {
        if (confirm("Are you sure you want to delete?")) {
          RoutesService.deleteTrip(trip.id)
          .then(scope.refreshTrips)
          .catch((error) => {
            console.error(error);
          })
        }
      }
      scope.editTrip = function(trip) {
        scope.disp.trip = trip;
        console.log(trip.tripStops)
        scope.disp.tripStops = trip.tripStops.map(ts => ({
          id: ts.id,
          stopId: ts.stopId,
          time: new Date(ts.time),
          canBoard: ts.canBoard,
          canAlight: ts.canAlight,
        }));
        console.log(scope.disp.tripStops)
      }
      scope.clearEdit = function() {
        scope.disp.trip = null;
        scope.disp.tripStops = [];
      }
      scope.saveTrips = function() {
        if (scope.disp.trip) {
          RoutesService.updateTrip(
            {
              trip: scope.disp.trip,
              tripStops: scope.disp.tripStops,
            })
        }
        else {
          RoutesService.createTrips({
            routeId: scope.routeId,
            dates: scope.disp.newDates,
            tripStops: scope.disp.tripStops,
            companyId: AdminService.getCompanyId(),
          })
          .then(scope.refreshTrips)
          .then(scope.resetTrips)
          .then(() => {
            alert("Trips created")
          })
          .catch((error) => {
            console.log(error)
            alert(`${error.data.error} -- ${error.data.message}`)
          })
        }
      }
      scope.showPopupFor = function (ts) {
        StopsPopup.show({
          title: 'Select a Stop!'
        })
        .then((x) => {
          ts.stopId = x.id;
        })
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
