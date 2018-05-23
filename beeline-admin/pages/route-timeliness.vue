<template>
  <div class="container-fluid withnav route-passes">
    <LoadingSpinner ref="loadingSpinner"/>
    <ModalHelper ref="modalHelper"/>

    <div class="row" v-if="!companyId">
      Please select a company
    </div>
    <div class="row">
      <div class="col-sm-8">
        <h1>Route Timeliness Report</h1>
        <form>
          <div class="form-group">
            Select:
            <a class="select-route" @click="filter.routeIds = $refs.routeSelector.allRouteIds">all</a> |
            <a class="select-route" @click="filter.routeIds = []">none</a>
            <route-selector
              class="form-control"
              v-model="filter.routeIds"
              :companyId="companyId"
              :multiple="true"
              ref="routeSelector"
              />
          </div>
          <br>

        </form>
        <button class="btn btn-default"
          type="button"
          :disabled="filter.routeIds.length === 0"
          @click="downloadCSV()"
          >
          <span class="glyphicon glyphicon-save" aria-hidden="true"/>
          Download CSV
        </button>
      </div>
      <div class="col-sm-4">
        <div class="datepicker-wrap">
          <h4 class="text-center">
            Dates selected:
            {{ this.query.from }} - {{ this.query.to }}
          </h4>
          <span-select @month-changed="monthChanged" v-model="filter.dates" :special-dates="publicHolidayDates"/>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import querystring from 'querystring'
import {mapGetters, mapActions, mapState} from 'vuex'
import _ from 'lodash'
import download from 'downloadjs'
import * as resources from '../stores/resources'
import filters from '../filters'

import RouteSelector from '../components/RouteSelector.vue'

export default {
  props: ['companyId'],
  data () {
    return {
      filter: {
        dates: [],
        selectedMonth: new Date(),
        routeIds: [],
      },
      publicHolidaysPromise: this.fetch('publicHolidays')
    }
  },
  components: { RouteSelector },
  computed: {
    ...mapGetters(['axios']),
    ...mapState('shared', ['publicHolidays']),

    query () {
      const { selectedMonth, dates, routeIds } = this.filter

      const from = filters.date(
        dates.length > 0
          ? dates[0]
          : new Date(
            selectedMonth.getFullYear(),
            selectedMonth.getMonth(),
            1
          ),
        'isoDate'
      )

      const to = filters.date(
        dates.length > 1
          ? dates[1]
          : new Date(
            selectedMonth.getFullYear(),
            selectedMonth.getMonth() + 1,
            0
          ),
        'isoDate'
      )

      return { routeIds, from, to }
    }
  },
  asyncComputed: {
    publicHolidayDates: {
      async get () {
        await this.publicHolidaysPromise
        return this.publicHolidays.map(ph => (
          {
            date: new Date(ph.date),
            classes: ['public-holiday'],
          }
        ))
      },
      default: []
    }
  },

  methods: {
    ...mapActions('spinner', ['spinOnPromise']),
    ...mapActions('modals', ['showModal', 'showErrorModal']),
    ...mapActions('shared', ['fetch']),

    async downloadCSV () {
      const { routeIds, ...queryParameters } = this.query
      const qs = querystring.stringify({ ...queryParameters, format: 'csv' })
      let payloads = []

      const noHeaders = csvText => csvText.substring(csvText.indexOf("\n") + 1)

      for (const routeId of routeIds) {
        const url = `${process.env.TRACKING_URL}/routes/${routeId}/performance?${qs}`
        const response = await this.axios.get(url)
        const payload = payloads.length > 0
          ? noHeaders(response.data + "\n")
          : response.data + "\n"
        payloads.push(payload)
      }
      const blob = new Blob(payloads, { type: 'text/csv' })
      const { from, to } = queryParameters
      const fileName = `Route Timeliness Performance - ${from} to ${to}.csv`
      download(blob, fileName, 'text/csv')
    },
    monthChanged (newMonth) {
      this.filter.selectedMonth = newMonth.clone().toDate()
      this.filter.startDate = this.filter.endDate = null
    },
  },
}
</script>

<style lang="scss">
a.select-route {
  text-decoration: underline;
  cursor: pointer;
}
select[multiple].form-control {
  height: 200px;
}
.span-select {
  width: 100%;
  td, th {
    text-align: center;
    line-height: 3.0;
    position: relative;

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
    div.annotation {
      background-color: #FF6C6A;
      color: #F4F4F4;
      position: absolute;
      bottom: 0;
      right: 0;
      line-height: 1.6;
      font-size: 12px;
      padding: 1px 5px;
    }
  }
  th:not([colspan]) {
    width: 14%;
  }
}
</style>
