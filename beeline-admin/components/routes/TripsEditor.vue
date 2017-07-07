<template>
  <div class="container-fluid">
    <div class="date-filter-popup">
      <div class="row">
        <div class="col-lg-4 pull-left">
          <div class="row">
            <div class="col-lg-6 text-left">
              <h4>Show trips for the month of</h4>
            </div>
            <div class="col-lg-4 pull-left form-inline">
              <MonthPickerDropdown v-model="filter.filterMonth" />
            </div>
          </div>
        </div>
        <div class="col-lg-6 pull-right text-right">
          <h3 class="text-danger dates-selected">{{selection.length}} trip(s) selected</h3>
          <button class="btn btn-default edit-trip-button" @click="showEditTripDialog()"
            :disabled="!selection.length">
            Edit Selected Trips
          </button>
          <button class="btn btn-primary create-trip-button" @click="showCreateTripDialog()">
            Create new trips
          </button>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-lg-12">
        <div class="table-responsive">
          <MultiSelectBroker ref="multiSelect" :collection="trips"
              @toggle="$event.forEach(s => s._selected = !s._selected)"
              @set="trips.forEach(s => s._selected = false); $event.forEach(s => s._selected = true)"
             />

          <table class="table table-striped trips-list">
            <thead>
              <tr>
                <th></th>  <!-- radio and index-->
                <th></th>  <!-- trip ID -->
                <th></th>  <!--date -->
                <th></th>  <!-- pax -->
                <th></th>  <!-- booked -->
                <th></th>  <!-- price -->
                <th></th>  <!--trip status -->
                <th></th>  <!-- driver -->
                <th :colspan="stopsList.length">Stops</th>
                <th></th> <!-- actions (delete, use) -->
              </tr>
              <tr>
                <th class="radio-column">
                  <button class="btn btn-default btn-sm"
                    @click="trips.forEach(t => t._selected = true)">
                    Select all
                  </button>
                </th> <!-- radio -->
                <th>Trip ID</th>
                <th>Date</th>
                <th>Status</th>
                <th>Cap</th>
                <th>Booked</th>
                <th>Price</th>
                <th>Driver</th>
                <th v-for="stop in stopsList"
                    class="stop-text"
                    :title="stop.stop.description">
                  {{stop.stop.description}}
                </th>
                <th>Delete<br />Trip
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(trip, index) in trips"
                  :key="trip.id"
                  :class="{
                    selected: trip._selected,
                  }">
                <td @mousedown="$refs.multiSelect.mousedown($event, index)">
                  <input type="checkbox" v-model="trip._selected"
                    @mousedown.prevent />
                  <span class="trip-index">{{index + 1}}</span>
                </td>
                <td>
                  <small>{{trip.id}}</small>
                </td>
                <td>
                  {{f.date(trip.date, 'dd/mm/yy ddd')}}
                </td>
                <td>
                  <span class="label trip-normal"
                      v-if="trip.isRunning">Normal</span>
                  <span class="label trip-void"
                      v-if="trip.status == 'void'">Void</span>
                  <span class="label trip-cancelled"
                      v-if="trip.status == 'cancelled'">Cancelled</span>
                </td>
                <td>
                  {{trip.capacity}}
                  <i class="glyphicon glyphicon-user"></i>
                </td>
                <td>
                  <a :href="`#/c/${companyId}/bookings?tripId=${trip.id}`">
                    {{trip.availability.seatsBooked}}
                    <i class="glyphicon glyphicon-user"></i>
                  </a>
                </td>
                <td>
                  {{trip.price}}
                </td>
                <td>
                </td>
                <td v-for="stop in stopsList">
                  <StopDisplay :stop="findStop(trip, stop.stopId, stop.orderOfAppearance)"/>
                </td>
                <td>
                  <button class="btn btn-danger btn-icon" @click="tripList.deleteTrip(trip)">
                    <span class="glyphicon glyphicon-trash" aria-hidden="true"></span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {mapGetters, mapActions, mapState} from 'vuex'
import * as resources from '../../shared/resources'
import {timeSinceMidnight} from '../../shared/filters';
const filters = require('../../filters')

const updatableFields = [
  'driverId', 'capacity', 'companyId', 'price',
  'bookingInfo', 'status'
];
const updatableTripStopFields = [
  'canBoard', 'canAlight', 'time', 'stopId'
]
const creatableFields = updatableFields.concat([
  'routeId'
])
const creatableTripStopFields = updatableTripStopFields

