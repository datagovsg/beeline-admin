<template>
  <div>
    <GmapPolyline v-if="path" :path="path" />

    <GmapMarker
      v-for="ping in pingSamples"
      :key="ping.id"
      :position="f.pointToLatLng(ping.coordinates)"
      @click="$emit('click', ping)"
      :icon="routePointIcon"
      />
  </div>
</template>
<script>
import filters from '../filters'
import _ from 'lodash'

export default {
  props: ['pings'],
  computed: {
    f: () => filters,
    sortedPings () {
      return this.pings && _.orderBy(this.pings, 'time')
    },
    path () {
      if (!this.sortedPings) return null
      return this.sortedPings.map(p => filters.pointToLatLng(p.coordinates))
    },
    pingSamples () {
      if (!this.sortedPings) return null
      return this.sortedPings.filter((v, i) => i % 3 === 0)
    },
    routePointIcon () {
      return {
        url: './img/routePtMarker.png'
      }
    }
  }
}
</script>
