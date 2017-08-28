<template>
<modal :name="name" :value="value">
  <div class="modal-header">
    <h3>
      {{route.label}}: {{route.from}} &mdash; {{route.to}}

      <button @click="resolve()" class="btn btn-default">
        <span class="glyphicon glyphicon-remove"></span>
      </button>
    </h3>
  </div>

  <div class="modal-body">
    <select @change="zoomInOnStops" v-model="selectedTrip"
        class="form-control">
      <option v-for="trip in trips" :value="trip">
        {{ f.date(trip.date, 'dd mmm yyyy', true)}}
      </option>
    </select>

    <gmap-map :center="{lat: 1.38, lng: 103.8}" :zoom="12" ref="map" class="view-trips-map">
      <!-- Route path -->
      <gmap-polyline v-if="routePath" :path="routePath" />

      <!-- Pings by other drivers? -->
      <PingPath v-for="(pings, driverId) in pingsByDriverId"
                 :pings="pings"
                 :key="driverId"
                 @click="selectedPing = $event"
      />

      <!-- Trip stops -->
      <template v-if="selectedTrip">
        <TripStopMarker
            v-for="(ts, index) in selectedTrip.tripStops"
            :tripStop="ts"
            :index="index"
            :key="ts.id"
            @click="selectedStop = ts"
          />
      </template>

      <gmap-info-window v-if="selectedStop"
          :position="f.pointToLatLng(selectedStop.stop.coordinates)">
        <div>
          <b>{{selectedStop.stop.description}}</b>
          <br/>
          {{f.date(selectedStop.time, 'HH:MM')}}
        </div>
      </gmap-info-window>

      <gmap-info-window v-if="selectedPing" :position="f.pointToLatLng(selectedPing.coordinates)">
        <div>
          <b>{{f.date(selectedPing.time, 'HH:MM:ss')}}</b>
          <br/>
          Driver Id: #{{selectedPing.driverId}} {{selectedPingDriverVehicle && selectedPingDriverVehicle.driver.name}}
          <br/>
          Vehilcle Id: #{{selectedPing.vehicleId}} {{selectedPingDriverVehicle && selectedPingDriverVehicle.vehicleNumber}}
        </div>
      </gmap-info-window>
    </gmap-map>
  </div>
</modal>
</template>
<script>
import {mapState, mapActions} from 'vuex'
import filters from '../filters'
import _ from 'lodash'

export default {
  props: ['route', 'value'],
  mixins: [
    require('./ModalMixin')
  ],
  data () {
    return {
      routeWithTrips: null,
      selectedTrip: null,
      selectedStop: null,
      selectedPing: null,
      pingsByDriverId: null,
      routePath: null,
    }
  },
  created() {
    this.fetch('vehicles')
  },
  computed: {
    ...mapState(['axios']),
    ...mapState('shared', ['vehicles']),
    f: () => filters,
    routePromise() {
      if (!this.route) return

      return this.getRoute({
        id: this.route.id,
        options: {include_trips: true}
      })
    },
    pingsPromise() {
      if (!this.selectedTrip) return

      return this.getPings({
        tripId: this.selectedTrip.id,
        options: {
          limit: 10000,
          // TODO: flexible time boundaries for night
          startTime: new Date(
            this.selectedTrip.date.getUTCFullYear(),
            this.selectedTrip.date.getUTCMonth(),
            this.selectedTrip.date.getUTCDate()
          ).toISOString(),
          endTime: new Date(
            this.selectedTrip.date.getUTCFullYear(),
            this.selectedTrip.date.getUTCMonth(),
            this.selectedTrip.date.getUTCDate() + 1
          ).toISOString(),
          byTripId: true,
        }
      })
    },
    selectedPingDriverVehicle() {
      if (!this.vehicles || !this.selectedPing) return

      return this.vehicles.find((value) => {
        return value.id === this.selectedPing.vehicleId && value.driverId === this.selectedPing.driverId
      })
    },
    trips () {
      if (!this.routeWithTrips) return

      return _.orderBy(this.routeWithTrips.trips, ['date'], ['desc'])
    },
    routePathPromise () {
      const promise = this.routePromise &&
        this.routePromise.then((route) => {
          const path = route.path

          return typeof path === 'string'
            ? google.maps.geometry.encoding.decodePath(path)
            : path

          return path
        })
      return promise
    }
  },
  watch: {
    routePromise: {
      immediate: true,
      handler(p) {
        if (p) p.then(route => {
          this.routeWithTrips = route
        })
      }
    },
    routePathPromise: {
      immediate: true,
      handler(p) {
        if (p) p.then(path => this.routePath = path)
      }
    },
    pingsPromise: {
      immediate: true,
      handler(p) {
        if (p) p.then((pings) => this.pingsByDriverId = _.groupBy(pings, 'driverId'))
      }
    }
  },
  methods: {
    ...mapActions('resources', ['getRoute', 'getPings']),
    ...mapActions('shared', ['fetch']),
    zoomInOnStops () {
      if (!this.selectedTrip) return

      var bounds = new google.maps.LatLngBounds();
      for (let tripStop of this.selectedTrip.tripStops) {
        bounds.extend({
          lat: tripStop.stop.coordinates.coordinates[1],
          lng: tripStop.stop.coordinates.coordinates[0]
        })
      }
      this.$refs.map.panToBounds(bounds)
    }
  }
}
</script>

<style>
.view-trips-map {
  width: 100%;
  height: 400px;
}
</style>
