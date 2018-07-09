<template>
  <Modal :name="name" @cancel="reject()" :value="{}" overrideWidth="80%">
    <div class="modal-header">
      <h3>Issue A New Ticket</h3>
    </div>

    <div class="modal-body">
      <div class="col-lg-4">
        <div class="date-picker">
          <h4>Dates Available</h4>
          <DatePicker
            :defaultDisable="true"
            :offset="0"
            :specialDates="specialDates"
            v-model="data.selectedDates"
            :multiple="true"
            @month-change="updateCalendarTrips" />
        </div>
      </div>
      <div class="col-lg-8">
        <h4> Select Route</h4>
        <div class="trip-selector">
          <div>
            <p class="text-danger" v-if="data.cancelledTickets">
              Note: When you edit a ticket, the ticket you edit will be "void" and a new ticket with the new changes will be issued.
            </p>
          </div>
          <!-- Route Selection -->
          <form class="form-horizontal">
            <div class="form-group">
              <label v-if="cancelledTickets" class="control-label col-sm-2">
                Ticket you are editing
              </label>
              <div class="col-sm-10">
                <ul class="selected-dates">
                  <li v-for="ticket in cancelledTickets">
                    <table class="borderless">
                      <tr>
                        <td>
                          <span class="label label-default">{{ticket.id}}</span>
                        </td>
                        <td>
                          {{f.date(ticket.boardStop.trip.date, 'dd-mmm-yy', true)}}
                        </td>
                      </tr>
                      <tr>
                        <td>
                          {{ticket.boardStop.trip.route.label}}
                        </td>
                        <td>

                        </td>
                      </tr>
                      <tr>
                        <td>
                          {{f.date(ticket.boardStop.time, 'HH:MM')}}
                        </td>
                        <td>
                          {{ticket.boardStop.stop.description}}
                        </td>
                      </tr>
                      <tr>
                        <td>
                          {{f.date(ticket.alightStop.time, 'HH:MM')}}
                        </td>
                        <td>
                          {{ticket.alightStop.stop.description}}
                        </td>
                      </tr>
                    </table>
                  </li>

                </ul>
              </div>
            </div>
            <div class="form-group">
              <label class="control-label col-sm-2">Route</label>
              <div class="col-sm-10">
                <RouteSelector v-model="data.routeId" />
              </div>
            </div>
            <div class="form-group">
              <label class="control-label col-sm-2">Selected Date(s)</label>
             <div class="col-sm-10">
               <ul class="selected-dates">
                 <li v-for="trip in disp.selectedTrips" :key="trip.id">
                   {{f.date(trip.date, 'dd mmm yyyy')}}
                   <button @click="removeTrip(trip.date)"
                     class="btn btn-link">
                     <span class="glyphicon glyphicon-remove text-danger" aria-hidden="true" />
                   </button>
                 </li>
               </ul>
              </div>
            </div>
            <div class="form-group">
              <label class="control-label col-sm-2">Boarding Stop</label>
              <div class="col-sm-10">
                <select v-model="data.boardStopStopId" class="form-control" name="boardingStop">
                  <option v-for="tripStop in boardStopsAvailable" :value="tripStop.stopId" :key="tripStop.id">
                    {{displayStop(tripStop)}}
                  </option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="control-label col-sm-2">Alighting Stop</label>
              <div class="col-sm-10">
                <select v-model="data.alightStopStopId" class="form-control" name="alightingStop">
                  <option v-for="tripStop in alightStopsAvailable" :value="tripStop.stopId" :key="tripStop.id">
                    {{displayStop(tripStop)}}
                  </option>
                </select>
             </div>
           </div>
           <div class="form-group">
            <label class="control-label col-sm-2">Reason (Required)</label>
            <div class="col-sm-10">
              <textarea class="form-control"
                v-model="data.reason"
                placeholder="Reason for changing or editing tickets - e.g. Monthly pass, Cancelled trip on DD/MM/YY" />
              </div>
           </div>
          </form>

          <!-- User selection -->
          <h4>Select User</h4>
          <table class="table user-selectors">
            <tbody>
              <tr v-for="(user, $index) in data.users" :key="user.id">
                <td>{{$index + 1}}</td>
                <td class="user-text-wrap">
                  <UserIdSelector v-model="user.id" :value="user" :includeEphemeral="true" />
                  <div class="conflicts" v-if="conflictsByUid[user.id]">
                    This user already has a trip on
                    <span v-for="(conflict, conflictIndex) in conflictsByUid[user.id]" :key="conflict.user.id">
                      {{conflictIndex ? ',' : ''}}
                      {{f.date(conflict.trip.date, 'dd mmm yyyy')}}
                    </span>
                  </div>
                </td>
                <td>
                  <button class="btn btn-default"
                    @click="data.users.splice(users.indexOf(user), 1)">
                    <span class=" glyphicon glyphicon-minus" aria-hidden="true" />
                    Remove User
                  </button>
                </td>
              </tr>
              <tr>
                <td colspan="3">
                  <button class="btn btn-default"
                    @click="data.users.push(newUser())">
                    <span class=" glyphicon glyphicon-plus" aria-hidden="true"></span>
                    Add user
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- custom buttons -->
    <div class="modal-footer">
      <button class="btn btn-default" @click="reject()">
        Cancel
      </button>
      <button class="btn btn-primary" @click="resolve(returnValue)">
        {{cancelledTickets ? 'Confirm Changes' : 'Create Ticket'}}
      </button>
    </div>
  </modal>
