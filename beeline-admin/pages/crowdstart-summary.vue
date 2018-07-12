<template>
<div class="col-lg-12 table-responsive">
  <h1>Crowdstart Routes</h1>

  
  

  <div class="btn-group">
    <button
      class="btn"
      :class="{
        'btn-primary': filter.showExpiry == 'expired',
        'btn-default': filter.showExpiry != 'expired'
      }"
      @click="filter.showExpiry = 'expired'">
      Expired Campaigns
    </button>
    <button
      class="btn"
      :class="{
        'btn-primary': filter.showExpiry == 'active',
        'btn-default': filter.showExpiry != 'active'
      }"
      @click="filter.showExpiry = 'active'">
      Active Campaigns
    </button>
    <button
      class="btn"
      :class="{
        'btn-primary': filter.showExpiry == 'all',
        'btn-default': filter.showExpiry != 'all'
      }"
      @click="filter.showExpiry = 'all'">
      All Campaigns
    </button>
  </div>

  <br clear="both"/><br/>

  <table class="table table-striped table-bordered table-condensed table-hover transactions-view">
    <thead>
      <tr>
        <th>&#10003;</th>
        <SortTh @sort="updateOrder" field="id" :orderBy="filter.orderBy" :order="filter.order">Route ID</SortTh>
        <SortTh @sort="updateOrder" field="label" :orderBy="filter.orderBy" :order="filter.order">Label</SortTh>
        <SortTh @sort="updateOrder" field="name" :orderBy="filter.orderBy" :order="filter.order">Route</SortTh>
        <th>View</th>
        <SortTh @sort="updateOrder" field="createdAt" :orderBy="filter.orderBy" :order="filter.order">Campaign Start Date</SortTh>
        <SortTh @sort="updateOrder" field="notes.crowdstartExpiry" :orderBy="filter.orderBy" :order="filter.order">Campaign End Date</SortTh>
        <SortTh @sort="updateOrder" field="trips[0].date" :orderBy="filter.orderBy" :order="filter.order">Start Date if Activated</SortTh>
        <th>Tags</th>
        <SortTh @sort="updateOrder" field="notes.noPasses" :orderBy="filter.orderBy" :order="filter.order">Route Passes per Bid</SortTh>
        <SortTh @sort="updateOrder" field="_meta.tiers[0].fraction" :orderBy="filter.orderBy" :order="filter.order">Tiers</SortTh>
        <th>Actions</th>
      </tr>
    </thead>

    <tbody v-if="sortedRoutes">
      <tr v-for="(route, routeIndex) in sortedRoutes"
        :key="route.id"
        :class="{
          expired: route._meta.isExpired
        }">
        <td>
          <label>
            {{ routeIndex + 1}}
          </label>
          <span class="glyphicon glyphicon-time" v-if="route._meta.isExpired">
          </span>
          <span class="success glyphicon glyphicon-ok" v-if="route.tags.indexOf('success') != -1">
          </span>
          <span class="failure glyphicon glyphicon-remove" v-if="route.tags.indexOf('failed') != -1">
          </span>
        </td>
        <td>
          <a :href="`#/c/${companyId}/trips/${route.id}/trips`">
            {{route.id}}
          </a>
        </td>
        <td><span class="route-label">{{route.label}}</span></td>
        <td>
          <a :href="`#/c/${companyId}/trips/${route.id}/trips`">{{route.from}} to {{route.to}}</a>
        </td>
        <td>
          <button class="btn btn-default" @click="viewRoute(route)">View</button>
        </td>
        <td>{{f.date(route.createdAt, 'dd mmm yyyy')}}</td>
        <td>{{f.date(route.notes.crowdstartExpiry, 'dd mmm yyyy')}}</td>
        <td>{{f.date(route.trips[0].date, 'dd mmm yyyy', true)}}</td>
        <td>
          <ul class="tags">
            <li v-for="(tag, index) in route.tags" :key="index">{{tag}}</li>
          </ul>
        </td>
        <td>
          x{{route.notes.noPasses}}
        </td>
        <td>
          <ul class="tiers">
            <li v-for="(tier, index) in route._meta.tiers"
              :key="index"
              class="tier-status">
              {{tier.numBids}} of {{tier.pax}} at ${{f.number(tier.price, '#,##0.0')}}<br/>
              <progress :value="tier.numBids" :max="tier.pax"></progress>
            </li>
          </ul>
        </td>
        <td>
          <a
            :href="`#/c/${companyId}/trips/${route.id}/crowdstart`"
            class="btn btn-default">
            <span class="glyphicon glyphicon-pencil"></span>
            Edit
          </a>
        </td>
      </tr>
    </tbody>
  </table>
