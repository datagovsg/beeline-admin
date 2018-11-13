<template>
  <div class="path-editor container-fluid">
    <div class="form-inline">
      <label class="control-label">Route Path</label>
      <select @change="zoomInOnStops()" v-model="tripId" class="form-control">
        <option v-for="trip in route.trips" :key="trip.id" :value="trip.id">
          {{f.date(trip.date, 'dd-mmm-yyyy', true)}}
        </option>
      </select>

      <!-- {{trip && trip.tripStops}} -->
    </div>

    <GmapMap class="col-lg-12 map-container" ref="map"
      :center="{lat: 1.38, lng: 103.8}" :zoom="11"
      >
      <GmapMarker v-for="(ts, index) in (trip && trip.tripStops)"
        :position="{
          lat: ts.stop.coordinates.coordinates[1],
          lng: ts.stop.coordinates.coordinates[0],
          }"
        :key="ts.id"
        :icon="makeStopIcon(ts, index)"
        @click="selectedTripStop = ts"
        >
      </GmapMarker>
      <GmapPolyline v-if="currentPath" :path="currentPath" :options="options.currentPathPolyline">
      </GmapPolyline>
      <GmapInfoWindow v-if="selectedTripStop">
        {{ts.stop.description}}
      </GmapInfoWindow>
    </GmapMap>
    <div class="col-lg-12">
      <div class="path-buttons">
        <span class="btn-group">
          <button class="btn btn-default"
            @click="googlePath(trip.tripStops)"
            :disabled="!trip || hasRenderedPath"
            >
            Generate Path
          </button>
        </span>

        <span class="btn-group">
          <button class="btn btn-danger"
            @click="clearRenderers()"
            v-if="hasRenderedPath">
            Reset
          </button>
          <button class="btn btn-primary"
            @click="savePath()"
            v-if="hasRenderedPath">
            Use generated route path
          </button>
        </span>
      </div>
      <textarea class="form-control"
        :value="value"
        @change="$emit('input', $event.target.value)"
        placeholder="Path encoded as polyline"
        rows=8 />
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import * as filters from '@/filters'
const {loaded} = require('vue2-google-maps')
const leftPad = require('left-pad')

