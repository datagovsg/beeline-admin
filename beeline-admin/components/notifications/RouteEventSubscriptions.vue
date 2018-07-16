<template>
  <table class="table event-notifications route-event-subscriptions table-striped">
    <thead>
      <tr>
        <th>Notification Method</th>
        <th>Options</th>
        <th class="event-type"><div><span>New Booking</span></div></th>
        <!-- <th class="event-type">Urgent Booking</th> -->
        <th class="event-type"><div><span>Driver app not switched on</span></div></th>
        <th class="event-type"><div><span>Predicted late arrival</span></div></th>
        <th class="event-type"><div><span>Message to passengers</span></div></th>
        <th class="event-type"><div><span>Trip cancelled</span></div></th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(subscription, index) in subscriptions" :key="index">
        <td>
          <NotificationMethodEditor
            v-model="subscription.handler"
            :agent="subscription.agent"
            @agent-input="subscription.agent = $event"
            ng-required="true" />
          <!-- TODO: required = true -->
        </td>
        <td>
          <!-- <EventSubscriptionEditor
            :type="eventSubscription.event"
            v-model="eventSubscription.params"
            /> -->
          <EventSubscriptionEditor type="tripCancelled"
            v-model="subscription.options" />
        </td>
        <td class="with-label"><label><input type="checkbox" v-model="subscription.events.newBooking" /></label></td>
        <td>
          <label><input type="checkbox" v-model="subscription.events.noPings5" /> T-5mins</label><br/>
          <label><input type="checkbox" v-model="subscription.events.noPings15" /> T-15mins</label><br/>
          <label><input type="checkbox" v-model="subscription.events.noPings25" /> T-25mins</label><br/>
        </td>
        <td class="with-label"><label><input type="checkbox" v-model="subscription.events.lateETA" /></label></td>
        <td class="with-label"><label><input type="checkbox" v-model="subscription.events.passengersMessaged" /></label></td>
        <td class="with-label"><label><input type="checkbox" v-model="subscription.events.tripCancelled" /></label></td>
        <td>
          <button @click="saveOne(subscription)" class="btn btn-default">
            <span class="glyphicon glyphicon-save"></span>
            Update
          </button>
          <button @click="deleteOne(subscription)" class="btn btn-danger">
            <span class="glyphicon glyphicon-trash"></span>
            Delete
          </button>
        </td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td colspan="4">
          <button @click="add()" class="glyphicon glyphicon-plus btn btn-default">
          </button>
        </td>
      </tr>
    </tfoot>
  </table>
</template>

<script>
import _ from 'lodash'
import assert from 'assert'
import { mapGetters, mapActions } from 'vuex'

import EventSubscriptionEditor from './EventSubscriptionEditor.vue'
import NotificationMethodEditor from './NotificationMethodEditor.vue'

import {satisfiesEvent, stringify, EVENT_TYPES} from './notifications'

