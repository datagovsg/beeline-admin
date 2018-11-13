<template>
  <table class="table">
    <thead>
      <tr>
        <th>Label</th>
        <th>Route</th>
        <th>Bid</th>
        <th>Status</th>
        <th>Bid Date</th>
      </tr>
    </thead>
    <tbody v-if="crowdstarts === null">
      <tr><td colspan="5"><img src="../../../www/img/spinner.svg" /></td></tr>
    </tbody>
    <tbody>
      <tr v-for="crowdstart in crowdstarts" :key="crowdstart.id">
        <td>
          <a :href="`#/c/${companyId}/trips/${crowdstart.routeId}/crowdstart`">
            {{f._.get(crowdstart, 'route.label')}}
          </a>
        </td>
        <td>
          <a :href="`#/c/${companyId}/trips/${crowdstart.routeId}/crowdstart`">
            {{f._.get(crowdstart, 'route.name')}}
          </a>
        </td>
        <td>${{f.number(crowdstart.price, '#,##0.00')}}</td>
        <td>{{crowdstart.status}}</td>
        <td>{{ f.date(crowdstart.createdAt, 'dd-mmm-yyyy HH:MM:ss')}}</td>
      </tr>
    </tbody>
  </table>
</template>

<script>
import {mapGetters, mapActions} from 'vuex'
import _ from 'lodash'

import * as filters from '@/filters'

export default {
  props: ['userId', 'companyId'],

  created () {
    this.fetch(['allRoutes'])
  },

  asyncComputed: {
    crowdstartBids () {
      return this.axios.get(`/crowdstart/users/${this.userId}/bids`)
        .then(r => r.data)
    }
  },

  computed: {
    ...mapGetters(['axios']),
    ...mapGetters('shared', ['allRoutesById']),

    f: () => filters,

    crowdstarts () {
      if (!this.crowdstartBids || !this.allRoutesById) return null

      const bids = this.crowdstartBids
        .map(b => ({
          ...b,
          route: this.allRoutesById[b.routeId]
        }))
        .filter(b => !this.companyId || _.get(b, 'route.transportCompanyId') === Number(this.companyId))

      return _.orderBy(bids, ['createdAt'], ['desc'])
    }
  },

  methods: {
    ...mapActions('shared', ['fetch'])
  }
}
</script>