export default {
  props: ['route', 'companyId'],
  data() {
    return {
      filter: {
        filterMonth: new Date(),
      },
      routePromise: Promise.resolve(null),
      editRoute: null,
    }
  },
  components: {
    StopDisplay: require('./TripStopDisplay.vue'),
    MultiSelectBroker: require('../MultiSelectBroker'),
  },
  computed: {
    ...mapGetters(['axios']),
    f: () => filters,
    stopsList() {
      if (!this.trips) return []

      const stopsSet = {};

      for (let trip of this.trips) {
        const tsSet = _.groupBy(trip.tripStops, 'stopId');

        _.mapValues(tsSet, (tripStops, stopId) => {
          tripStops.forEach((tripStop, index) => {
            stopsSet[tripStop.stopId] = stopsSet[tripStop.stopId] || [];
            stopsSet[tripStop.stopId][index] = stopsSet[tripStop.stopId][index]
              || tripStop;
          })
        })
      }

      return _(stopsSet)
        .values()
        .flatten()
        .sortBy(s => timeSinceMidnight(s.time))
        .value()
    },
    trips() {
      return this.editRoute && _.sortBy(this.editRoute.trips, 'date')
    },
    selection() {
      return (this.trips && this.trips.filter(t => t._selected)) || []
    }
  },
  watch: {
    'route.id': {
      immediate: true,
      handler (promise) {
        this.requery()
      }
    },
    routePromise: {
      immediate: true,
      handler (promise) {
        this.spinOnPromise(promise.then(route => {
          this.editRoute = route
        }))
      }
    },
  },
  methods: {
    ...mapActions('resources', ['getRoute', 'saveRoute', 'createTripForDate']),
    ...mapActions('spinner', ['spinOnPromise']),
    ...mapActions('modals', ['showModal']),

    doSaveRoute() {
      this.spinWatch(this.saveRoute(this.editRoute))
    },
    doResetRoute() {
      this.editRoute = blankRoute()
    },
    doDeleteRoute() {
      if (!this.editRoute.id) return

      this.showModal({

      })
      .then((confirm) => {
        if (confirm) {
          return this.spinWatch(this.editRoute = this.axios.delete(`/routes/${this.route.id}`))
        }
      })
    },

    requery () {
      if (!this.route) {
        this.routePromise = Promise.resolve(null)
      } else {
        this.routePromise = this.getRoute({
          id: this.route.id,
          options: {
            start_date: new Date(
              this.filter.filterMonth.getFullYear(),
              this.filter.filterMonth.getMonth(),
              1,
            ).toISOString(),

            end_date: new Date(
              this.filter.filterMonth.getFullYear(),
              this.filter.filterMonth.getMonth() + 1,
              1
            ).toISOString(),

            include_trips: true,
          }
        })
        .then((route) => {
          route.trips.forEach((trip) => {
            const tsSet = _.groupBy(trip.tripStops, 'stopId');

            trip._selected = false

            _.values(tsSet).forEach((tripStopsInSet) => {
              tripStopsInSet.forEach((tripStop, index) => {
                tripStop.orderOfAppearance = index
              })
            })
          })
          return route
        })
      }
    },

    findStop (trip, stopId, ooA) {
      const stop = trip.tripStops
        .find(ts => ts.stopId === stopId && ts.orderOfAppearance === ooA);
      return stop
    },

    /**
      Updates an existing trip with the trip data, preserving as much as
      possible the original trip stops.
     **/
    updateTrip(trip, tripData) {

      const adaptedData = {
        ..._.pick(tripData, updatableFields),
        tripStops: assignTripStopIds(trip.date, trip.tripStops, tripData.tripStops)
      }

      return this.axios.put(
        `/trips/${trip.id}`,
        adaptedData
      )
    },

    showEditTripDialog() {
      this.showModal({
        component: 'TripEditor',
        props: {
          createNew: false,
          editedTrips: this.selection,
          referenceTrip: this.selection[0],
        }
      })
      .then((tripData) => {
        this.spinOnPromise(
          Promise.all(this.selection.map(trip => this.updateTrip(trip, tripData)))
          .then(() => this.requery())
        )
        .then(() => {
          return this.showModal({
            component: 'CommonModals',
            props: {
              type: 'flash',
              message: 'Trips updated',
            }
          })
        })
        .catch((error) => {
          return this.showModal({
            component: 'CommonModals',
            props: {
              type: 'alert',
              message: error.message
            }
          })
        })
      })
    },

    showCreateTripDialog() {

    }
  }
}
function combineDateTime(utcDate, time) {
  return new Date(
    utcDate.getUTCFullYear(),
    utcDate.getUTCMonth(),
    utcDate.getUTCDate(),
    time.getHours(),
    time.getMinutes(),
    time.getSeconds()
  )
}

function assignTripStopIds (date, original, reference) {
  //
  var referenceStops = _(reference)
    // clone the tripStops because we'll be mutating them with an id
    .map(ts => {
      var update = _.pick(ts, updatableTripStopFields);
      update.time = combineDateTime(date, ts.time).getTime();
      return update;
    })
    .groupBy('stopId')
    .value();

  //
  var originalStops = _(original)
    .groupBy('stopId')
    .value();

  // Give the reference stops an id
  // For now, match old and new by order of appearance
  // TODO: more intelligent matching
  _.each(referenceStops, (tss, stopId) => {
    _.each(tss, (ts, index) => {
      if (originalStops[stopId] && originalStops[stopId][index]) {
        ts.id = originalStops[stopId][index].id;
      }
      else {
        ts.id = null
      }
    })
  })

  return _.flatten(_.values(referenceStops));
};
</script>
