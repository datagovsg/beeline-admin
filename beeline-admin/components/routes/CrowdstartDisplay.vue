<template>
  <div class="container-fluid crowdstart-editor">
    <div class="form-group" v-if="route && !route.tags.includes('crowdstart')">
      This is not a crowdstart route. Please add the "crowdstart" tag to the route.
    </div>

    <form class="container-fluid form-horizontal"
        v-if="route">

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
              <th>Charge Message</th>
              <th>Operations</th>
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
              <td>{{bid.chargeMessage || bid.chargeError && bid.chargeError.message || ''}}</td>
              <td>
                <button class="btn btn-danger" @click="withdrawBid(bid)"
                    type="button" title="Withdraw Bid">
                  <span class="glyphicon glyphicon-trash"></span>
                </button>
                <button class="btn btn-danger" @click="charge(bid)" :disabled="bid.status!=='bidded'" v-if="route.tags.indexOf('success') > -1"
                    type="button" title="Manually Charge">
                  <span class="glyphicon glyphicon-piggy-bank"></span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="form-group">
        <button class="btn btn-danger" :disabled="!enableTerminate()" @click="terminate()">
          Expire Route
        </button>
        <button class="btn btn-success" :disabled="!enableConvert()" @click="convert()">
          Convert Route
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

      return this.axios.get(`/crowdstart/routes/${this.route.id}/bids?` + querystring.stringify({
          statuses: JSON.stringify(['bidded', 'void', 'failed', 'withdrawn']),
      }))
      .then((resp) => {
        let bids = resp.data
        let now = parseInt(Date.now())
        _.forEach(bids, (bid) => {
          bid.chargeMessage = (bid.status === 'void') ? 'Charged successfully' : null;
          bid.chargeError = bidChargeError(bid)
        })
        return bids
      })
    },
    routeIsActivated () {
      if (!this.bids || !this.route) return false

      let validBids = _.filter(this.bids, (bid) => {return bid.status === 'bidded'})
      return (validBids.length >= this.route.notes.tier[0].pax)
    }
  },
  watch: {
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
    ...mapActions('spinner', ['spinOnPromise']),
    ...mapActions('modals', ['showModal']),

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
            `/crowdstart/routes/${this.route.id}/bids/${bid.id}`
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

    enableTerminate () {
      return routeIsEligible(this.route) && !this.routeIsActivated
    },

    enableConvert () {
      return routeIsEligible(this.route) && this.routeIsActivated
    },

    terminate () {
      // add 'failed' to both route and bids
      let terminatePromise = this.axios.post(`/crowdstart/routes/${this.route.id}/expire`)
        .then(() => {this.$emit('requery')})

      this.spinOnPromise(terminatePromise)
      .catch((err) => this.showModal({
        component: 'CommonModals',
        props: {
          type: 'alert',
          message: _.get(err, 'message') || err
        }
      }))
    },

    convert () {
      // add 'success' to crwodstart tags
      // create public route with 'crowdstart-id' tag
      // after convert promopt admin 'Do you want to charge all bidders now?'

      this.showModal({
        component: 'CommonModals',
        props: {
          type: 'confirm',
          message: 'Are you sure you want to convert the crowdstart?'
        }
      })
      .then((result) => {
        if (result) {
          let convertPromise = this.axios.post(`/crowdstart/routes/${this.route.id}/activate`,
              {
                price: this.route.notes.tier[0].price,
                label: this.route.label
              }
            )
            .then(() => {this.$emit('requery')})
          return this.spinOnPromise(convertPromise)
          .then(() => {
            return this.chargeAllBidders()
          })
        }
      })
      .catch((err) => this.showModal({
        component: 'CommonModals',
        props: {
          type: 'alert',
          message: _.get(err, 'message') || 'There is some error.'
        }
      }))
    },

    chargeAllBidders () {
      // for loop individual bid & charge
      this.showModal({
        component: 'CommonModals',
        props: {
          type: 'confirm',
          message: 'Do you want to charge all bidders now?'
        }
      })
      .then((result) => {
        if (result) {
          this.spinOnPromise(Promise.all(this.bids.map((bid) => {
            return this.charge(bid)
          }))
          .then(() => {this.$emit('requery')}))
          console.log('Done')
        }
      })

    },

    charge (bid) {
      // manually charge individual bid through stripe
      let chargePromise = this.axios.post(`/crowdstart/routes/${this.route.id}/bids/${bid.id}/convert`)
        .then(() => {this.$emit('requery')})
      return this.spinOnPromise(chargePromise)
        .catch((err) => this.showModal({
          component: 'CommonModals',
          props: {
            type: 'alert',
            message: _.get(err, 'message') || err
          }
        }))
    }

  }
}

// helper function to verify the route is not processed AND has 'crowdstart' tag AND is expired
const routeIsEligible = (route) => {
  return route.tags.indexOf('success') == -1 && route.tags.indexOf('failed') == -1
      && route.tags.includes('crowdstart')
      && _.get(route, 'notes.crowdstartExpiry') && new Date(route.notes.crowdstartExpiry) < Date.now()
}

function bidChargeError(bid) {
  // bids with notes and timestamps with charge error
  if (bid.status === 'bidded' && bid.notes) {
    let timestamps = _(bid.notes)
    .keys()
    .filter((key) => {
      return parseInt(key) && (parseInt(key) <= now)
    })
    .value()

    if (timestamps) {
      let latestTimestamp = _.maxBy(timestamps, (timestamp) => parseInt(timestamp))
      return {
        ...bid.notes[latestTimestamp],
        timestamp: latestTimestamp
      }
    } else {
      return null
    }
  } else {
    return null
  }
}

</script>
