<template>
  <line
    :x1="x1"
    :y1="y1"
    :x2="x2"
    :y2="y2"
    :stroke="stroke"
    :stroke-width="strokeWidth"
    :stroke-dasharray="strokeDasharray"
    />
</template>
<script>
export default {
  props: [
    'value',
    'axis',
    'stroke',
    'strokeWidth',
    'strokeDasharray'
  ],
  computed: {
    x1 () {
      return this.graphTransforms.xToPixel(this.value)
    },
    x2 () {
      return this.graphTransforms.xToPixel(this.value)
    },
    y1 () {
      return 0
    },
    y2 () {
      return this.graphTransforms.plotHeight()
    }
  },
  inject: {
    graphTransforms: {},
    dataBus: {}
  },
  mounted () {
    if (this.dataBus) {
      this.dataBus.$on('getXBounds', (b) => {
        b([this.value, this.value])
      })
    }
  }
}

</script>
