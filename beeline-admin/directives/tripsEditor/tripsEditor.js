import _ from 'lodash'

export default function(RoutesService, TripsService, AdminService, DriverService,
  StopsPopup, LoadingSpinner) {

  return {
    scope: {
      routeId: '=',
    },
    template: require('./tripsEditor.html'),
    link(scope, elem, attr) {
      scope.adminService = AdminService;

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
        trip: {
          routeId: scope.routeId,
          tripStops: [],
        },
        windowSizeOptions: [
          {size: 0, label: '0 mins before'},
          {size: -300000, label: '5 mins before'},
          {size: -600000, label: '10 mins before'},
          {size: -12 * 60 * 60 * 1000, label: '12 hrs before'},
        ],

        addTripStop() {
          this.trip.tripStops = this.trip.tripStops || [];
          this.trip.tripStops.push({
            time: new Date(2015,1,1,8,30,0),
            canBoard: true,
            canAlight: false
          })
        },
        deleteTripStop(index) {
          this.trip.tripStops.splice(index, 1)
        }
      }
      scope.refreshTrips = function() {
        var promise = TripsService.getTrips({
          routeId: scope.routeId,
          startDate: new Date(scope.filter.startDate),
          endDate: new Date(new Date(scope.filter.startDate).getTime() + 60 * 24 * 60 * 60 * 1000),
          includeAvailability: true,
        })
        .then((trips) => {
          // Add driver info to trips
          return DriverService.fetchDriverInfo(trips)
        })
        .then((trips) => {
          scope.trips = trips;

          // populate dates
          scope.disp.existingDates = _.uniq(trips.map(tr => tr.date.getTime()))
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

        LoadingSpinner.watchPromise(promise)
      }
      scope.resetTrips = function() {
        scope.disp.newDates = [];
        scope.disp.trip.tripStops = [];
      }
      scope.findStop = function(trip, stopId) {
        return trip.tripStops.find(ts => ts.stop.id == stopId)
      }
      scope.referenceTrip = function(trip) {
        scope.disp.trip = _.clone(trip);
        scope.disp.trip.tripStops = _.cloneDeep(trip.tripStops);
        delete scope.disp.trip.id;
      }
      scope.deleteTrip = function(trip) {
        if (confirm("Are you sure you want to delete?")) {
          TripsService.deleteTrip(trip.id)
          .then(scope.refreshTrips)
          .catch((error) => {
            console.error(error);
          })
        }
      }
      scope.editTrip = function(trip) {
        scope.disp.trip = _.clone(trip);
        scope.disp.trip.tripStops = _.cloneDeep(trip.tripStops);
      }
      scope.clearEdit = function() {
        scope.disp.trip = {};
        scope.disp.trip.routeId = scope.routeId;
        scope.disp.trip.tripStops = [];
      }
      scope.saveTrips = function() {
        return LoadingSpinner.watchPromise((async function() {
          // get the driver id... and create the driver if non-existent
          var driver = await DriverService.fetchDriverIds([scope.disp.trip])

          if (scope.disp.trip.driverTelephone && !scope.disp.trip.driverId) {
            driver = await DriverService.createDriver({
              telephone: '+65' + scope.disp.trip.driverTelephone,
              name: scope.disp.trip.driverTelephone,
            })
            scope.disp.trip.driverId = driver.id;
          }
          else if (!scope.disp.trip.driverTelephone) {
            scope.disp.trip.driverId = null;
          }

          if (scope.disp.trip.id) {
            // get a list of the trips to update
            var trips = scope.trips.filter(tr => tr.id in scope.selection.selected)

            // update the trips...
            return TripsService.updateTrips(
              trips,
              scope.disp.trip)
              .then(scope.refreshTrips)
          }
          else {
            return TripsService.createTrips(
              scope.disp.newDates,
              scope.disp.trip)
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
        })())
      }
      scope.showPopupFor = function (ts) {
        StopsPopup.show({
          title: 'Select a Stop!'
        })
        .then((x) => {
          ts.stopId = x.id;
        })
      }

      //// Logic to handle trip selection (using Ctrl, Shift etc)
      scope.selection = {
        selected: {},
        lastSelected: null,
        listStart: null
      }
      scope.selectTrips = function (list, index, event) {
        var id = list[index].id;

        function toggle(index) {
          if (list[index].id in scope.selection.selected) {
            delete scope.selection.selected[list[index].id]
          }
          else {
            scope.selection.selected[list[index].id] = list[index];
          }
        }

        if (event.ctrlKey) {
          event.preventDefault();
          toggle(index);
          scope.selection.listStart = index;
          scope.selection.lastSelected = index;
        }
        else if (event.shiftKey) {
          // FIXME: This is still not entirely intuitive
          event.preventDefault();

          if (index < scope.selection.lastSelected) {
            for (let i=scope.selection.lastSelected - (
                    (scope.selection.lastSelected == scope.selection.listStart) ? 1
                    : (scope.selection.lastSelected < scope.selection.listStart) ? 1
                    : 0);
                  i >= index;
                  i--) {
              toggle(i)
            }
          }
          else if (index > scope.selection.lastSelected) {
            for (let i = scope.selection.lastSelected + (
                    (scope.selection.lastSelected == scope.selection.listStart) ? 1
                    : (scope.selection.lastSelected > scope.selection.listStart) ? 1
                    : 0);
                  i <= index;
                  i++) {
              toggle(i)
            }
          }

          scope.selection.lastSelected = index;
        }
        else {
          event.preventDefault();
          scope.selection.selected = {}
          toggle(index)
          scope.selection.listStart = index;
          scope.selection.lastSelected = index;
        }
        if (scope.selection.selected[id]) {
          scope.editTrip(list[index])
        }
        // if nothing is selected clear the trip
        console.log(scope.selection.selected)
        if (!_.every(_.values(scope.selection.selected))
          || _.keys(scope.selection.selected).length == 0
        ) {
          scope.disp.trip = {};
          scope.disp.trip.tripStops = [];
        }
      }; /* selectTrips() */

      scope.$watchGroup(['filter.startDate', 'filter.endDate'], scope.refreshTrips)
      scope.$watch('routeId', scope.refreshTrips)
      scope.$watch('startDate', () => {
        scope.disp.validDates = _.range(0, 365)
          .map(i => new Date(now.getTime() + i * 24 * 3600 * 1000));
      })
    }
  }
}
