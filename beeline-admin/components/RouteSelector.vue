<template>
  <select
    :multiple="multiple"
    @input="emitValue($event.target)">
    <option v-for="route in sortedRoutes" :value="route.id"
        :selected="isSelected(route.id)">
      {{route.label}} {{route.name}}
    </option>
  </select>
</template>

<script>
import {mapGetters, mapActions, mapState} from 'vuex'
import * as resources from '../stores/resources'
import _ from 'lodash'
const filters = require('../filters')

export default {
  props: ['value', 'multiple', 'companyId'],
  created () {
    this.fetch('currentRoutes')
  },
  computed: {
    ...mapState('shared', ['currentRoutes']),
    sortedRoutes () {
      return [{ name: "(select)" }].concat(
        _.sortBy((this.currentRoutes || []).filter(r => r.transportCompanyId === this.companyId), 'label')
      )
    },
    allRouteIds () {
      return (this.currentRoutes || []).filter(r => r.transportCompanyId === this.companyId).map(r => r.id)
    },
  },
  methods: {
    ...mapActions('shared', ['fetch']),
    emitValue(el) {
      if (this.multiple) {
        const values = []

        for (let i=0; i<el.options.length; i++) {
          if (el.options[i].selected) {
            values.push(parseInt(el.options[i].value))
          }
        }

        this.$emit('input', values)
      } else {
        this.$emit('input', el.value)
      }
    },
    isSelected(rid) {
      if (this.multiple) {
        // FIXME slow
        return this.value.findIndex(r => r == rid) !== -1
      } else {
        return this.value == rid
      }
    }
  }
}
</script>
