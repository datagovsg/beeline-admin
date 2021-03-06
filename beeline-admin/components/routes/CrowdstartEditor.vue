<template>
  <div class="container-fluid crowdstart-editor">
    <div v-if="editRoute && !isRouteACrowdstart(editRoute)"
      class="form-group">
      This is not a crowdstart route. Please add the "crowdstart" tag to the route.
    </div>

    <form class="container-fluid form-horizontal"
        v-if="isRouteACrowdstart(editRoute)" @submit.prevent="doSaveRoute">

      <template v-if="isCrowdstartClosed(editRoute)">
        This crowdstart is closed. You may not make further changes
        to it
      </template>

      <div class="form-group form-inline">
        <label>
          Route Passes per Bid
          <input type="number"
            v-model="editRoute.notes.noPasses"
            :disabled="isCrowdstartClosed(editRoute)"
            class="form-control" />
        </label>
      </div>

      <div class="form-group">
        <label>
          Campaign end date
        </label>

        <DatePickerDropdown
          :value="editRoute.notes.crowdstartExpiry ? new Date(editRoute.notes.crowdstartExpiry) : null"
          :offset="0"
          :disabled="isCrowdstartClosed(editRoute)"
          @input="update('notes.crowdstartExpiry', f.date($event, 'yyyy-mm-dd'))"
          class="datepicker-dropdown"
          />

        <label>
          Start Date if Activated
        </label>
        <template v-if="editRoute.trips[0]">

          <DatePickerDropdown
            :value="editRoute.trips[0].date && new Date(editRoute.trips[0].date)"
            :offset="0"
            :disabled="isCrowdstartClosed(editRoute)"
            @input="update('trips.0.date', $event)"
            class="datepicker-dropdown"
            />
        </template>
        <template v-else>
          (Please
          <a :href="`#/c/${this.companyId}/trips/${editRoute.id}/trips`">
            create a trip
          </a>
          first)
        </template>
      </div>

      <div class="form-group form-inline">
        <h3>Tiers</h3>
        <table class="table table-striped table-hover">
          <thead>
            <tr>
              <th></th>
              <th>Price</th>
              <th>Number of committers</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(tier, index) in [editRoute.notes.tier[0]]" :key="index">
              <td>
              </td>
              <td>
                <PriceInput v-model="tier.price"
                  :disabled="isCrowdstartClosed(editRoute)"
                  class="form-control" />
              </td>
              <td>
                <input type="number" class="form-control"
                  :disabled="isCrowdstartClosed(editRoute)"
                  v-model.number="tier.pax" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="form-group">
        <button class="btn btn-primary"
          :disabled="isCrowdstartClosed(editRoute)">
          Save
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.datepicker-dropdown {
  max-width: 200px;
}
</style>

<script>
import {mapGetters, mapActions} from 'vuex'
import assert from 'assert'
import _ from 'lodash'
import * as filters from '@/filters'

import DatePickerDropdown from '@/components/DatePickerDropdown.vue'
import PriceInput from '@/components/PriceInput.vue'

export default {
  props: ['route', 'companyId'],
  data () {
    return {
      editRoute: null
    }
  },
  components: {
    DatePickerDropdown,
    PriceInput
  },
  computed: {
    ...mapGetters(['axios']),
    f: () => filters
  },
  watch: {
    route: {
      immediate: true,
      handler (route) {
        if (!route) {
          this.editRoute = null
        } else {
          const clone = _.cloneDeep(route)

          this.editRoute = {
            ...clone,
            notes: {
              noPasses: null,
              crowdstartExpiry: null,
              ..._.get(clone, 'notes'),
              tier: [_.get(clone.notes, 'tier.0') || this.defaultTier()]
            },
            tags: _.get(clone, 'tags') || []
          }
        }
      }
    }
  },
  methods: {
    ...mapActions('resources', ['saveRoute', 'createTripForDate']),
    ...mapActions('spinner', ['spinOnPromise']),
    ...mapActions('modals', ['showErrorModal']),

    isRouteACrowdstart: filters.isRouteACrowdstart,
    isCrowdstartClosed: filters.isCrowdstartClosed,

    doSaveRoute () {
      const newRoute = {
        ...this.editRoute,
        notes: _.cloneDeep(this.editRoute.notes)
      }
      const withTimesUpdated = (tripStops) => {
        const msDifference = Date.UTC(
          this.editRoute.trips[0].date.getUTCFullYear(),
          this.editRoute.trips[0].date.getUTCMonth(),
          this.editRoute.trips[0].date.getUTCDate()
        ) - this.route.trips[0].date.getTime()

        const rv = tripStops.map(ts => ({
          ...ts,
          time: new Date(ts.time.getTime() + msDifference)
        }))

        for (let [old, upd] of _.zip(tripStops, rv)) {
          const day = 24 * 60 * 60 * 1000
          assert(old.time.getTime() % day === upd.time.getTime() % day)
        }
        return rv
      }

      // Update route
      const routePromise = this.axios.put(
        `/routes/${this.editRoute.id}`,
        {notes: newRoute.notes}
      )

      // Update trip
      const tripPromise = this.axios.put(
        `/trips/${this.editRoute.trips[0].id}`,
        {
          ..._.pick(this.editRoute.trips[0], ['capacity']),
          date: filters.date(this.editRoute.trips[0].date, 'yyyy-mm-dd', true),
          tripStops: withTimesUpdated(this.editRoute.trips[0].tripStops)
        }
      )
      // Update price and exsiting bids
      const bidPromise = this.axios.post(
        `/crowdstart/routes/${this.editRoute.id}/bids/update_price`,
        {
          price: this.editRoute.notes.tier[0].price
        }
      )

      this.spinOnPromise(Promise.all([routePromise, tripPromise, bidPromise])
        .then(() => this.$emit('requery'))
        .catch(this.showErrorModal)
      )
    },

    update (key, value) {
      _.set(this.editRoute, key, value)
    },

    defaultTier () {
      return {price: 10, pax: 13}
    }
  }
}
</script>
