<template>
  <!-- Vue-Select is very badly written -->
  <DatasheetCell>
    <div style="min-width: 20em">
      <template v-if="!value">
      </template>
      <template v-else-if="!stopsById[value]">
        <i>Loading...</i>
      </template>
      <template v-else>
        {{stopsById[value].description}}
      </template>
    </div>
    <VueSelect
      slot="editor"
      class="the-editor"
      :value="imputedValue" @input="whatInput"
      :options="stopsAsOption" />
  </DatasheetCell>
</template>
<style>
.the-editor {
  background-color: white;
}
</style>
<script>
import {mapGetters, mapActions, mapState} from 'vuex'

import DatasheetCell from '@/components/DatasheetCell.vue'
import VueSelect from 'vue-select'

export default {
  props: ['value'],
  components: {
    DatasheetCell,
    VueSelect
  },
  created() {
    this.fetch('stops')
  },
  computed: {
    ...mapState('shared', ['stops']),
    ...mapGetters('shared', ['stopsById']),

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
