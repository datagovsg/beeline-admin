<template>
  <div class="container-fluid crowdstart-editor">
    <div class="form-group" v-if="editRoute && !editRoute.tags.includes('crowdstart')">
      This is not a crowdstart route. Please add the "crowdstart" tag to the route.
    </div>

    <form class="container-fluid form-horizontal"
        v-if="editRoute" @submit.prevent="doSaveRoute">
      <div class="form-group form-inline">
        <label>
          Route Passes per Bid
          <input type="number" v-model="editRoute.notes.noPasses"
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
          @input="update('notes.crowdstartExpiry', f.date($event, 'yyyy-mm-dd'))"
          />

        <label>
          Start Date if Activated
        </label>
        <template v-if="editRoute.trips[0]">

          <DatePickerDropdown
            :value="editRoute.trips[0].date && new Date(editRoute.trips[0].date)"
            :offset="0"
            @input="update('trips.0.date', $event)"
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
            <tr v-for="(tier, index) in [editRoute.notes.tier[0]]">
              <td>
              </td>
              <td>
                <PriceInput v-model="tier.price" class="form-control" />
              </td>
              <td>
                <input type="number" class="form-control" v-model.number="tier.pax" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="form-group">
        <button class="btn btn-primary">
          Save
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import {mapGetters, mapActions, mapState} from 'vuex'
import * as resources from '../../stores/resources'
import querystring from 'querystring'
import assert from 'assert'
import _ from 'lodash'
const filters = require('../../filters')

export default {
  props: ['route', 'companyId'],
  data() {
    return {
      editRoute: null
    }
  },
  computed: {
    ...mapGetters(['axios']),
    f: () => filters,
    bidsPromise () {
      if (!this.route) return

      return this.axios.get(`/crowdstart/routes/${this.route.id}/bids?` + querystring.stringify({
          statuses: JSON.stringify(['bidded', 'void', 'failed', 'withdrawn']),
      }))
      .then(resp => resp.data)
    }
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
              tier: [_.get(clone.notes, 'tier.0') || this.defaultTier()],
            },
            tags: _.get(clone, 'tags') || [],
          }
        }
      }
    }
  },
  methods: {
    ...mapActions('resources', ['saveRoute', 'createTripForDate']),
    ...mapActions('spinner', ['spinOnPromise']),
    ...mapActions('modals', ['showModal']),

    doSaveRoute() {
      const newRoute = {
        ...this.editRoute,
        notes: _.cloneDeep(this.editRoute.notes)
      }
      const withTimesUpdated = (tripStops) => {
        const msDifference = Date.UTC(
          this.editRoute.trips[0].date.getUTCFullYear(),
          this.editRoute.trips[0].date.getUTCMonth(),
          this.editRoute.trips[0].date.getUTCDate()
        ) - this.route.trips[0].date.getTime();

        const rv = tripStops.map(ts => ({
          ...ts,
          time: new Date(ts.time.getTime() + msDifference)
        }))

        for (let [old, upd] of _.zip(tripStops, rv)) {
          const day = 24*60*60*1000;
          assert(old.time.getTime() % day === upd.time.getTime() % day)
        }
        return rv;
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
          tripStops: withTimesUpdated(this.editRoute.trips[0].tripStops),
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
      .catch((err) => this.showModal ({
          components: 'CommonModals',
          props: {
            type: 'alert',
            message: _.get(err, 'data.message')
          }
        })
      ))
    },
    doResetRoute() {
      this.editRoute = blankRoute()
    },

    update(key, value) {
      _.set(this.editRoute, key, value)
    },

    defaultTier () {
      return {price: 10, pax: 13}
    }
  }
}
</script>
