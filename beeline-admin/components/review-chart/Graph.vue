<template>
  <svg
    :width="plotWidth + axisWidth1 + axisWidth2 + excessWidth"
    :height="plotHeight + axisHeight1 + axisHeight2 + excessHeight"
    >

    <g :transform="plotTransform">
      <rect :width="plotWidth"
          :height="plotHeight"
          x="0" y="0"
          :fill="backgroundColor" />
      <slot></slot>
    </g>
  </svg>
</template>

<script>
import _ from 'lodash'
import Vue from 'vue'

export default {
  props: {
    plotWidth: {
      default: 0,
      type: Number
    },
    plotHeight: {
      default: 1,
      type: Number
    },
    paddingWidth: {
      default: 0,
      type: Number
    },
    paddingHeight: {
      default: 0,
      type: Number
    },
    axisWidth1: {
      default: 0,
      type: Number
    },
    axisHeight1: {
      default: 1,
      type: Number
    },
    axisWidth2: {
      default: 0,
      type: Number
    },
    axisHeight2: {
      default: 1,
      type: Number
    },
    excessWidth: {
      default: 0,
      type: Number
    },
    excessHeight: {
      default: 0,
      type: Number
    },
    backgroundColor: {
      default: '#FFF',
      type: String
    },

    defaultDataBounds: {
      type: Array,
      default: null
    }
  },

  data () {
    return {
      dataBounds: [
        [0, 0],
        [1, 1]
      ]
    }
  },

  computed: {
    /** The transform for the plot area **/
    plotTransform () {
      return `translate(${this.axisWidth1}, ${this.axisHeight2})`
    }
  },

  provide () {
    return {
      graphTransforms: {
        xToPixel: (xvalue) =>
          (xvalue - this.dataBounds[0][0]) /
          (this.dataBounds[1][0] - this.dataBounds[0][0]) *
          (this.plotWidth - 2 * this.paddingWidth) + this.paddingWidth,
        yToPixel: (yvalue) =>
          (yvalue - this.dataBounds[0][1]) /
          (this.dataBounds[1][1] - this.dataBounds[0][1]) *
          (this.plotHeight - 2 * this.paddingHeight) + this.paddingHeight,
        plotHeight: () => this.plotHeight
      },
      dataBus: (this.dataBus = new Vue({}))
    }
  },

  created () {
    if (this.defaultDataBounds) {
      this.dataBounds = this.defaultDataBounds
    }
  },

  methods: {
    /**
     * asks components sharing the databus for their
     * min and max coordinates
     */
    scaleToFit (options) {
      const xcoords = []; const ycoords = []
      this.dataBus.$emit('getXBounds', (coord) => {
        xcoords.push(coord)
      })
      this.dataBus.$emit('getYBounds', (coord) => {
        ycoords.push(coord)
      })

      if (xcoords.length === 0) {
        xcoords.push([0, 1])
      }
      if (ycoords.length === 0) {
        ycoords.push([0, 1])
      }

      const lowerBoundX = _.minBy(xcoords.map(x => x[0]))
      const upperBoundX = _.maxBy(xcoords.map(x => x[1]))
      const lowerBoundY = _.minBy(ycoords.map(x => x[0]))
      const upperBoundY = _.maxBy(ycoords.map(x => x[1]))

      this.dataBounds = [
        [lowerBoundX, lowerBoundY],
        [
          (upperBoundX === lowerBoundX) ? lowerBoundX + 0.00001 : upperBoundX,
          (upperBoundY === lowerBoundY) ? lowerBoundY + 0.00001 : upperBoundY
        ]
      ]
    }
  }

}

</script>
