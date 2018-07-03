<template>
  <g :transform="plotTransform">
    <rect   x="-1" y="-1"
        width="2" height="2"
        opacity="0.01"
        fill="#000"
        @click='emitEvent("click", $event)'
        @mouseover='emitEvent("mouseover", $event)'
        @mouseout='emitEvent("mouseout", $event)'
        />

    <line   x1="-1" y1="-1"
        x2="1"  y2="1"
        :stroke="color"
        stroke-width=".5"
        @click='emitEvent("click", $event)'
        @mouseover='emitEvent("mouseover", $event)'
        @mouseout='emitEvent("mouseout", $event)'
        class="graph-point"
        />
    <line   x1="-1" y1="1"
        x2="1"  y2="-1"
        :stroke="color"
        stroke-width=".5"
        @click='emitEvent("click", $event)'
        @mouseover='emitEvent("mouseover", $event)'
        @mouseout='emitEvent("mouseout", $event)'
        class="graph-point"
        ></line>
  </g>
</template>

<script>
export default {
  props: {
    value: {
      default: 0,
      type: Number
    },
    yvalue: {
      default: 0,
      type: Number
    },
    size: {
      default: 10,
      type: Number
    },
    color: {},
  },

  computed: {
    plotTransform() {
      return `translate(${this.x}, ${this.y}) ` +
        `scale(${this.size}, ${this.size}) `
    },

    x() {
      return this.graphTransforms.xToPixel(this.value)
    },

    y() {
      return this.graphTransforms.yToPixel(this.yvalue);
    },
  },

  inject: {
    graphTransforms: {},
    dataBus: {}
  },

  methods: {
    emitEvent(evtName, evtObject) {
      this.$emit(evtName, {
        value: this.value,
        vm: this,
        event: evtObject,
      });
    },
  },

  mounted () {
    this.dataBus.$on('getXBounds', (b) => { b([this.value, this.value]) })
    this.dataBus.$on('getYBounds', (b) => { b([this.yvalue, this.yvalue]) })
  }
}
</script>
