
<template>
  <Graph
    :plot-width="plotWidth"
    :plot-height="plotHeight"
    :excess-width="50"
    :axis-height2="20"
    :min="min"
    :max="max"
    :backgroundColor="backgroundColor"
    :paddingHeight="20"
    :paddingWidth="20"
    ref="graph"
  >
    <GraphPoint
      v-for="(p, index) in pointsWithPunctuality"
      :key="index"
      :value="p.timeDifference / 60000"
      :yvalue="index"
      :color="(selectedDate == p.date) ? '#FF0000' : '#009900'"
      :size="4"
      @click="selectPoint(p)"
      @mouseover="showLabel(p)"
      @mouseout="hideLabel(p)"
      >
    </GraphPoint>
    <ReferenceLine
      :axis="1"
      :value="0"
      stroke="#000000"
      stroke-width="1"
    >
    </ReferenceLine>
    <ReferenceLine
      :axis="1"
      :value="5"
      stroke="#666666"
      stroke-width="1"
      stroke-dasharray='2,2'
    >
    </ReferenceLine>
    <ReferenceLine
      :axis="1"
      :value="10"
      stroke="#666666"
      stroke-width="1"
      stroke-dasharray='2,2'
    >
    </ReferenceLine>
    <ReferenceLine
      :axis="1"
      :value="15"
      stroke="#FF0000"
      stroke-width="1"
    >
    </ReferenceLine>

    <!-- above the hovered point -->
    <GraphLabel
      v-if="hoverPoint"
      :x="hoverPoint.timeDifference / 60000"
      :y="0.0"
      dy="-14px"
      fill="#000000"
      font-family="sans-serif"
      font-size="14px"
      text-anchor="middle"
    >
      {{pointLabel(hoverPoint)}}
    </GraphLabel>
    <GraphLabel
      v-if="hoverPoint"
      :x="hoverPoint.timeDifference / 60000"
      :y="0"
      dy="-28px"
      fill="#000000"
      font-family="sans-serif"
      font-size="14px"
      text-anchor="middle"
    >
      {{pointLabel2(hoverPoint)}}
    </GraphLabel>

    <!-- x axis ticks -->
    <GraphLabel
      axis-x2=""
      :x="0"
      :y="2"
      fill="#000000"
      font-family="sans-serif"
      font-size="14px"
      text-anchor="middle"
    >
      {{f.date(tripStop.actualTime, 'HH:MM')}}
    </GraphLabel>
    <GraphLabel
      axis-x2=""
      :x="15"
      :y="2"
      fill="#000000"
      font-family="sans-serif"
      font-size="14px"
      text-anchor="middle"
    >
      +15min
    </GraphLabel>

  </Graph>
</template>

<style>
.graph-point {
  cursor: pointer;
}
</style>

<script>

import Graph from './Graph.vue'
import ReferenceLine from './ReferenceLine.vue'
import GraphPoint from './GraphPoint.vue'
import GraphLabel from './GraphLabel.vue'

import filters from '@/filters'

export default {
  props: [
    'plotWidth',
    'plotHeight',
    'min',
    'max',
    'backgroundColor',
    'selectedDate',
    'tripStop'
  ],
  components: {
    Graph, GraphPoint, GraphLabel, ReferenceLine
  },
  data () {
    return {
      hoverPoint: null
    }
  },
  computed: {
    f: () => filters,
    pointsWithPunctuality () {
      return this.tripStop.points.filter(p => p.actualTime)
    }
  },

  watch: {
    points: {
      immediate: true,
      handler () {
        if (this.$refs['graph']) {
          this.$refs['graph'].scaleToFit()
        }
      }
    }
  },

  mounted () {
    this.$refs['graph'].scaleToFit()
  },

  methods: {
    selectPoint (p) {
      this.$emit('date-selected', p.date)
    },
    showLabel (p) {
      this.hoverPoint = p
    },
    hideLabel (p) {
      this.hoverPoint = null
    },

    pointLabel (pt) {
      if (pt == null) return null
      return filters.date(pt.date, 'dd mmm yyyy')
    },
    pointLabel2 (pt) {
      if (!pt || !pt.actualTime) return

      let timeDifference = pt.timeDifference
      return (timeDifference / 60000).toFixed(1) + 'mins'
    }
  }
}

</script>
