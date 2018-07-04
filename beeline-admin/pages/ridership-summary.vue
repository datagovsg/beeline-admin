<template>
<div>
  <div class="summary-page" v-if="!companyId">
    Please select a company from the top right-hand corner
  </div>
  <div class="summary-page" v-else>
    <LoadingSpinner ref="loadingSpinner"/>
    <ModalHelper ref="modalHelper"/>

    <div class="row">
      <div class="col-lg-4">
        <h1>Booking Summary</h1>
        <nav>
          <div class="pull-left">
            <MonthPicker :value="selectedMonth" @input="selectedMonth = $event"
              :offset="0" />
          </div>
        </nav>
      </div>
      <div class="col-lg-6 route-summaries">
        <h3>Trip Legend</h3>
          <table class="summaryLegend">
            <tr>
              <td>Trips</td>
              <td>Normal</td>
              <td>No Trips</td>
              <td><abbr title="Cancelled due to Emergency">Cancelled</abbr></td>
              <td><abbr title="Void due to wrong trips created">Void</abbr></td>
              <td>Today</td>
            </tr>
            <tr>
              <td>
                <table class="routeSummary">
                  <tr>
                    <th>Date</th>
                  </tr>
                  <tr>
                    <th>Day</th>
                  </tr>
                  <tr>
                    <td class="passenger-count day has-trip">
                      <small>Pax</small>
                    </td>
                  </tr>
                </table>
              </td>
              <td>
                <table class="routeSummary">
                  <tr>
                    <th class="summary-day day has-trip">
                      1
                    </th>
                  </tr>
                  <tr>
                    <th class="weekday day has-trip">
                      Mon
                    </th>
                  </tr>
                  <tr>
                    <td class="passenger-count day has-trip">
                      0
                    </td>
                  </tr>
                </table>
              </td>
              <td>
                <table class="routeSummary">
                  <tr>
                    <th class="summary-day day">
                      2
                    </th>
                  </tr>
                  <tr>
                    <th class="weekday day">
                      Tues
                    </th>
                  </tr>
                  <tr>
                    <td class="passenger-count day">

                    </td>
                  </tr>
                </table>
              </td>
              <td>
                <table class="routeSummary">
                  <tr>
                    <th class="summary-day day has-trip cancelled">
                      3
                    </th>
                  </tr>
                  <tr>
                    <th class="weekday day has-trip cancelled">
                      Wed
                    </th>
                  </tr>
                  <tr>
                    <td class="passenger-count day has-trip cancelled">
                      0
                    </td>
                  </tr>
                </table>
              </td>
              <td>
                <table class="routeSummary">
                  <tr>
                    <th class="summary-day day has-trip void">
                      4
                    </th>
                  </tr>
                  <tr>
                    <th class="weekday day has-trip void">
                      Thurs
                    </th>
                  </tr>
                  <tr>
                    <td class="passenger-count day has-trip void">
                      0
                    </td>
                  </tr>
                </table>
              </td>
              <td>
                <table class="routeSummary">
                  <tr>
                    <th class="summary-day day has-trip today">
                      5
                    </th>
                  </tr>
                  <tr>
                    <th class="weekday day has-trip today">
                      Fri
                    </th>
                  </tr>
                  <tr>
                    <td class="passenger-count day has-trip today">
                      0
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
      </div>
      <div class="col-lg-2">
        <h3>Company</h3>
        <div class="pull-left">
          <CompanyLogo v-if="companyId"
            :companyId="companyId" class="company-logo" />
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col-lg-12">
        <h2 class="nodata" v-if="!routes">
          Loading...
        </h2>

        <h2 class="nodata" v-else-if="routes.length == 0">
          No seat data found for the selected month
        </h2>

        <div v-else-if="routes.length > 0" class="route-summaries">
          <RouteRidershipRummary v-for="(route, index) in routes"
            :key="route.id"
            :index="index"
            :route="route"
            />
        </div>
      </div>
    </div>
  </div>
</div>
</template>


<script>
import querystring from 'querystring'
import {mapGetters, mapActions} from 'vuex'

import CompanyLogo from '@/components/CompanyLogo.vue'
import MonthPicker from '@/components/MonthPicker.vue'
import RouteRidershipRummary from '@/components/ridershipSummary/RouteRidershipSummary.vue'
import filters from '@/filters'

