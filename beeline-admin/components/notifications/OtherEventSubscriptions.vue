<template>
  <table class="table event-notifications other-event-subscriptions table-striped">
    <thead>
      <tr>
        <th>Event Type</th>
        <th>Options</th>
        <th>Notification method</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(eventSubscription, index) in eventSubscriptions" :key="index">
        <td>
          <select v-model="eventSubscription.event" class="form-control">
            <option v-for="eventType in eventTypes" :key="eventType[0]"
              :value="eventType[0]">
              {{eventType[1]}}
            </option>
          </select>
          <!-- todo required: true -->
        </td>
        <td>
          <EventSubscriptionEditor
            :type="eventSubscription.event"
            v-model="eventSubscription.params"
            />
        </td>
        <td>
          <NotificationMethodEditor
            v-model="eventSubscription.handler"
            :agent="eventSubscription.agent"
            @agent-input="eventSubscription.agent = $event"
            ng-required="true" />
        </td>
        <td>
          <!-- ng-disabled="form.$pristine || form.$invalid" -->
          <button @click="saveOne(eventSubscription)"
            class="btn btn-default">
            <span class="glyphicon glyphicon-save"></span>
            Update
          </button>
          <button @click="deleteOne(eventSubscription)"
            class="btn btn-danger">
            <span class="glyphicon glyphicon-trash"></span>
            Delete
          </button>
        </td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td colspan="4">
          <button @click="add()" class="btn btn-default">
            <span class="glyphicon glyphicon-plus"></span>
          </button>
        </td>
      </tr>
    </tfoot>
  </table>
</template>

<script>
import _ from 'lodash'
import assert from 'assert'
import { mapGetters, mapActions } from 'vuex';

import EventSubscriptionEditor from './EventSubscriptionEditor.vue'
import NotificationMethodEditor from './NotificationMethodEditor.vue'

import {satisfiesEvent, stringify, EVENT_TYPES} from './notifications'

const UPDATEABLE_FIELDS = [
  'params', 'event', 'handler', 'formatter', 'agent'
]
export default {
  props: ['companyId', 'initialEventSubscriptions'],

  components: {EventSubscriptionEditor, NotificationMethodEditor},

  data() {
    return {
      eventSubscriptions: null,
    }
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
    initialEventSubscriptions: {
      immediate: true,
      handler (es) {
        if (!this.eventSubscriptions && es) {
          this.eventSubscriptions = _.filter(es,
            e => !_.some(EVENT_TYPES, (v, k) => satisfiesEvent(e, v))
          )
        }
      }
    },
  },

  methods: {
    ...mapActions('modals', ['showErrorModal', 'confirm']),
    ...mapActions('spinner', ['spinOnPromise']),
    blankEventSubscription() {
      return {
        event: null,
        params: {ignoreIfEmpty: true},
        handler: '',
        agent: {},
        formatter: '0'
      }
    },

    add() {
      this.eventSubscriptions.push(this.blankEventSubscription())
    },

    saveOne (subscr) {
      const promise = subscr.id
        ? this.axios.put(
            `/companies/${this.companyId}/eventSubscriptions/${subscr.id}`, 
            _.pick(subscr, UPDATEABLE_FIELDS)
          )
        : this.axios.post(
            `/companies/${this.companyId}/eventSubscriptions`,
            _.pick(subscr, UPDATEABLE_FIELDS)
          )
      this.spinOnPromise(promise)
      .catch(this.showErrorModal)

      promise.then((response) => {
        _.assign(subscr, _.omit(response.data, ['createdAt', 'updatedAt']));
      })
      .catch(this.showErrorModal)
    },
    async deleteOne(subscr) {
      if (!(await this.confirm({title: "Are you sure you want to delete this?"}))) {
        return;
      }
      ;(subscr.id
        ? this.spinOnPromise(this.axios.delete(`/companies/${this.companyId}/eventSubscriptions/${subscr.id}`))
        : Promise.resolve(null))
      .then(() => {
        this.eventSubscriptions.splice(this.eventSubscriptions.indexOf(subscr), 1)
      })
      .catch(this.showErrorModal)
    }
  }
}
</script>

