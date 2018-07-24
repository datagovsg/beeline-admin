<template>
<div v-if="routePasses === false">
  Select a company / user
</div>
<table class="table" v-else>
  <thead>
    <tr>
      <th>Actions</th>
      <th>Tag</th>
      <th>Balance</th>
      <th class="route-header">Route Label</th>
      <th class="route-header">Route Description</th>
      <th class="route-header">Route Status</th>
      <th class="route-header">Boarding</th>
      <th class="route-header">Alighting</th>
      <th class="route-header">Route Price</th>
    </tr>
  </thead>
  <tbody v-if="routePasses === null">
    <tr><td colspan="9"><img src="../../../www/img/spinner.svg" /></td></tr>
  </tbody>
  <tbody v-for="routePass in routePasses" :key="routePass.tag">
    <RouteInfo v-for="(route, index) in ((routesByRouteTag && routesByRouteTag[routePass.tag]) || [null])"
        :key="route ? route.id : index"
        :routeId="route && route.id">
      <tr slot-scope="routeInfo">
        <td v-if="index == 0" :rowspan="f._.get(routesByRouteTag, `${routePass}.length`, 1)">
          <button class="btn btn-success btn-sm" @click="showHistory(routePass.tag, routePass.balance)">
            <span class="glyphicon glyphicon-time" aria-hidden="true"></span>
            View History
          </button>
          <br/>
          <button class="btn btn-warning btn-sm" @click="$emit('show-issue-credits', routePass)">
            <span class="glyphicon glyphicon-piggy-bank" aria-hidden="true"></span>
            Issue passes...
          </button>
          <br/>
          <button class="btn btn-danger btn-sm" @click="$emit('show-expire-credits', routePass)">
            <span class="glyphicon glyphicon-scissors" aria-hidden="true"></span>
            Expire passes...
          </button>
        </td>
        <td v-if="index === 0" :rowspan="f._.get(routesByRouteTag, `${routePass}.length`, 1)">
          <ul class="tags"><li class="tags">{{ routePass.tag }}</li></ul>
        </td>
        <td v-if="index === 0" :rowspan="f._.get(routesByRouteTag, `${routePass}.length`, 1)"
          class="width-limit-xs">{{ routePass.balance }}
        </td>

        <td>
          <template v-if="route">
            <a :href="`#/c/${companyId}/trips/${route.id}/route`" class="route-label">{{ route.label }}</a>
          </template>
        </td>
        <td class="width-limit-md">
          <table class="borderless" v-if="route">
            <tr>
              <td style="width:25%">From:</td>
              <td>{{ route.from }}</td>
            </tr>
            <tr>
              <td>To:</td>
              <td>{{ route.to }}</td>
            </tr>
          </table>
        </td>
        <td class="routes-page">
          <template v-if="routeInfo">
            <span class="label route-active"
              v-if="routeInfo.dates.firstDate.getTime() <= now && now <= routeInfo.dates.lastDate.getTime() + 24*3600*1000">Active</span>
            <span class="label route-notstarted"
              v-if="now < routeInfo.dates.firstDate.getTime()">Not Started</span>
            <span class="label route-ended"
              v-if="now > routeInfo.dates.lastDate.getTime() + 24*3600*1000">Ended</span>
          </template>
        </td>
        <td class="width-limit-md">
          <ExpandableArea v-if="f._.get(routeInfo, 'trips[0].tripStops')">
            <table class="borderless">
              <tr v-for="tripStop in routeInfo.trips[0].tripStops.filter(r => r.canBoard)"
                  :key="tripStop.id">
                <td class="text-nowrap">
                  {{f.date(tripStop.time, 'HH:MM')}}
                </td>
                <td>
                  {{tripStop.stop.description}}
                </td>
              </tr>
            </table>
          </ExpandableArea>
        </td>
        <td class="width-limit-md">
          <ExpandableArea v-if="f._.get(routeInfo, 'trips[0].tripStops')">
            <table class="borderless">
              <tr v-for="tripStop in routeInfo.trips[0].tripStops.filter(r => r.canAlight)"
                  :key="tripStop.id">
                <td class="text-nowrap">
                  {{f.date(tripStop.time, 'HH:MM')}}
                </td>
                <td>
                  {{tripStop.stop.description}}
                </td>
              </tr>
            </table>
          </ExpandableArea>
        </td>
        <td class="width-limit-xs">
          <template v-if="f._.get(routeInfo, 'indicativeTrip')">
            {{ f.number(routeInfo.indicativeTrip.lastPrice, '#,##0.00') }}
          </template>
        </td>
      </tr>
    </RouteInfo>
  </tbody>
</table>
</template>

<script>
import {mapGetters, mapActions} from 'vuex'

import ExpandableArea from '@/components/ExpandableArea.vue'
import RouteInfo from '@/components/users/RouteInfo'

import filters from '@/filters'

export default {
  props: ['companyId', 'userId'],

  components: {ExpandableArea, RouteInfo},

  data () {
    return {
      routePasses: null,
      routesByRouteTag: {}
    }
  },

  computed: {
    ...mapGetters(['axios']),

    f: () => filters,

    now () {
      return Date.now()
    },

    displayedRoutes () {
      return Object.values(this.routesByRouteTag)
    },

    routePassesQueryUrl () {
      if (!this.companyId || !this.userId) return null
      return `/companies/${this.companyId}/route_passes/all/users/${this.userId}`
    }
  },

  watch: {
    routePassesQueryUrl: {
      immediate: true,
      handler (h) {
        if (h === null) {
          return
        } else {
          this.requery()
        }
      }
    }
  },

  methods: {
    ...mapActions('shared', ['fetch']),
    ...mapActions('resources', ['getRoutes']),
    ...mapActions('modals', ['showModal', 'showErrorModal', 'flash']),

    requery () {
      const promise = this.$routePassesPromise =
        this.axios.get(this.routePassesQueryUrl)
          .then((response) => {
            if (promise === this.$routePassesPromise) {
              this.routePasses = response.data
              this.routesByRouteTag = {}
            }
          })
          .then(() => { // load the routes by route pass
            for (let routePass of this.routePasses) {
              this.getRoutes({
                transportCompanyId: this.companyId,
                tags: JSON.stringify([routePass.tag])
              })
                .then((routes) => {
                  if (promise === this.$routePassesPromise) {
                    this.routesByRouteTag = {
                      ...this.routesByRouteTag,
                      [routePass.tag]: routes
                    }
                  }
                })
            }
          })
    },

    showHistory (tag, balance) {
      this.$emit('route-pass-history-requested', {
        tag, balance
      })
    }
  }
}
</script>