export default {
  props: ['route', 'value'],
  data () {
    return {
      tripId: null,
      selectedTripStop: null,
      hasRenderedPath: false,
      options: {
        /* This is the polyline that shows the current path saved in the route */
        currentPathPolyline: {
          strokeColor: '#880000',
          strokeWeight: 2,
          zIndex: 10
        }
      }
    }
  },
  computed: {
    f: () => filters,
    trip () {
      return this.route.trips.find(t => t.id === this.tripId)
    },
    currentPath () {
      // The ordering of this comparison matters, because
      // this computed property must be marked as a reactive
      // dependency of the route path
      if (this.value && typeof google !== 'undefined') {
        try {
          return google.maps.geometry.encoding.decodePath(this.value)
        } catch (e) {
          return null
        }
      }
    }
  },
  created () {
    /* $dirRenderers and $legs are assigned in created() because they
      are complex objects, and we do not want them to be reactive */
    this.$dirRenderers = null
    this.$legs = null

    loaded.then(() => {
      this.$dirService = new google.maps.DirectionsService()
    })
  },
  watch: {
    'route.trips': {
      immediate: true,
      handler (trips) {
        if (trips && trips.length) {
          this.tripId = _.minBy(
            trips,
            trip => Math.abs(new Date(trip.date).getTime() - Date.now())
          ).id
        }
      }
    }
  },
  methods: {
    getConcatenatedPath () {
      return this.$legs && this.$legs.reduce((all, leg) => all.concat(leg))
    },
    savePath () {
      const path = this.getConcatenatedPath()

      this.$emit('input', google.maps.geometry.encoding.encodePath(path))
      this.$dirRenderers.forEach((renderer) => { renderer.setMap(null) })
      this.hasRenderedPath = false
    },
    clearRenderers () {
      this.$dirRenderers.forEach((renderer) => { renderer.setMap(null) })
      this.hasRenderedPath = false
    },

    zoomInOnStops () {
      if (!this.trip || !this.trip.tripStops) return

      const bounds = new google.maps.LatLngBounds()
      for (let tripStop of this.trip.tripStops) {
        bounds.extend({
          lat: tripStop.stop.coordinates.coordinates[1],
          lng: tripStop.stop.coordinates.coordinates[0]
        })
      }
      this.$refs.map.panToBounds(bounds)
    },

    async updateDirections (renderer, origin, destination, waypoints) {
      const request = {
        origin,
        destination,
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        avoidHighways: false,
        avoidTolls: false
      }

      return new Promise((resolve, reject) => {
        this.$dirService.route(request, (result, status) => {
          if (status === google.maps.DirectionsStatus.OK) {
            renderer.setDirections(result)
            setTimeout(resolve, 300)
          } else {
            console.log(status, result)
            reject()
          }
        })
      })
    },

    async googlePath (tripStops) {
      if (!tripStops) return

      const stopsLatLng = tripStops.map((tripStop) => {
        const [lng, lat] = tripStop.stop.coordinates.coordinates
        return new google.maps.LatLng(lat, lng)
      })

      if (this.$dirRenderers) {
        this.$dirRenderers.forEach((renderer) => { renderer.setMap(null) })
      }

      const renderersOriginsDestinations = _.range(0, stopsLatLng.length - 1)
        .map(i => {
          const origin = stopsLatLng[i]
          const destination = stopsLatLng[i + 1]

          const renderer = new google.maps.DirectionsRenderer({
            map: this.$refs.map.$mapObject,
            draggable: true,
            markerOptions: {icon: 'https://maps.gstatic.com/mapfiles/dd-via.png'},
            polylineOptions: {
              strokeWeight: 4,
              strokeColor: '#4b3863',
              zIndex: 20
            },
            preserveViewport: true
          })

          let lastOrigin = origin; let lastDestination = destination

          renderer.addListener('directions_changed', () => {
            // When directions are changed, if they are connected to other
            // directions renderers, the others have to be updated too
            const directions = renderer.getDirections()
            let {origin: currentOrigin, destination: currentDestination} = directions.request

            // currentOrigin can be a string | latlng | latlngliteral | place...
            if (currentOrigin.location) currentOrigin = currentOrigin.location
            if (currentDestination.location) currentDestination = currentDestination.location

            // Save the updated leg in our legs array
            this.$legs[i] = directions.routes[0].overview_path

            // Update the neighbouring direction renderers if necessary
            const prevLegNeedsUpdate = i > 0 && currentOrigin !== lastOrigin
            const nextLegNeedsUpdate = i < stopsLatLng.length - 1 && currentDestination !== lastDestination

            if (prevLegNeedsUpdate) {
              // Origin different -- update the previous leg too
              lastOrigin = currentOrigin
              const directions = this.$dirRenderers[i - 1].getDirections()

              // Directions may be undefined
              this.updateDirections(this.$dirRenderers[i - 1],
                directions ? directions.origin : this.$legs[i - 1].origin,
                currentOrigin,
                directions ? directions.waypoints : [])
            }

            if (nextLegNeedsUpdate) {
              // Destination different -- update the next leg too
              lastDestination = currentDestination
              const directions = this.$dirRenderers[i + 1].getDirections()

              // Directions may be undefined
              this.updateDirections(this.$dirRenderers[i + 1],
                currentDestination,
                directions ? directions.destination : this.$legs[i + 1].destination,
                directions ? directions.waypoints : [])
            }
          })
          return {renderer, origin, destination}
        })

      renderersOriginsDestinations
        // Trigger the initial directions rendering
        .reduce(
          (acc, {renderer, origin, destination}) =>
            acc.then(() => this.updateDirections(renderer, origin, destination)),
          Promise.resolve(null)
        )

      // save the renderers for future reference
      this.$dirRenderers = renderersOriginsDestinations.map(x => x.renderer)

      // generate the initial legs
      this.$legs = renderersOriginsDestinations.map(
        ({origin, destination}) => [origin, destination]
      )

      this.hasRenderedPath = true
    },

    makeStopIcon (tripStop, index) {
      if (typeof google !== 'undefined') {
        return {
          scaledSize: new google.maps.Size(30, 30),
          anchor: new google.maps.Point(15, 15),
          url: `img/stop${tripStop.canBoard ? 'Board' : 'Alight'}${leftPad(index + 1, 3, '0')}.png`
        }
      }
    }
  }
}
</script>

<style lang="scss">
.path-editor {
  .map-container {
    height: 400px;
  }
  .path-buttons {
    margin: 1em 0;
    .btn-default{
      margin-right: 10px;
    }
  }
}
</style>
