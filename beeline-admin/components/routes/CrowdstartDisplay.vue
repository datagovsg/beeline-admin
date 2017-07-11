<template>
  <div class="container-fluid crowdstart-editor">
    <div class="form-group" v-if="route && !route.tags.includes('lelong')">
      This is not a crowdstart route. Please add the "lelong" tag to the route.
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

      return this.axios.get(`/custom/lelong/routes/${this.route.id}/bids?` + querystring.stringify({
          statuses: JSON.stringify(['bidded', 'void', 'failed', 'withdrawn']),
      }))
      .then(resp => resp.data)
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

    enableTerminate () {
      return routeIsEligible(this.route) && !this.routeIsActivated
    },

    enableConvert () {
      return routeIsEligible(this.route) && this.routeIsActivated
    },

    terminate () {
      // add 'failed' to both route and bids
    },

    convert () {
      // add 'success' to crwodstart tags
      // create public route with 'crowdstart-id' tag
    },

    chargeAndCreditUser () {
      // for loop individual bid & charge
    }

  }
}

// helper function to verify the route is not processed AND has 'lelong' tag AND is expired
const routeIsEligible = (route) => {
  return route.tags.indexOf('success') == -1 && route.tags.indexOf('failed') == -1
      && route.tags.indexOf('lelong') != -1
      && _.get(route, 'notes.crowdstartExpiry') && new Date(route.notes.crowdstartExpiry) < Date.now()
}

</script>
