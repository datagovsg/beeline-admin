<template>
  <table>
    <thead>
      <tr>
        <th>Stop</th>
        <th>Graph</th>
        <th>Stats</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="tripStop in stops" :key="tripStop.stopId"
        :class="{
          'not-boarding-stop': !tripStop.canBoard
        }">
        <td>
          {{tripStop.description}}
          <br>{{f.date(tripStop.expectedTime, 'HH:MM')}}
        </td>
        <td>
          <PunctualityGraphWithMissingDates
            :tripStop="tripStop"
            @date-selected="selectedDate = $event"
            :selectedDate="selectedDate"
            />
        </td>
        <td style="min-width: 170px">
          <StopStatistics
            :tripStop="tripStop" />
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script>
import PunctualityGraphWithMissingDates from './PunctualityGraphWithMissingDates.vue'
import StopStatistics from './StopStatistics.vue'

import filters from '@/filters'

export default {
  props: ['trips'],

  components: {
    PunctualityGraphWithMissingDates,
    StopStatistics
  },

  data () {
    return {
      selectedDate: null,
    }
  },

  computed: {
    f: () => filters,
    stops () {
      if (!this.trips) return []

      // Process the results to produce the list of stops...
      let tripStops = _(this.trips)
        .map(t => {
          // annotate the stops with the routeId because it
          // won't be available after flattening
          t.stops.forEach(s => {
            s.routeId = t.routeId
            s.tripId = t.tripId
          })
          return t.stops
        })
        .flatten()
        .value()

      // Group the stops by their stopId and time
      let makeKey = (t) =>
        `${t.stopId}, ${t.expectedTime.getHours()}, ${t.expectedTime.getMinutes()}`

      let stopsByKey = _.groupBy(tripStops, makeKey)
      // Extract details by taking the first element
      let stopDetails = _.values(stopsByKey).map(stops => {
        const ts = stops[0]
        return {
          ...ts,
          points: stops.map(stop => ({
            ...stop,
            timeDifference: stop.actualTime &&
              (stop.actualTime.getTime() - stop.expectedTime.getTime()),
          }))
        }
      })

      return _.sortBy(
        stopDetails,
        s => {
          var d = s.expectedTime
          return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
        })
    }
  }
}
</script>

<style lang="scss" scoped>
tr.not-boarding-stop td {
  background-color: #F8F;
}
</style>