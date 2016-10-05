import _ from 'lodash'
import {timeSinceMidnight} from '../../shared/filters';

export default function(RoutesService, TripsService, AdminService, DriverService,
  StopsPopup, LoadingSpinner, commonModals, $uibModal) {

  return {
    scope: {
      route: '=',
    },
    template: require('./tripsEditor.html'),
    link(scope, elem, attr) {
      scope.adminService = AdminService;
      scope.selection = {};

      /* Date filters require UTC time */
      var now = new Date()
      now.setUTCHours(0, 0, 0, 0)
      scope.filter = {
        filterMonth: now,
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
      }; /* scope.disp */

      function reloadTrips() {
        var promise = TripsService.getTrips({
          routeId: scope.route.id,
          startDate: new Date(
            scope.filter.filterMonth.getFullYear(),
            scope.filter.filterMonth.getMonth(),
            1
          ),
          endDate: new Date(
            scope.filter.filterMonth.getFullYear(),
            scope.filter.filterMonth.getMonth() + 1,
            1
          ),
          includeAvailability: true,
        })
        .then((trips) => {
          scope.trips = _.sortBy(trips, 'date');

          // populate dates
          scope.disp.existingDates = _.uniq(trips.map(tr => tr.date.getTime()))
            .map(dtStr => new Date(dtStr));

          // populate stops
          // stops are keyed by (1) their stop id, (2) order of appearance
          // Need to record the order of appearance in each tripStop
          var stopsSet = {};

          for (let trip of trips) {
            var tsSet = _.groupBy(trip.tripStops, 'stopId');

            _.mapValues(tsSet, (tripStops, stopId) => {

              tripStops.forEach((tripStop, index) => {
                tripStop.orderOfAppearance = index;
                stopsSet[tripStop.stopId] = stopsSet[tripStop.stopId] || [];
                stopsSet[tripStop.stopId][index] = stopsSet[tripStop.stopId][index]
                  || tripStop;
              })
            })
          }

          var stopsList = _.flatten(_.values(stopsSet));
          stopsList = _.sortBy(stopsList, s => timeSinceMidnight(s.time))
          scope.disp.stopsList = stopsList;
        });
        LoadingSpinner.watchPromise(promise)
      }
      scope.findStop = (trip, stopId, ooA) => {
        return trip.tripStops.find(ts => ts.stopId === stopId && ts.orderOfAppearance === ooA);
      }
      scope.currentTrip = {
        data: {
          trip: null,
          newDates: [],
          editingTrips: null
        },

        reset() {
          this.data.newDates = [];
          this.data.trip = defaultTrip();
        },
        takeReference(trip) {
          if (trip) {
            this.data.trip = _.clone(trip);
            this.data.trip.tripStops = _.cloneDeep(trip.tripStops);
          }
          else {
            this.data.trip = defaultTrip();
          }
          this.data.editingTrips = null;
        },

        edit(trip) {
          this.data.trip = _.clone(trip);
          this.data.trip.tripStops = _.cloneDeep(trip.tripStops);
          this.data.newDates = [];
          this.data.editingTrips = _(scope.selection.$selectedObjects())
            .sortBy('date')
            .value();
        },
        save() {
          return LoadingSpinner.watchPromise((() => {
            if (this.data.editingTrips) {
              // update the trips...
              return TripsService.updateTrips(this.data.editingTrips, this.data.trip)
                .then(reloadTrips)
                .then(() => {
                  return commonModals.flash("Trips updated")
                })
                .catch((error) => {
                  console.log(error)
                  commonModals.alert({
                    title: error.data.error,
                    message: error.data.message
                  });
                  throw error;
                })
            }
            else {
              return TripsService.createTrips(
                this.data.newDates,
                this.data.trip)
              .then(reloadTrips)
              .then(() => this.reset())
              .then(() => {
                return commonModals.flash("Trips created")
              })
              .catch((error) => {
                console.log(error)
                commonModals.alert({
                  title: error.data.error,
                  message: error.data.message
                });
                throw error;
              })
            }
          })())
        },

        addTripStop() {
          this.data.trip.tripStops = this.data.trip.tripStops || [];
          this.data.trip.tripStops.push({
            time: new Date(2015,1,1,8,30,0),
            canBoard: true,
            canAlight: true
          })
        },
        deleteTripStop(index) {
          this.data.trip.tripStops.splice(index, 1)
        }
      }

      scope.tripList = {
        async deleteTrip(trip) {
          if (await commonModals.confirm("Are you sure you want to delete?")) {
            TripsService.deleteTrip(trip.id)
            .then(reloadTrips)
            .catch((error) => {
              console.error(error);
            })
          }
        }
      }

      scope.showCreateTripDialog = async function() {
        const lastSelected = scope.selection.$lastSelected();
        if (lastSelected) {
          scope.currentTrip.takeReference(lastSelected);
        }
        else {
          scope.currentTrip.reset();
        }

        // show the dates
        var childScope = scope.$new();
        var modal = $uibModal.open({
          controller: CreateTripsDateController,
          keyboard: false,
          backdrop: 'static',
          template: require('./createTripsDateTemplate.html'),
          scope: childScope
        })

        try {
          scope.currentTrip.data.newDates = await modal.result;
          console.log(scope.disp.newDates);
        }
        catch (err) {
          // Dismissed without reason
          return;
        }
        finally {
          childScope.$destroy()
        }

        showTripDataEditor();
      }
      scope.showEditTripDialog = async function () {
        scope.currentTrip.edit(scope.selection.$lastSelected());

        showTripDataEditor();
      }

      async function showTripDataEditor() {
        // Loop repeatedly until the save succeeds (to avoid losing data)
        while (true) {
          var childScope = scope.$new();
          var modal = $uibModal.open({
            controller: TripDataEditorController,
            keyboard: false,
            backdrop: 'static',
            template: require('./tripDataEditor.html'),
            scope: childScope,
            windowClass: 'wide-modal'
          })

          try {
            var tripData = await modal.result;
          }
          catch (err) {
            break;
          }

          try {
            await scope.currentTrip.save();
            break;
          }
          catch (err) {
            continue;
          }
          finally {
            childScope.$destroy();
          }
        }
      }

      scope.$watchGroup(['filter.filterMonth', 'route.id'], reloadTrips)

      function defaultTrip() {
        return {
          routeId: scope.route.id,
          transportCompanyId: scope.route.transportCompanyId,
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

function CreateTripsDateController($scope, TripsService) {
  var lastPromise = null;
  var now = new Date();

  $scope.datepicker = {
    highlightDays: [],
    daysAllowed: null,
    month: moment(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()), 'x'
    ).utcOffset(0)
  }

  $scope.monthChanged = function (newMonth) {
    $scope.datepicker.daysAllowed = [];

    var promise = lastPromise = TripsService.getTrips({
      routeId: $scope.route.id,
      startDate: new Date(
        newMonth.year(),
        newMonth.month(),
        1
      ),
      endDate: new Date(
        newMonth.year(),
        newMonth.month() + 1,
        1
      ),
    })
    .then((trips) => {
      if (promise !== lastPromise) return;

      $scope.datepicker.daysAllowed = null;
      // block out the days with trips
      $scope.datepicker.highlightDays = trips.map(
        trip => ({
          date: moment(trip.date),
          css: 'trip-exists',
          selectable: true,
          title: `Trip exists (ID #${trip.id})`
        })
      )
    });
  }
  $scope.monthChanged(moment())
}

function TripDataEditorController($scope) {

}
