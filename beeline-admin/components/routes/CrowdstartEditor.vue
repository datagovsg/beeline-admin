<template>
  <div class="container-fluid crowdstart-editor">
    <div class="form-group" v-if="editRoute && !editRoute.tags.includes('lelong')">
      This is not a crowdstart route. Please add the "lelong" tag to the route.
    </div>

    <form class="container-fluid form-horizontal" @submit.prevent="doSaveRoute"
        v-if="editRoute">
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
          <a :href="`#/c/${companyId}/trips/${editRoute.id}/trips`">
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
                <button :disabled="editRoute.notes.tier.length <= 1"
                    @click="removeTier(index)" class="btn btn-danger" type="button">
                  <span class="glyphicon glyphicon-minus"></span>
                </button>
              </td>
              <td>
                <PriceInput v-model="tier.price" class="form-control" />
              </td>
              <td>
                <input type="number" class="form-control" v-model.number="tier.pax" />
              </td>
            </tr>
          </tbody>
          <!-- <tfoot>
            <tr>
              <td colspan="3">
                <button @click="addTier()" class="btn btn-primary" type="button"
                   :disabled="editRoute.notes.tier.length >= 1">
                  <span class="glyphicon glyphicon-plus"></span>
                  Add Tier
                </button>
              </td>
            </tr>
          </tfoot> -->
        </table>
      </div>
      <div class="form-group">
        <button class="btn btn-primary">
          Save
        </button>
      </div>

      <hr/>

      <div class="form-group form-inline" v-if="bids">
        <h3>Bidders</h3>
        <table class="table table-striped table-hover">
          <thead>
            <tr>
              <th></th>
              <th>User</th>
              <th>Telephone</th>
              <th>Email</th>
              <th>Bid Date</th>
              <th>Bid Price</th>
              <th>Status</th>
              <th>Cancel</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(bid, index) in bids" :class="{
              'not-live': bid.status !== 'bidded',
            }">
              <td>{{index + 1}}</td>
              <td>{{bid.user.name}}</td>
              <td>{{bid.user.telephone}}</td>
              <td>{{bid.user.email}}</td>
              <td>{{f.date(bid.createdAt, 'dd mmm yy HH:MM:ss')}}</td>
              <td>{{bid.price}}</td>
              <td>{{bid.status}}</td>
              <td>
                <button class="btn btn-danger" @click="withdrawBid(bid)"
                    type="button">
                  <span class="glyphicon glyphicon-trash"></span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
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
  props: ['route'],
  data() {
    return {
      editRoute: null,
      bids: null
    }
  },
  computed: {
    ...mapGetters(['axios']),
    f: () => filters,
    bidsPromise () {
      if (!this.route) return

      return this.axios.get(`/custom/lelong/routes/${this.route.id}/bids?` + querystring.stringify({
          statuses: JSON.stringify(['bidded', 'void', 'failed']),
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
              tier: [_.get(clone, 'tier.0') || this.defaultTier()],
            },
            tags: _.get(clone, 'tags') || [],
          }
        }
      }
    },
    bidsPromise: {
      immediate: true,
      handler (promise) {
        if (promise) {
          promise.then(bids => {
            this.bids = bids
          })
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
        `/custom/lelong/routes/${this.editRoute.id}/bids/update_price`,
        {
          price: this.editRoute.notes.tier[0].price
        }
      )

      Promise.all([routePromise, tripPromise, bidPromise])
      .then(() => this.$emit('requery'))
      .catch((err) => commonModals.alert(`${err && err.data && err.data.message}`))
    },
    doResetRoute() {
      this.editRoute = blankRoute()
    },

    update(key, value) {
      _.set(this.editRoute, key, value)
    },

    defaultTier () {
      return {price: 10, pax: 13}
    },
    removeTier (index) {
      this.editRoute.notes.tier.splice(index, 1)
    },
    addTier () {
      this.editRoute.notes.tier.push(this.defaultTier())
    },
    withdrawBid (bid) {
      this.showModal({
        component: 'CommonModals',
        props: {
          type: 'confirm',
          message: 'Are you sure you want to cancel this bid?'
        }
      })
      .then((result) => {
        if (result) {
          return this.spinOnPromise(this.axios.delete(
            `/custom/lelong/routes/${this.route.id}/bids/${bid.id}`
          )
          .then(() => {this.$emit('requery')}))
        }
      })
      .catch((err) => this.showModal({
        component: 'CommonModals',
        props: {
          type: 'alert',
          message: _.get(err, 'message')
        }
      }))
    },
  }
}
</script>