export default {
  props: ['companyId'],

  components: {
    CompanyLogo,
    RouteRidershipRummary,
    MonthPicker,
  },

  data () {
    return {
      routes: null,
      selectedMonth: new Date(),
    }
  },

  computed: {
    ...mapGetters(['axios']),
    f: () => filters,
    selectedTime () { return this.selectedMonth.getTime() },
  },

  mounted () {
    this.requery()
  },

  watch: {
    selectedTime () {
      this.requery()
    }
  },

  methods: {
    ...mapActions('spinner', ['spinOnPromise']),
    ...mapActions('modals', ['showModal', 'showErrorModal']),

    requery () {
      if (!this.companyId) return

      var options = {
        includeTrips: true, /* for the /routes endpoint, this only returns up to 5 trips */
        startDate: Date.UTC(
          this.selectedMonth.getFullYear(),
          this.selectedMonth.getMonth(),
          1
        ),
        endDate: Date.UTC(
          this.selectedMonth.getFullYear(),
          this.selectedMonth.getMonth() + 1,
          1
        ),
        transportCompanyId: this.companyId,
      }

      // preprocess the routes to track all days...
      var numDays = (options.endDate - options.startDate)
          / (24 * 3600 * 1000)

      this.weekDays = _.range(0, numDays).map(day =>
        new Date(this.selectedMonth.getFullYear(),
                this.selectedMonth.getMonth(),
                day + 1).getDay());
      this.today = Math.floor((Date.now() - options.startDate) / (24*60*60*1000))

      // We are also interested in the start/end dates. Hence we need to query
      // the report
      let reportPromise = this.axios.get('/routes/report?' + querystring.stringify(
        {
          ..._.pick(options, 'startDate', 'endDate'),
          perPage: 100, page: 1, // FIXME: doesn't fetch all routes!!
          transportCompanyId: this.companyId,
        }))

      let routesPromise = this.axios.get(`/routes?` + querystring.stringify(options))
        .then((response) => // only show public and wrs routes
          response.data.filter((r) => _.intersection(["public","mandai"], r.tags).length > 0))
        .then((routes) => {
          // Vue -- initialize the following properties so they become reactive
          routes.forEach((r) => {
            r.tripsByDay = null
            r.startDate = null
            r.endDate = null
          })
          return routes
        })

      /**
       * if there are 30 days in a month, return a 30-element array,
       * with a trip at each position if there's a trip on that day
       */
      function makeTripsByDay(trips) {
        const tripsByDay = new Array(numDays)

        for (let trip of trips) {
          const day = Math.floor((trip.date - options.startDate) / (24 * 3600e3))

          const currentEntry = tripsByDay[day]

          // let non-cancelled trips override
          // cancelled trips
          tripsByDay[day] = (!currentEntry)
            ? trip : (currentEntry.isRunning && !trip.isRunning)
            ? currentEntry : (trip.isRunning && !currentEntry.isRunning)
            ? trip : trip

        }
        return tripsByDay
      }

      /**
       * Given the trips in a month, return a sequence of:
       * [
       * { price: A1, capacity: B1, count: C1 },
       * { price: A2, capacity: B2, count: C2 },
       * ...
       * ]
       *
       * This means that for the first C1 days of the month, the
       * price is A1 and the capacity is B1.
       * The next C2 days of the month, the price is A2, and the capacity is B2.
       * And so on...
       */
      function makePriceSummary(tripsByDay) {
        return _.reduce(
            tripsByDay,
            (acc, value, index, coll) => {
              if (acc.length == 0 ||
                  (value !== undefined &&
                    ( acc[acc.length - 1].price !== value.price ||
                      acc[acc.length - 1].capacity !== value.capacity))) {

                acc.push({
                  price: value.price,
                  capacity: value.capacity,
                  count: 1
                })
              }
              else {
                acc[acc.length - 1].count++;
              }
              return acc;
            },
            [{price: undefined, capacity: undefined, count: 0}])
            .filter(s => s.count)
      }

      let augmentedRoutesPromise = Promise.all([
        routesPromise,
        reportPromise
      ]).then(([routes, report]) => {
        let routeDataById = _.keyBy(report.data.rows, 'id');
          console.log(routes)

        for (let route of routes) {
          console.log(route)
          if (routeDataById[route.id]) {
            route.startDate = routeDataById[route.id].startDate;
            route.endDate = routeDataById[route.id].endDate;
          }
        }
      })

      this.$latestPromise = routesPromise

      routesPromise.then((routes) => {
        // Deduplicate if user keep changing dates
        if (routesPromise !== this.$latestPromise) {
          return
        }

        routes.forEach(r => {
          this.axios.get(`/routes/${r.id}?` + querystring.stringify({...options, includeTrips: true}))
          .then(response => {
            const trips = response.data.trips

            // Date-ify the trip dates
            for (let trip of trips) {
              trip.date = new Date(trip.date)
            }

            r.tripsByDay = makeTripsByDay(trips)
            r.priceSummary = makePriceSummary(r.tripsByDay)
          })
        })

        this.routes = routes
      })
    }
  }
}
</script>
