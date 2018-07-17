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
              <MonthPickerDropdown v-model="filter.filterMonth" :offset="0" />
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
                    :key="stop.id"
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
                <td v-for="stop in stopsList"
                    :key="stop.id">
                  <StopDisplay :stop="findStop(trip, stop.stopId, stop.orderOfAppearance)"/>
                </td>
                <td>
                  <!-- TODO: no deleteTrip -->
                  <button class="btn btn-danger btn-icon" @click="deleteTrip(trip)">
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
import _ from 'lodash'
import {mapGetters, mapActions} from 'vuex'
import assert from 'assert'
import {timeSinceMidnight} from '../../shared/filters'
const filters = require('../../filters')

import MonthPickerDropdown from '@/components/MonthPickerDropdown.vue'
import MultiSelectBroker from '@/components/MultiSelectBroker'
import StopDisplay from '@/components/routes/TripStopDisplay.vue'

const UPDATABLE_FIELDS = [
  'driverId', 'capacity', 'companyId', 'price',
  'bookingInfo', 'status'
]
const UPDATABLE_TRIP_STOP_FIELDS = [
  'canBoard', 'canAlight', 'time', 'stopId'
]
const CREATABLE_FIELDS = UPDATABLE_FIELDS.concat([
  'routeId'
])

export default {
  props: ['route', 'companyId'],
  data () {
    return {
      filter: {
        filterMonth: null
      },
      editRoute: null
    }
  },
  components: {
    StopDisplay,
    MultiSelectBroker,
    MonthPickerDropdown
  },
  computed: {
    ...mapGetters(['axios']),
    f: () => filters,
    stopsList () {
      if (!this.trips) return []

      const stopsSet = {}

      for (let trip of this.trips) {
        const tsSet = _.groupBy(trip.tripStops, 'stopId')

        _.mapValues(tsSet, (tripStops, stopId) => {
          tripStops.forEach((tripStop, index) => {
            stopsSet[tripStop.stopId] = stopsSet[tripStop.stopId] || []
            stopsSet[tripStop.stopId][index] = stopsSet[tripStop.stopId][index] ||
              tripStop
          })
        })
      }

      return _(stopsSet)
        .values()
        .flatten()
        .sortBy(s => timeSinceMidnight(s.time))
        .value()
    },
    trips () {
      return this.editRoute && _.sortBy(this.editRoute.trips, 'date')
    },
    selection () {
      return (this.trips && this.trips.filter(t => t._selected)) || []
    }
  },
  watch: {
    'route.id': {
      immediate: true,
      handler (promise) {
        this.spinOnPromise(this.requery())
      }
    },
    'filter': {
      immediate: true,
      deep: true,
      handler (promise) {
        this.spinOnPromise(this.requery())
      }
    }
  },
  methods: {
    ...mapActions('resources', ['getRoute', 'saveRoute', 'createTripForDate']),
    ...mapActions('spinner', ['spinOnPromise']),
    ...mapActions('modals', ['showModal', 'showErrorModal']),

    doSaveRoute () {
      this.spinOnPromise(this.saveRoute(this.editRoute))
    },
    doDeleteRoute () {
      if (!this.editRoute.id) return

      this.showModal({

      })
        .then((confirm) => {
          if (confirm) {
            return this.spinOnPromise(this.editRoute = this.axios.delete(`/routes/${this.route.id}`))
          }
        })
    },

    requery () {
      if (!this.route) {
        return Promise.resolve(null)
      }
      const filterDatePromise = (this.filter.filterMonth !== null)
        ? Promise.resolve(this.filter.filterMonth)
        : this.getRoute({
          id: this.route.id,
          options: {
            includeTrips: false,
            includeDates: true
          }
        })
          .then((route) => {
            const d = new Date()
            const todaysDate = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())

            if (route.dates.firstDate && route.dates.lastDate) {
              if (todaysDate < route.dates.firstDate.getTime()) {
                return route.dates.firstDate
              } else if (route.dates.lastDate.getTime() < todaysDate) {
                return route.dates.lastDate
              } else {
                return new Date(todaysDate)
              }
            }
          })

      const promise = this.$routePromise = filterDatePromise.then((filterDate) => {
        return this.getRoute({
          id: this.route.id,
          options: {
            startDate: new Date(
              filterDate.getUTCFullYear(),
              filterDate.getUTCMonth(),
              1,
            ).toISOString(),

            endDate: new Date(
              filterDate.getUTCFullYear(),
              filterDate.getUTCMonth() + 1,
              1
            ).toISOString(),

            includeTrips: true
          }
        })
          .then((route) => {
            if (promise !== this.$routePromise) { return }

            route.trips.forEach((trip) => {
              const tsSet = _.groupBy(trip.tripStops, 'stopId')

              trip._selected = false

              Object.values(tsSet).forEach((tripStopsInSet) => {
                tripStopsInSet.forEach((tripStop, index) => {
                  tripStop.orderOfAppearance = index
                })
              })
            })

            this.filter.filterMonth = filterDate
            this.editRoute = route
          })
      })
      return promise
    },

    findStop (trip, stopId, ooA) {
      const stop = trip.tripStops
        .find(ts => ts.stopId === stopId && ts.orderOfAppearance === ooA)
      return stop
    },

    /**
      Updates an existing trip with the trip data, preserving as much as
      possible the original trip stops.
     **/
    updateTrip (trip, tripData) {
      const adaptedData = {
        ..._.pick(tripData, UPDATABLE_FIELDS),
        tripStops: assignTripStopIds(trip.date, trip.tripStops, tripData.tripStops)
      }

      return this.axios.put(
        `/trips/${trip.id}`,
        adaptedData
      )
    },

    deleteTrip (trip) {
      this.showModal({
        component: 'CommonModals',
        props: {
          type: 'confirm',
          title: 'Delete trip',
          message: 'Are you sure you want to delete this trip?'
        }
      })
        .then((confirm) => {
          if (confirm) {
            return this.axios.delete(
              `/trips/${trip.id}`
            )
          }
        })
        .then(() => {
          this.spinOnPromise(this.requery())
          return this.showModal({
            component: 'CommonModals',
            props: {
              type: 'flash',
              message: 'Trips deleted'
            }
          })
        })
        .catch(this.showErrorModal)
    },

    showEditTripDialog () {
      this.showModal({
        component: 'TripEditor',
        props: {
          createNew: false,
          editedTrips: this.selection,
          referenceTrip: this.selection[0]
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
                  message: 'Trips updated'
                }
              })
            })
            .catch(this.showErrorModal)
        })
    },

    async showCreateTripDialog () {
      const tripDates = await this.showModal({
        component: 'CreateTripsDatePicker',
        props: {
          selectOnTrips: false,
          route: this.editRoute,
          message: 'Select the dates on which to create trips'
        }
      })

      const tripData = await this.showModal({
        component: 'TripEditor',
        props: {
          referenceTrip: this.selection[0],
          createNew: true,
          newTripDates: tripDates
        }
      })

      const createData = tripDates.map((date) => {
        // must be round...
        assert.equal(date.getTime() % (24 * 3600 * 1000), 0)

        return {
          ..._.pick(tripData, CREATABLE_FIELDS),
          routeId: this.route.id,
          date: date.toISOString(),
          tripStops: tripData.tripStops.map(ts => ({
            ..._.pick(ts, ['stopId', 'canBoard', 'canAlight']),
            time: combineDateTime(date, ts.time).toISOString()
          }))
        }
      })

      try {
        await this.spinOnPromise(
          Promise.all(createData.map(d => this.axios.post(
            '/trips',
            d
          )))
        )

        await this.showModal({
          component: 'CommonModals',
          props: {
            type: 'flash',
            message: 'Trips created'
          }
        })

        await this.spinOnPromise(this.requery())
      } catch (error) {
        await this.showErrorModal(error)
      }
    }
  }
}
function combineDateTime (utcDate, time) {
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
      var update = _.pick(ts, UPDATABLE_TRIP_STOP_FIELDS)
      update.time = combineDateTime(date, ts.time).getTime()
      return update
    })
    .groupBy('stopId')
    .value()

  //
  var originalStops = _(original)
    .groupBy('stopId')
    .value()

  // Give the reference stops an id
  // For now, match old and new by order of appearance
  // TODO: more intelligent matching
  _.each(referenceStops, (tss, stopId) => {
    _.each(tss, (ts, index) => {
      if (originalStops[stopId] && originalStops[stopId][index]) {
        ts.id = originalStops[stopId][index].id
      } else {
        ts.id = null
      }
    })
  })

  return _.flatten(_.values(referenceStops))
};
</script>
