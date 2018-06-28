<template>
<div>
  <b>Number of trips:</b>
  {{stopsWithValidDates.length}}
  <br/>

  <b>Coverage:</b>
  {{coverage}}%
  <br/>

  <template v-if="stopsWithValidDates.length">
    <b>Average:</b>
    {{averagePunctuality}} mins
    <br/>

    <b>50%:</b>
    &lt; {{percentile50}} mins
    <br/>

    <b>90%:</b>
    &lt; {{percentile90}} mins
    <br/>
  </template>
</div>
</template>

<script>
import _ from 'lodash'

export default {
  props: ['tripStop'],

  computed: {
    stopsWithValidDates () {
      const filtered = this.tripStop.points
        .filter(s =>
          isFinite(s.timeDifference) && s.timeDifference !== null
        )
      return _.sortBy(filtered, 'timeDifference')
    },
    averagePunctuality () {
      const average = this.stopsWithValidDates
        .map(s => s.timeDifference)
        .reduce( (x,y) => x+y, 0 )
          / this.stopsWithValidDates.length
          / 60000

      return average.toFixed(1)
    },
    coverage () {
      return (this.stopsWithValidDates.length / this.tripStop.points.length).toFixed(1)
    },
    percentile50 () {
      return this.latenessPercentile(.5)
    },
    percentile90 () {
      return this.latenessPercentile(.9)
    },
  },

  methods: {
    latenessPercentile (perc) {
      const sorted = this.stopsWithValidDates
        .map(s => s.timeDifference)

      if (sorted.length == 0) {
        return 'n.a.';
      }
      var percIndex = Math.floor(sorted.length * perc);
      return (sorted[percIndex] / 60000).toFixed(1);
    }
  }
}
</script>