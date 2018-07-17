<template>
<div>
  <div v-if="type === 'lifecycle'">
    You will be notified when a server is spawned
  </div>

  <div v-else-if="type === 'transactionFailure'">
    You will be notified when transactions fail
  </div>

  <div v-else-if="type === 'urgentBooking'">
    <label>
      <input type="checkbox"
        :value="options.setRouteIds"
        @input="options.setRouteIds = $event.target.checked,
        update('routeIds', $event.target.checked ? [] : undefined)" />
      Filter by routes
    </label>
    <label v-if="options.setRouteIds">
      Routes:
    </label>
    <br/>
    <RouteSelector :companyId="companyId"
      :multiple="true"
      :value="value.routeIds" @input="update('routeIds', $event)"
      class="route-selector" />
    <label>
      <select
        @input="update('maxTimeToTrip', $event.target.value)"
        class="form-control">
        <option v-for="(t, index) in disp.urgentBookingTimeOptions"
          :key="index"
          :value="t[0]"
          :selected="t[0] === value.maxTimeToTrip">
          {{t[1]}}
        </option>
      </select>
    </label>
  </div>

  <div v-else-if="type === 'tripCancelled'">
    <div>
      <label>
        <input type="checkbox"
          :value="options.setRouteIds"
          @input="options.setRouteIds = $event.target.checked,
          update('routeIds', $event.target.checked ? [] : undefined)" />
        Filter by routes
      </label>
      <div v-if="options.setRouteIds">
        <label>
          Routes:<br/>
        </label>
        <RouteSelector :companyId="companyId"
          :multiple="true"
          :value="value.routeIds" @input="update('routeIds', $event)"
          class="route-selector" />
      </div>
    </div>
  </div>

  <div v-else>
    Please select an event type
  </div>
</div>

</template>

<script>
import RouteSelector from '@/components/RouteSelector.vue'

export default {
  props: ['companyId', 'type', 'value', 'required'],

  components: {RouteSelector},

  computed: {
    disp () {
      return {
        noPingTimeOptions: [
          [5, '5 minutes before trip'],
          [15, '15 minutes before trip'],
          [25, '25 minutes before trip']
        ],

        urgentBookingTimeOptions: [
          [60000 * 5, '5 minutes before trip'],
          [60000 * 10, '10 minutes before trip'],
          [60000 * 15, '15 minutes before trip'],
          [60000 * 30, '30 minutes before trip']
        ],

        lateArrivalTimeOptions: [
          [60000 * 5, 'more than 5 mins late'],
          [60000 * 10, 'more than 10 mins late'],
          [60000 * 15, 'more than 15 mins late']
        ],

        lateETATimeOptions: [
          [60000 * 10, 'more than 10 mins late']
        ]
      }
    },

    defaults () {
      return {
        noPings: { transportCompanyIds: [this.companyId], ignoreIfEmpty: true },
        lateArrival: { transportCompanyIds: [this.companyId], ignoreIfEmpty: true },
        lateETA: { transportCompanyIds: [this.companyId], ignoreIfEmpty: true },
        tripCancelled: { transportCompanyIds: [this.companyId], ignoreIfEmpty: true }
      }
    }
  },

  watch: {
    type (t) {
      if (!t) return

      this.$emit('input', this.dataCache[t] || this.defaults[t])
    },

    'value.routeIds' (r) {
      this.options.setRouteIds = Boolean(r)
    },

    value (v) {
      this.dataCache[this.type] = {...v} // Clone
    }
  },

  data () {
    return {
      options: {
        setRouteIds: false,
        setTransportCompanyIds: false
      },

      // The event definitions strictly don't allow unknown fields
      // Strictly separate the settings for each event type, don't allow
      // one event's unknown fields to mess with that of another
      dataCache: {}
    }
  },

  methods: {
    update (field, v) {
      this.$emit('input', {
        ...this.value,
        [field]: v
      })
    }
  }
}

</script>

<style scoped>
.route-selector {
  width: 300px;
}
</style>
