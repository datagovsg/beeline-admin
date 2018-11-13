<template>
<div>
  <PunctualityGraph
    :tripStop="tripStop"
    :plotWidth="450"
    :plotHeight="70"
    backgroundColor="#CCCCCC"
    :selected-date="selectedDate"
    @date-selected="$emit('date-selected', $event)"
  />

  <br/>
  <template v-if="stopsWithoutPingData.length > 0">
    <button @click="showMissing = !showMissing">
      {{showMissing ? '[-]' : '[+]'}} Dates without location data
      ({{stopsWithoutPingData.length}})
    </button>
    <div v-if="showMissing">
      <ol>
        <li v-for="stop in stopsWithoutPingData" :key="stop.id">
          <a href="#" @click.prevent="showRoutePings(tripStop.routeId, stop.date)">
            {{f.date(stop.date, 'dd mmm yyyy', true)}}
          </a>
        </li>
      </ol>
    </div>
  </template>
</div>
</template>

<script>
import _ from 'lodash'
import {mapActions} from 'vuex'

import PunctualityGraph from './PunctualityGraph.vue'

import * as filters from '@/filters'

export default {
  props: ['tripStop', 'selectedDate'],

  components: {
    PunctualityGraph
  },

  computed: {
    f: () => filters,

    stopsWithoutPingData () {
      const filtered = this.tripStop.points
        .filter(s => !s.actualTime)
      return _.sortBy(filtered, 'date')
    }
  },

  data () {
    return {
      showMissing: false
    }
  },

  methods: {
    ...mapActions('modals', ['showModal', 'showErrorModal']),

    showRoutePings (routeId, date) {
      return this.showModal({
        component: 'ViewRouteTrips',
        props: {
          route: {id: routeId},
          date
        }
      })
    }
  }
}
</script>
