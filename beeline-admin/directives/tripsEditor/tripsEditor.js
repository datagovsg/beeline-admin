import _ from 'lodash'
import {timeSinceMidnight} from '../../shared/filters';

export default function(RoutesService, TripsService, AdminService, DriverService,
  StopsPopup, LoadingSpinner, commonModals) {

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
        windowSizeOptions: [
          {size: 0, label: '0 mins'},
          {size: -300000, label: '5 mins'},
          {size: -15 * 60 * 1000, label: '15 mins'},
          {size: -30 * 60 * 1000, label: '30 mins'},
          {size: -1 * 60 * 60 * 1000, label: '1 hr'},
          {size: -3 * 60 * 60 * 1000, label: '3 hrs'},
          {size: -6 * 60 * 60 * 1000, label: '6 hrs'},
        ],
        trip: defaultTrip(),

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
      }; /* scope.disp */
      scope.refreshTrips = function() {
        var promise = TripsService.getTrips({
          routeId: scope.routeId,
          startDate: new Date(scope.filter.startDate.getTime() - 8*60*60*1000 /* timezone offset */),
          endDate: new Date(scope.filter.startDate.getTime() + 365 * 24 * 60 * 60 * 1000 - 8*60*60*1000 /* timezone offset */),
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
          stopsList = _.sortBy(stopsList, s => timeSinceMidnight(s.time))
          scope.disp.stopsList = stopsList;

        });

        LoadingSpinner.watchPromise(promise)
      }
      scope.resetTrips = function() {
        scope.disp.newDates = [];
        scope.disp.trip = defaultTrip();
      }
      scope.findStop = function(trip, stopId) {
        return trip.tripStops.find(ts => ts.stop.id == stopId)
      }
      scope.referenceTrip = function(trip) {
        scope.disp.trip = _.clone(trip);
        scope.disp.trip.tripStops = _.cloneDeep(trip.tripStops);
        delete scope.disp.trip.id;
      }
      scope.deleteTrip = async function(trip) {
        if (await commonModals.confirm("Are you sure you want to delete?")) {
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
        scope.disp.trip = defaultTrip();
      }
      scope.saveTrips = function() {
        return LoadingSpinner.watchPromise((async function() {
          // get the driver id... and create the driver if non-existent
          // var driver = await DriverService.fetchDriverIds([scope.disp.trip])
          //
          // if (scope.disp.trip.driverTelephone && !scope.disp.trip.driverId) {
          //   driver = await DriverService.createDriver({
          //     telephone: '+65' + scope.disp.trip.driverTelephone,
          //     name: scope.disp.trip.driverTelephone,
          //   })
          //   scope.disp.trip.driverId = driver.id;
          // }
          // else if (!scope.disp.trip.driverTelephone) {
          //   scope.disp.trip.driverId = null;
          // }

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
              return commonModals.alert("Trips created")
            })
            .catch((error) => {
              console.log(error)
              commonModals.alert({
                title: error.data.error,
                message: error.data.message
              });
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
          scope.disp.trip = defaultTrip();
        }
      }; /* selectTrips() */

      scope.$watchGroup(['filter.startDate', 'filter.endDate'], scope.refreshTrips)
      scope.$watch('routeId', scope.refreshTrips)
      scope.$watch('startDate', () => {
        scope.disp.validDates = _.range(0, 365)
          .map(i => new Date(now.getTime() + i * 24 * 3600 * 1000));
      })

      function defaultTrip() {
        return {
          routeId: scope.routeId,
          tripStops: [],
          bookingInfo: {
            windowSize: -6 * 3600 * 1000,
            windowType: 'firstStop'
          }
        };
      }
    }
  }
}