export default {
  props: ['companyId', 'initialEventSubscriptions'],

  components: {EventSubscriptionEditor, NotificationMethodEditor},

  data () {
    return {
      subscriptions: null
    }
  },

  watch: {
    initialEventSubscriptions: {
      immediate: true,
      handler (es) {
        if (!this.subscriptions && es) {
          this.subscriptions = this.parse(es)
        }
      }
    }
  },

  computed: {
    ...mapGetters(['axios'])
  },

  methods: {
    ...mapActions('modals', ['showErrorModal', 'confirm']),
    ...mapActions('spinner', ['spinOnPromise']),
    blankRouteEventSubscription () {
      return {
        agent: {},
        events: {
          noPings5: false,
          noPings15: false,
          noPings25: false,
          lateETA: false,
          passengersMessaged: false,
          tripCancelled: false,
          newBooking: false
        },
        handler: '',
        options: {ignoreIfEmpty: true},
        ids: []
      }
    },

    add () {
      this.subscriptions.push({
        agent: {},
        events: {},
        handler: '',
        options: {},
        ids: []
      })
    },

    saveOne (subscr) {
      const newEntries = this.serialize(subscr)

      // insert the new entries, then delete the old ones
      this.spinOnPromise(Promise.all(newEntries.map(ne =>
        this.axios.post(`/companies/${this.companyId}/eventSubscriptions`, ne)
      )))
        .then((responses) => {
          const parsed = this.parse(responses.map(r => r.data))
          const idsToDelete = subscr.ids

          assert(parsed.length <= 1, '[AssertionError] entries should map to one group')

          if (parsed.length === 1) {
            this.subscriptions.splice(
              this.subscriptions.indexOf(subscr), 1,
              parsed[0]
            )
          }

          return Promise.all(idsToDelete.map(id =>
            this.axios.delete(`/companies/${this.companyId}/eventSubscriptions/${id}`)))
            .then(() => {
              subscr.ids = []
            })
        })
        .catch(this.showErrorModal)
    },
    async deleteOne (subscr) {
      if (!(await this.confirm({title: 'Are you sure you want to delete this?'}))) {
        return
      }
      ;(subscr.ids
        ? this.spinOnPromise(Promise.all(_.uniqBy(subscr.ids).map(id =>
          this.axios.delete(`/companies/${this.companyId}/eventSubscriptions/${id}`))))
        : Promise.resolve(null))
        .then(() => {
          this.subscriptions.splice(this.subscriptions.indexOf(subscr), 1)
        })
        .catch(this.showErrorModal)
    },

    parse (eventSubscriptions) {
      // { noPings, newBooking, lateArrival ... }
      const relevantKeys = _(EVENT_TYPES).values().map(e => e.event).keyBy().value()

      const groupedByRoutes = _(eventSubscriptions)
        .filter(e => e.event in relevantKeys) // filter out { lifecycle, ... }
        .groupBy(e => { // group by handler, agent and filter
          return _.sortBy(_.uniq(e.params.routeIds) || []).join(',') + '|' +
            e.handler + '|' +
            stringify(e.agent)
        })
        .mapValues((es, g) => {
          /*
            ev(1): (handler, agent, filter) --> [
              [noPings5, [object]],
              [noPings15, [object]],
              [noPings25, [object]],
              [...]
            ]
          */
          const ev = _(EVENT_TYPES).keys().map((key) => {
            // Check if this key applies to some of the event subscriptions
            return [key,
              es.find(e => satisfiesEvent(e, EVENT_TYPES[key]))
            ]
          })
          /*
          ev(2): (handler, agent, filter) --> {
            noPings5, [object],
            noPings15, [object],
            noPings25, [object],
            ...
          } */
            .fromPairs().value()

          return {
            options: _(es[0].params)
              .pick(['routeIds'])
              .toPairs()
              .filter(v => v[1] !== undefined)
              .fromPairs()
              .value(), /* no undefined route ids */
            handler: es[0].handler,
            agent: es[0].agent,
            events: _.mapValues(ev, e => !!e),
            ids: _(ev).mapValues(e => e && e.id).filter(x => x).uniq().value()
          }
        })
        .values()
        .filter(v => v.ids.length)
        .value()

      return groupedByRoutes
    },

    serialize (subscription) {
      const eventSubscriptions = _.keys(subscription.events)
        .filter(key => subscription.events[key])
        .map(key => ({
          event: EVENT_TYPES[key].event,
          formatter: '0',
          params: _.defaults(EVENT_TYPES[key].defaultParams,
            subscription.options),
          agent: subscription.agent,
          handler: subscription.handler
        }))

      const mergedSubscriptions = _(eventSubscriptions)
        .groupBy('event')
        // merge the array-valued params
        .mapValues(vs => {
          const mergedParams = vs
            .map(v => v.params)
            .reduce((acc, params) => {
              for (let key in params) {
                if (!acc[key]) {
                  acc[key] = params[key]
                } else if (acc[key] instanceof Array &&
                            params[key] instanceof Array) {
                  acc[key] = acc[key].concat(params[key])
                }
              }
              return acc
            }, {})

          return {...vs[0], params: mergedParams}
        })
        .values()
        .value()

      return mergedSubscriptions
    }
  }
}

</script>

<style lang="scss" scoped>
.event-notifications.table {
  th.event-type {
    width: 100px;
    div {
      width: 2em;
      height: 8em;
      overflow: visible;
      transform:  rotate(-30deg) translateY(7em);
      transform-origin: 0em 8em;

      span {
        background-color: #ddd;
        white-space: nowrap;
        width: 100px;
      }
    }
  }
  tbody td {
    // event-subscription-editor label {
    //   overflow-x: auto;
    //   display: block;

    //   select {
    //     max-width: 25vw;
    //   }

    //   select[multiple]:focus {
    //     height: 20em;
    //     transition: all 0.1s ease;
    //   }
    //   select[multiple]:not(:focus) {
    //     height: 4em;
    //     transition: all 0.1s ease;
    //   }
    // }
    // notification-method-editor label {
    //   display: block;
    // }

    &.with-label {
      position: relative;
      label {
        position: absolute;
        left: 0; right: 0; top: 0; bottom: 0;
      }
    }
  }
}

</style>
