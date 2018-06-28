<template>
  <text
    :x="rx"
    :y="ry"
    :fill="fill"
    :fontFamily="fontFamily"
    :fontSize="fontSize"
    :textAnchor="textAnchor"
  >
    <slot></slot>
  </text>
</template>

<script>
export default {
  props: [
    'fontSize',
    'fontFamily',
    'fill',
    'x', 'y',
    'axisX1', 'axisY1',
    'axisX2', 'axisY2',
    'textAnchor',
  ],

  computed: {
    rx() {
      return this.graphTransforms.xToPixel(this.x)
    },
    ry() {
      if (this.axisX2 != undefined) {
        return 0 - this.y;
      }
      return this.graphTransforms.yToPixel(this.y);
    },
  },

  inject: {
    graphTransforms: {},
  },
}
</script>
