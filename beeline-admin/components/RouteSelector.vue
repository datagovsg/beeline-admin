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
import querystring from 'querystring'
const filters = require('../filters')

export default {
  props: ['value', 'multiple', 'companyId', 'startDate', 'endDate'],
  data () {
    return {
      routes: null
    }
  },
  created () {
    this.fetch('currentRoutes')
  },
  computed: {
    ...mapState('shared', ['currentRoutes', 'promises']),
    filteredRoutes () {
      return (this.routes || [])
            .filter(r => !this.companyId ||
              r.transportCompanyId === this.companyId)
    },
    sortedRoutes () {
      return [{ name: "(select)" }].concat(
        _.sortBy(this.filteredRoutes, 'label')
      )
    },
    allRouteIds () {
      return this.filteredRoutes.map(r => r.id)
    },

    routePromise () {
      if (!this.startDate && !this.endDate) {
        return this.promises.currentRoutes &&
          this.promises.currentRoutes.then(() => this.currentRoutes)
      } else {
        const query = {
          includePath: false,
        }
        if (this.startDate) query.startDate = this.startDate.getTime()
        if (this.endDate) query.endDate = this.endDate.getTime()
        if (this.companyId) query.transportCompanyId = this.companyId

        return this.getRoutes(query)
      }
    }
  },
  watch: {
    routePromise: {
      immediate: true,
      handler (p) {
        if (p) {
          p.then((d) => this.routes = d)
        }
      }
    }
  },
  methods: {
    ...mapActions('shared', ['fetch']),
    ...mapActions('resources', ['getRoutes']),
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
