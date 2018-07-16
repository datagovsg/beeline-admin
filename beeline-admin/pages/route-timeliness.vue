<template>
  <div class="container-fluid withnav route-passes">

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
              @routes-changed="filter.routes = $event"
              :startDate="new Date(1)"
              :companyId="companyId"
              :multiple="true"
              :filter="r => !r.tags.includes('crowdstart')"
              ref="routeSelector"
              />
          </div>
          <br>

        </form>
        <button class="btn btn-default"
          type="button"
          :disabled="filter.routeIds.length === 0"
          @click="downloadTimelinessCSV()"
          >
          <span class="glyphicon glyphicon-save" aria-hidden="true"/>
          Timeliness CSV
        </button>
        <button class="btn btn-default"
          type="button"
          :disabled="filter.routeIds.length === 0"
          @click="downloadEventsCSV()"
          >
          <span class="glyphicon glyphicon-save" aria-hidden="true"/>
          Events CSV
        </button>
        <span v-if="progressText">&nbsp;{{ progressText }}</span>
      </div>
      <div class="col-sm-4">
        <div class="datepicker-wrap">
          <div>
            Dates selected:
            <b>{{ f.date(this.query.from, 'dd mmm yyyy') }}</b> -
            <b>{{ f.date(this.query.to, 'dd mmm yyyy') }}</b>
          </div>
          <SpanSelect @month-changed="monthChanged" v-model="filter.dates" :special-dates="publicHolidayDates"/>
        </div>
      </div>
      <template v-if="filter.routeIds.length > 0">
        <div class="col-sm-8" v-if="filter.routeIds.length > 10">
          You have selected too many routes
        </div>
        <div class="col-sm-8" v-else>
          <h2>Charts</h2>
          <ul class="nav nav-pills">
            <li role="presentation"
              v-for="route in filter.routes"
              :key="route.id"
              :class="{
                active: charts.routeId === route.id
              }"
              @click="charts.routeId = route.id">
              <a href="#" @click.prevent>{{route.label}}</a>
            </li>
          </ul>

          <hr />

          <div v-if="chartRouteServiceDates">
            This service runs from
            <b>{{f.date(chartRouteServiceDates.startDate, 'dd mmm yyyy', true)}}</b>
            to
            <b>{{f.date(chartRouteServiceDates.endDate, 'dd mmm yyyy', true)}}</b>

            <button class="btn btn-default"
                @click="filter.dates = [chartRouteServiceDates.startDate, chartRouteServiceDates.endDate]">
              Chart entire service period
            </button>

            <div>
              Showing trips from
              <b>{{ f.date(this.query.from, 'dd mmm yyyy') }}</b> to
              <b>{{ f.date(this.query.to, 'dd mmm yyyy') }}</b>
            </div>
          </div>
          <div v-else-if="charts.routeId">
            Loading service data...
          </div>

          <template v-if="charts.trips">
            <ReviewCharts v-if="charts.trips.length > 0" :trips="charts.trips" />
            <span v-else>There was no data found for this period</span>
          </template>
          <img src="/img/spinner.svg" v-else-if="charts.routeId && !charts.trips" />
        </div>
      </template>
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
import SpanSelect from '../components/SpanSelect.vue'
import ReviewCharts from '@/components/review-chart/ReviewCharts.vue'

