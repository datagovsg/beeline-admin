<template>
  <!-- Vue-Select is very badly written -->
  <VueSelect :value="imputedValue" @input="whatInput"
    :options="stopsAsOption" />
</template>
<script>
import {mapGetters, mapActions, mapState} from 'vuex'

export default {
  props: ['value'],
  created() {
    this.fetch('stops')
  },
  computed: {
    ...mapState('shared', ['stops']),

    imputedValue() {
      if (this.stops) {
        const stop = this.stops.find(s => s.id === this.value)
        return {value: this.value, label: _.get(stop, 'description') || '(Unknown)'}
      } else {
        return {value: this.value, label: 'Loading...'}
      }
    },

    stopsAsOption() {
      return this.stops ? this.stops.map(stop => ({
        label: stop.description,
        value: stop.id
      })) : []
    }
  },
  methods: {
    ...mapActions('shared', ['fetch']),

    whatInput ($event) {
      // Vue-Select is very badly written
      if (!$event) {
        this.$emit('input', null)
      } else if ($event.value !== this.value) {
        this.$emit('input', $event.value)
      }
    }
  }
}
</script>