</div> <!-- col-lg-12 -->
</template>

<script>
import {mapGetters, mapActions, mapState} from 'vuex'
import * as resources from '../stores/resources'
import _ from 'lodash'

import SortTh from '@/components/SortTh.vue'
const filters = require('../filters')

export default {
  props: ['companyId'],

  components: {SortTh},

  data () {
    return {
      routes: null,
      selectedRoutes: {},
      filter: {
        order: 'desc',
        orderBy: '_meta.tiers[0].fraction',
        showExpiry: 'active'
      }
    }
  },

  computed: {
    ...mapState('auth', ['idToken']),
    ...mapState('shared', ['companies']),
    ...mapGetters(['axios', 'isSuperAdmin']),
    ...mapGetters('shared', ['companiesById']),

    f: () => filters,
    
    sortedRoutes () {
      return this.routes && _(this.routes)
        .filter(r =>
          this.filter.showExpiry === 'all' ? true :
          this.filter.showExpiry === 'active' ? !r._meta.isExpired :
            r._meta.isExpired
        )
        .orderBy(
          [r => _.get(r, this.filter.orderBy)],
          [this.filter.order]
        )
        .value()
    }
  },

  methods: {
    ...mapActions('shared', ['fetch']),
    ...mapActions('modals', ['showModal', 'showErrorModal', 'alert']),
    ...mapActions('resources', ['getRoute', 'saveRoute', 'createTripForDate']),
    ...mapActions('spinner', ['spinOnPromise']),

    viewRoute (route) {
      return this.showModal({
        component: 'ViewRouteTrips',
        props: {route}
      })
    },

    requery () {
      return this.axios.get('/crowdstart/status')
        .then((result) => {
          const transformed = result.data
            .filter(r => !this.companyId || r.transportCompanyId === Number(this.companyId))
            .map(route => {
              return {
                ...route,
                _meta: {
                  isConverted: route.tags.find(x => x == 'success' || x == 'failed'),
                  tiers: transformTiers(route.bids, route.notes.tier),
                  isExpired: new Date(route.notes.crowdstartExpiry).getTime() < Date.now()
                }
              }
            })
          this.routes = transformed
        })
    },

    updateOrder($event) {
      this.filter.order = $event.order
      this.filter.orderBy = $event.orderBy
    }
  },

  created () {
    this.requery()
  }
}

function transformTiers(bids, tiers) {
  // Brute force calculation because the scale should be small
  return tiers.map(tier => {
    const matchingBids = (bids || []).filter(b => b.priceF < tier.price + 0.00001)
    return {
      ...tier,
      numBids: matchingBids.length,
      achieved: matchingBids.length >= tier.pax,
      fraction: matchingBids.length / tier.pax,
    }
  })
}

</script>
<style lang="scss" scoped>
.create-route-button {
  float: right;
}
ul.tiers {
  display: block;
  margin: 0;
  padding: 0;

  li.tier-status {
    display: block;
    margin: 0;
    padding: 0;
  }
}

.expired td {
  color: #999;
}
.failure {
  color: red;
}
.success {
  color: #090;
}

</style>
