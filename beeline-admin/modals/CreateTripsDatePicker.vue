<template>
  <Modal @cancel="reject()" :name="name" :value="value">
    <div class="modal-header">
      <h3>Select dates</h3>
    </div>

    <div class="modal-body">
      <template v-if="message">
        {{message}}
      </template>
      <template v-else>
        Select the trips from the old route to copy over to the new route:
      </template>

      <DatePicker
        :defaultDisable="selectOnTrips"
        :multiple="true"
        :month="monthShown" :offset="0"
        :specialDates="specialDates"
        :otherMonthSelectable="false"
        @month-changed="loadTripsForMonth($event)"
        v-model="selectedDates" class="date-picker"
        />

      <strong>Trips to create:</strong>
      <ul class="date-list">
        <li v-for="date in sortedSelectedDates">
          {{f.date(date, 'dd-mmm-yyyy')}}
        </li>
      </ul>
    </div>

    <div class="modal-footer">
      <div class="row">
        <div class="col-lg-12">
          <button class="btn btn-default" @click="reject()">
            Cancel
          </button>
          <button class="btn btn-primary" @click="resolve(selectedDates)">
            Create Trips
          </button>
        </div>
      </div>
    </div>
  </modal>
</template>

<script>
import _ from 'lodash'
import {mapGetters, mapActions, mapState} from 'vuex'

import Modal from '@/modals/MyModal.vue'
import ModalMixin from '@/modals/ModalMixin'
import DatePicker from '@/components/DatePicker.vue'

export default {
  props: ['route', 'selectOnTrips', 'message'],
  mixins: [ModalMixin],
  data () {
    return {
      selectedDates: [],
      trips: null
    }
  },
  computed: {
    ...mapState('shared', ['publicHolidays']),

    routeTrips () {
      return this.trips || (this.route && this.route.trips)
    },

    specialDates () {
      return this.routeTrips.map(t => ({
        date: t.date,
        [this.selectOnTrips ? 'enabled' : 'disabled']: true
      }))
        .concat(this.publicHolidays
          ? this.publicHolidays.map(ph => ({
            date: new Date(ph.date),
            classes: ['public-holiday']
          }))
          : [])
    },

    sortedSelectedDates () {
      return _.sortBy(this.selectedDates)
    },

    f () {
      return {
        date: require('dateformat')
      }
    },
    monthShown () {
      return this.route.dates ? new Date(this.route.dates.lastDate) : new Date()
    }
  },
  created () {
    this.loadTripsForMonth(this.monthShown)
    this.fetch('publicHolidays')
  },
  components: {
    DatePicker,
    Modal
  },
  methods: {
    ...mapActions('resources', ['getRoute']),
    ...mapActions('shared', ['fetch']),

    loadTripsForMonth (date) {
      const start = new Date(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        1
      )
      const end = new Date(
        date.getUTCFullYear(),
        date.getUTCMonth() + 1,
        1
      )

      const promise = this.$lastPromise = this.getRoute({
        id: this.route.id,
        options: {
          includeTrips: true,
          startDate: start.toISOString(),
          endDate: end.toISOString()
        }
      })
        .then((route) => {
          if (promise === this.$lastPromise) {
            this.trips = route.trips
          }
        })
    }
  }
}
</script>

<style lang="scss">
.date-picker {
  width: 100%;
  td, th {
    text-align: center;
    line-height: 3.0;

    &.selected {
      background-color: #008;
      color: #FFF;
    }
    &.disabled {
      background-color: #888;
      color: #CCC;
    }
    &.different-month {
      opacity: 0.5;
    }
    &:not(.different-month) {
      font-weight: bold;
    }
    &.public-holiday {
      color: #F00;
    }
  }
  th:not([colspan]) {
    width: 14%;
  }
}
</style>
