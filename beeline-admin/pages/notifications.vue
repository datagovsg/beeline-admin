<template>
<div>

  <h1>Manage Route Event Notifications</h1>

  <br/>
  <u><b>Guide to get your telegram ID for route notifications:</b></u>
  <ol>
    <li>Download “Telegram” messenger app on your mobile devices</li>
    <li>Access https://t.me/beeline_server_bot</li>
    <li>Press start and extract telegram ID</li>
  </ol>
  <br/>

  <RouteEventSubscriptions ref="routeEventSubscriptions"
    :companyId="companyId" :initialEventSubscriptions="eventSubscriptions" />

  <h1>Other notifications</h1>

  <OtherEventSubscriptions ref="otherEventSubscriptions"
    :companyId="companyId" :initialEventSubscriptions="eventSubscriptions" />
</div>
</template>

<script>
import querystring from 'querystring'
import _ from 'lodash'
import assert from 'assert'
import { mapGetters, mapActions } from 'vuex'

import RouteEventSubscriptions from '@/components/notifications/RouteEventSubscriptions.vue'
import OtherEventSubscriptions from '@/components/notifications/OtherEventSubscriptions.vue'

const UPDATEABLE_FIELDS = [
  'params', 'event', 'handler', 'formatter', 'agent'
]

export default {
  props: ['companyId'],

  data () {
    return {
      eventSubscriptions: null
    }
  },

  components: {
    OtherEventSubscriptions,
    RouteEventSubscriptions
  },

  computed: {
    ...mapGetters(['isSuperAdmin', 'axios']),

    eventTypes () {
      if (this.isSuperAdmin) {
        return [
          ['lifecycle', 'Server started'],
          ['transactionFailure', 'Payment problems']
        ]
      }
    }
  },
  watch: {
    companyId: {
      immediate: true,
      handler (h) {
        this.requery()
      }
    }
  },
  methods: {
    ...mapActions('spinner', ['spinOnPromise']),

    requery () {
      if (!this.companyId) return

      this.spinOnPromise(this.axios.get(`/companies/${this.companyId}/eventSubscriptions`))
        .then((response) => {
          this.eventSubscriptions = response.data
        })
    },

    blankEventSubscription () {
      return {
        formatter: '0'
      }
    },

    blankRouteEventSubscription () {
      return {
        agent: {},
        events: {},
        handler: '',
        options: {},
        ids: []
      }
    }
  }
}

</script>
