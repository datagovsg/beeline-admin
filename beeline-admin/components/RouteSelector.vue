<template>
  <Select2
    :value="value"
    @input="emitValue"
    @text-input="updateSearch"
    :options="sortedFilteredQueriedRoutes"
    :persistAfterSelect="multiple"
  >
    <div slot="display-template" slot-scope="s" :class="{
      'is-multiple': multiple
    }">
      <template v-if="multiple">
        <div v-for="routeId in s.entry" :key="routeId" class="route-selector-item-of-multiple">
          <template v-if="routesById[routeId]">
            {{routesById[routeId].label}}
            {{routesById[routeId].name}}
          </template>
          <template v-else>
            Route #{{s.entry}}
          </template>
        </div>
      </template>
      <template v-else>
        <template v-if="s.entry && routesById[s.entry]">
          {{routesById[s.entry].label}}
          {{routesById[s.entry].name}}
        </template>
        <template v-else-if="s.entry">
          Route #{{s.entry}}
        </template>
      </template>
    </div>

    <span slot="option-template" slot-scope="s">
      <div
        :class="{
          selected: isSelected(value, s.entry.id)
        }"
        @click="itemClicked(s.entry)">
        {{s.entry.label}} {{s.entry.name}}
      </div>
    </span>
  </Select2>
</template>

<style scoped>
.selected {
  background-color: #469;
  color: #fff;
}
</style>

<script>
import {mapActions, mapState} from 'vuex'
import _ from 'lodash'

import Select2 from '@/components/Select2.vue'

export default {
  props: ['value', 'multiple', 'companyId', 'startDate', 'endDate', 'filter'],
  components: {Select2},
  data () {
    return {
      routes: null,
      searchQuery: ''
    }
  },
  created () {
    this.fetch('currentRoutes')
  },
  computed: {
    ...mapState('shared', ['currentRoutes', 'promises']),
    filteredRoutes () {
      return (this.routes || [])
        .filter(f => this.filter ? this.filter(f) : true)
        .filter(r => !this.companyId ||
            r.transportCompanyId === Number(this.companyId))
    },
    sortedFilteredRoutes () {
      return (
        _.sortBy(this.filteredRoutes, 'label')
      )
    },
    sortedFilteredQueriedRoutes () {
      const q = this.searchQuery.toLowerCase()
      return this.sortedFilteredRoutes.filter(route =>
        (route.name || '').toLowerCase().includes(q) ||
        (route.label || '').toLowerCase().includes(q)
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
          includePath: false
        }
        if (this.startDate) query.startDate = this.startDate.getTime()
        if (this.endDate) query.endDate = this.endDate.getTime()
        if (this.companyId) query.transportCompanyId = this.companyId

        return this.getRoutes(query)
      }
    },
    routesById () {
      return _.keyBy(this.routes, 'id')
    }
  },
  watch: {
    routePromise: {
      immediate: true,
      handler (p) {
        if (p) {
          this.$latestPromise = p
          p.then((d) => {
            if (this.$latestPromise === p) {
              this.routes = d
            }
          })
        }
      }
    }
  },
  methods: {
    ...mapActions('shared', ['fetch']),
    ...mapActions('resources', ['getRoutes']),
    emitValue (value) {
      if (this.multiple) {
        if (value === null) { /* delete */
          const popped = this.value.slice(0, this.value.length - 1)
          this.$emit('input', popped)
          this.$emit('routes-changed', popped.map(v => this.routesById[v]))
        } else {
          const id = value.id
          const nextIdSet = this.value.includes(id)
            ? this.value.filter(i => i !== id)
            : this.value.concat([id])

          this.$emit('input', nextIdSet)
          this.$emit('routes-changed', nextIdSet.map(v => this.routesById[v]))
        }
      } else {
        if (value !== null) {
          this.$emit('input', value.id)
          this.$emit('routes-changed', this.routesById[value.id])
        }
      }
    },
    itemClicked (route) {
      if (this.multiple) {
        // FIXME
      } else {
        this.$emit('input', route.id)
        this.$emit('routes-changed', this.routesById[route.id])
      }
    },
    updateSearch (query) {
      this.searchQuery = query
    },
    isSelected (value, rid) {
      if (this.multiple) {
        // FIXME slow
        return value.findIndex(r => r === rid) !== -1
      } else {
        return value === rid
      }
    }
  }
}
</script>
<style scoped lang="scss">
.is-multiple {
  .route-selector-item-of-multiple {
    background-color: #ACF;
    border: solid 1px #469;
    max-width: 100%;
    box-sizing: border-box;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }
}
</style>