export default {
  props: ['companyId'],
  data () {
    return {
      charts: {
        routeId: null,
        trips: null
      },
      filter: {
        dates: [],
        selectedMonth: new Date(),
        routeIds: [],
        routes: [] // purely for display purposes
      },
      publicHolidaysPromise: this.fetch('publicHolidays'),
      progressText: null
    }
  },
  components: { ReviewCharts, RouteSelector, SpanSelect },
  computed: {
    ...mapGetters(['axios']),
    ...mapState('shared', ['publicHolidays']),

    f: () => filters,

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
    },

    publicHolidayDates () {
      return this.publicHolidays &&
        this.publicHolidays.map(ph => ({
          date: ph.date,
          classes: ['public-holidya']
        }))
    },

    tripsQuery () {
      if (!this.charts.routeId) return null

      return {
        from: this.query.from,
        to: this.query.to,
        routeId: this.charts.routeId
      }
    }
  },

  asyncComputed: {
    chartRouteServiceDates () {
      if (!this.charts.routeId) return

      return this.axios.get(`/routes/${this.charts.routeId}?includeDates=true`)
        .then(({data}) => {
          return {startDate: new Date(data.dates.firstDate), endDate: new Date(data.dates.lastDate)}
        })
    }
  },

  watch: {
    'tripsQuery' () {
      this.charts.trips = null
      this.downloadChartedRoute()
    },

    'filter.routeIds' (rs) {
      if (rs.length === 0) {
        this.charts.routeId = null
      } else if (!rs.includes(this.charts.routeId)) {
        this.charts.routeId = rs[0]
      }
    }
  },

  created () {
    this.fetch('publicHolidays')
  },

  methods: {
    ...mapActions('spinner', ['spinOnPromise']),
    ...mapActions('modals', ['showModal', 'showErrorModal']),
    ...mapActions('shared', ['fetch']),

    async downloadTimelinessCSV () {
      const { routeIds, from, to } = this.query
      const qs = querystring.stringify({ from, to, format: 'csv' })
      let payloads = []

      const noHeaders = csvText => csvText.substring(csvText.indexOf('\n') + 1)
      try {
        for (let i = 0; i < routeIds.length; ++i) {
          const routeId = routeIds[i]
          this.progressText = `Fetching timeliness statistics for route id ${routeId}... (${i + 1} of ${routeIds.length})`
          const url = `${process.env.TRACKING_URL}/routes/${routeId}/performance?${qs}`
          const response = await this.axios.get(url)
          const payload = payloads.length > 0
            ? noHeaders(response.data + '\n')
            : response.data + '\n'
          payloads.push(payload)
        }
        const blob = new Blob(payloads, { type: 'text/csv' })
        const fileName = `Route Timeliness Performance - ${from} to ${to}.csv`
        this.progressText = `Generating ${fileName}...`
        download(blob, fileName, 'text/csv')
      } finally {
        this.progressText = null
      }
    },
    async downloadEventsCSV () {
      const { routeIds, from, to } = this.query
      let payloads = []

      const noHeaders = csvText => csvText.substring(csvText.indexOf('\n') + 1)
      try {
        for (let i = 0; i < routeIds.length; ++i) {
          const routeId = routeIds[i]
          this.progressText = `Fetching events for route id ${routeId}... (${i + 1} of ${routeIds.length})`
          const startDateTime = (new Date(from)).getTime()
          const endDateTime = (new Date(to)).getTime()

          for (let dateTime = startDateTime; dateTime <= endDateTime; dateTime += 24 * 3600 * 1000) {
            const date = filters.date(new Date(dateTime), 'isoDate')
            const qs = querystring.stringify({ date, format: 'csv' })
            const url = `${process.env.TRACKING_URL}/routes/${routeId}/events?${qs}`
            const response = await this.axios.get(url)
            const payload = payloads.length > 0
              ? noHeaders(response.data + '\n')
              : response.data + '\n'
            payloads.push(payload)
          }
        }
        const blob = new Blob(payloads, { type: 'text/csv' })
        const fileName = `Route Events - ${from} to ${to}.csv`
        this.progressText = `Generating ${fileName}...`
        download(blob, fileName, 'text/csv')
      } finally {
        this.progressText = null
      }
    },

    async downloadChartedRoute () {
      if (this.tripsQuery === null) { return }

      const {routeId, ...rest} = this.tripsQuery

      const promise =
        this.$queryPromise =
        this.axios.get(`${process.env.TRACKING_URL}/routes/${routeId}/performance?` +
          querystring.stringify(rest))
          .then((response) => {
            if (promise !== this.$queryPromise) return // superseded

            const trips = response.data

            trips.forEach(tr => {
              tr.date = new Date(tr.date)
              tr.stops.forEach(ts => {
                ts.date = tr.date
                ts.expectedTime = new Date(ts.expectedTime)
                if (ts.actualTime) {
                  ts.actualTime = new Date(ts.actualTime)
                }
              })
            })

            this.charts.trips = trips
          })
    },

    monthChanged (newMonth) {
      this.filter.selectedMonth = newMonth.clone().toDate()
      this.filter.startDate = this.filter.endDate = null
    }
  }
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
