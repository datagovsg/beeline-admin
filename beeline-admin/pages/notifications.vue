<template>
<div>

  <h1>Manage Route Event Notifications</h1>

  <div class="qr-instructions">
    <div class="qr-box">
      <img src="img/telegram-url-qr.png" />
      <br/>
      Scan the above QR code if you have Telegram installed
    </div>
    <div class="qr-instructions-text">
      <h3>Guide to get your telegram ID for route notifications:</h3>
      <ol>
        <li>Download “Telegram” messenger app on your mobile devices</li>
        <li>Access https://t.me/beeline_server_bot.</li>
        <li>Press start and extract telegram ID</li>
      </ol>
    </div>
  </div>

  <RouteEventSubscriptions ref="routeEventSubscriptions"
    :companyId="companyId" :initialEventSubscriptions="eventSubscriptions" />

  <h1>Other notifications</h1>

  <OtherEventSubscriptions ref="otherEventSubscriptions"
    :companyId="companyId" :initialEventSubscriptions="eventSubscriptions" />
</div>
</template>

<style lang="scss">
.qr-instructions {
  display: flex;

  /* Note: would have been very easy to just tell this
  .qr-box to float: left; However float: * has strange
  interactions with list items. The list items appear under the floated item.
  Therefore I work around this with flexbox.

  Ref: https://stackoverflow.com/questions/710158/why-do-my-list-item-bullets-overlap-floating-elements
   */
  .qr-box {
    flex: 0 0 auto;
    border: solid 1px black;
    width: 250px;
    box-sizing: border-box;
    text-align: center
  }
  .qr-instructions {
    flex: 1 0 auto;
  }
}
</style>

<script>
import { mapGetters, mapActions } from 'vuex'

import RouteEventSubscriptions from '@/components/notifications/RouteEventSubscriptions.vue'
import OtherEventSubscriptions from '@/components/notifications/OtherEventSubscriptions.vue'

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