</template>

<script>
import {mapState, mapGetters, mapActions} from 'vuex'
import querystring from 'querystring'

import Modal from '@/modals/MyModal.vue'
import DatePicker from '@/components/DatePicker.vue'
import RouteSelector from '@/components/RouteSelector.vue'
import UserIdSelector from '@/components/UserIdSelector.vue'
import ModalMixin from '@/modals/ModalMixin'

import filters from '@/filters'

export default {
  props: [
    'users',
    'routeId',
    'boardStopStopId',
    'alightStopStopId',
    'cancelledTickets'
  ],
  components: { Modal, DatePicker, RouteSelector, UserIdSelector },
  data () {
    return {
      data: {
        users: [],
        reason: '',
        routeId: null,
        boardStopStopId: null,
        alightStopStopId: null,
        selectedDates: [],
      },

      disp: {
        tripsInMonth: [],
      },

      passengersByTripId: {}
    }
  },
  created () {
    // Copy data into the 'data' structure
    this.data = {
      ...this.data,
      routeId: this.routeId,
      boardStopStopId: this.boardStopStopId,
      alightStopStopId: this.alightStopStopId,
      users: this.users ? this.users.slice() : [],
    }
  },
  computed: {
    ...mapGetters(['axios']),
    f: () => filters,

    conflictsByUid () {
      if (!this.data.users || !this.passengersByTripId) {
        return;
      }

      const conflicts = this.data.users.map(user => // For each user
        this.selectedTrips
          .map(trip => {
            // Find the trips that...
            const conflictingTicket = this.passengersByTripId[trip.id] && // already contain a ticket for this user
              this.passengersByTripId[trip.id].find(ticket => ticket.userId === user.id)
            return {
              ticket: conflictingTicket,
              trip,
              user,
            }
          })
          .filter(c => c.ticket)
      )

      return _(_.zip(conflicts, this.data.users))
        .filter(([conflict, user]) => conflict && conflict.length !== 0)
        .keyBy(([conflict, user]) => user.id)
        .mapValues(([conflict, user]) => conflict)
        .value()
    },

    selectedTrips () {
      if (!this.data.selectedDates || this.data.selectedDates.length === 0)
        return []

      return this.data.selectedDates.map(date =>
        this.disp.tripsInMonth
          .find(trip => new Date(trip.date).getTime() === date.getTime())
      )
    },

    stopsAvailable () {
      if (this.selectedTrips.length === 0) return []

      const commonSubsetOfStops = this.selectedTrips.reduce(
        (acc, trip) => {
          return _.intersectionBy(
            acc,
            trip.tripStops,
            ts => `${ts.stopId};${ts.time.getHours()};${ts.time.getMinutes()}`
          )
        },
        this.selectedTrips[0].tripStops
      )

      return commonSubsetOfStops
    },

    boardStopsAvailable () {
      return this.stopsAvailable.filter(s => s.canBoard)
    },

    alightStopsAvailable () {
      return this.stopsAvailable.filter(s => s.canAlight)
    },

    specialDates () {
      return this.disp.tripsInMonth.map(trip => ({
        date: new Date(trip.date),
        enabled: true,
      }))
    },

    returnValue () {
      const oldTransactionIds = this.cancelledTickets &&
        _(this.cancelledTickets)
          .map(tkt => (tkt.ticketSale && tkt.ticketSale.transactionId) ||
              (tkt.ticketExpense && tkt.ticketExpense.transactionId) || false
          )
          .filter(tid => tid !== false)
          .uniq()
          .value()

      const cancelledTicketIds = this.cancelledTickets &&
          this.cancelledTickets.map(ticket => ticket.id)

      const oldTransactionDescription = oldTransactionIds && oldTransactionIds.length ?
          `(Original Txn #${oldTransactionIds.join(', #')})` : ''
      const oldTicketDescription = cancelledTicketIds && cancelledTicketIds.length ?
          `(Replacing tickets #${cancelledTicketIds.join(', #')})` : ''
      const description = this.data.reason

      return {
        trips: _.flatten(this.data.users.map(user => /* for each user */
          this.selectedTrips.map(trip => /* for each trip */
            ({
              userId: user.id,
              boardStopId: trip.tripStops.find(ts => ts.stopId === this.data.boardStopStopId).id,
              alightStopId: trip.tripStops.find(ts => ts.stopId === this.data.alightStopStopId).id,
              tripId: trip.id,
            })
          )
        )),
        cancelledTicketIds,
        description: description + ' ' + oldTransactionDescription + ' ' + oldTicketDescription
      }
    }
  },
  watch: {
    'data.routeId': {
      immediate: true,
      handler (v) {
        this.data.selectedDates = []
        this.updateCalendarTrips(new Date)
      }
    },

    /**
     * If there are new trips, fetch the data and add them to passengersByTripId
     */
    'selectedTrips' (trips) {
      for (let trip of trips) {
        if (!(trip.id in this.passengersByTripId)) {
          this.passengersByTripId = {
            ...this.passengersByTripId,
            [trip.id]: null, // set to null, reserve the space so it's not fetched twice
          }

          // fetch the data
          this.axios.get(`/trips/${trip.id}/passengers`)
          .then((response) => {
            this.passengersByTripId[trip.id] = response.data
          })
          .catch(() => { /* Don't handle errors -- server will handle them during submission */ })
        }
      }
    }
  },
  methods: {
    ...mapActions('resources', ['getRoute']),
    removeDate () {

    },
    newUser () {
      return {
        id: null
      }
    },
    displayRoute: (route) => `${route.label}: ${route.from} -- ${route.to}`,
    displayStop: ts => `${filters.date(ts.time, 'HH:MM')}: ${ts.stop.description}`,

    updateCalendarTrips (month) {
      // Given current month, route, update trips in calendar
      const queryParams = {
        includeTrips: 'true',
        startDate: Math.max(Date.now(), month.getTime()),
        // endDate: Math.max(Date.now(), new Date(Date.UTC(...)).getTime()),
      }
      // Note: if you specify an endDate, then you need to watch the current month
      // However, then you will need to refactor computed:stopsAvailable to take into
      // account trips that fall on a different month

      const routePromise = this.$routePromise = this.getRoute({
        id: this.routeId,
        options: queryParams
      })
        .then((route) => {
          if (this.$routePromise !== routePromise) return // superseded by another request

          this.disp.tripsInMonth = route.trips
            ? route.trips.filter(t => t.isRunning)
            : []
        })

      return routePromise
    }
  },
  mixins: [ModalMixin],
}

</script>
