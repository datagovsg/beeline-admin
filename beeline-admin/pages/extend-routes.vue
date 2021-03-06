<template>
  <div v-if="!companyId">
    Please select a company from the top!
  </div>
  <div v-else>

    <div>
      You can extend routes by up to 2 months from this page.
    </div>

    <div>
      Routes that have ended more than 5 days ago must be extended manually.
    </div>

    <div v-if="routes && (routes.filter(r => r.tripsByDate).length != routes.length)">
      Loading routes...
      <progress :max="routes.length" :value="routes.filter(r => r.tripsByDate).length" />
    </div>

    <div>
      {{ filteredRoutes.filter(r => r.selected && !r.ended).length }} routes being extended

      <button class="btn btn-primary" @click="confirmAndExtend">
        Extend
      </button>
    </div>

    <div v-if="extendJobs.count">
      Extending routes...
      <progress :max="extendJobs.count" :value="extendJobs.done" />
    </div>

    <label>
      Route Label:
    </label>
    <input type="text" v-model="filter.label" @input="updateFilter" />

    <label>
      Comma-separated list of tags:
    </label>
    <input type="text" v-model="filter.tags" @input="updateFilter" />

    <br/>
    <br/>

    <table class="selection-table legend">
      <tbody>
        <tr>
          <td>Routes will be extended using the trip marked: </td>
          <td class="selected-hash">&nbsp;&nbsp;&nbsp;</td>
        </tr>
      </tbody>
    </table>

    <br/>
    <br/>

    <table class="selection-table">
      <thead>
        <tr>
          <th></th>
          <th></th>
          <th v-for="day in days" :key="day.date.getTime()" style="width: 1.5em">
          </th>
        </tr>
        <tr>
          <th></th>
          <th></th>
          <th v-for="month in months" :key="month.date.getTime()" :colspan="month.colspan" class="new-month">
            {{f.monthNames(month.date.getUTCMonth())}}
          </th>
        </tr>
        <tr>
          <th></th>
          <th></th>
          <th v-for="day in days" :key="day.date.getTime()" :class="{
              'today': day.today,
              'public-holiday': day.publicHoliday,
              'new-month': day.newMonthDay
            }">
            {{day.date.getUTCDate()}}
          </th>
        </tr>
        <tr>
          <th></th>
          <th></th>
          <th v-for="day in days" :key="day.date.getTime()" class="date-selector"
                :class="{
                  'selected': day.selected,
                  'public-holiday': day.publicHoliday,
                  'today': day.today,
                  'new-month': day.newMonthDay
                  }"
                @mousedown.prevent="beginPaintDate($event, day)"
                @mousemove.prevent="paintDate($event, day)"
                @mouseup.prevent="endPaintDate($event, day)"
          >
            {{f.weekdayLetter(day.date)}}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="route in sortedRoutes" :class="{active: route.selected}"
            :key="route.id" >
          <td class="route-selector"
                @mousedown.prevent="beginPaintRoute($event, route)"
                @mousemove.prevent="paintRoute($event, route)"
                @mouseup.prevent="endPaintRoute($event, route)"
                >
            {{route.label}}
            <a :href="`#/c/${companyId}/trips/${route.id}/route`"><span class="glyphicon glyphicon-pencil" /></a>
          </td>
          <td><TagsView :tags="route.tags" /></td>
          <td v-for="day in days" :key="day.date.getTime()" :class="dateClass(route, day)"
              title="Click to use this trip as a template"
              @click="useTripHashOf(route, day)">
            <!-- <input type="checkbox" v-model="selectedDays[route.id][day.date.getTime()]" /> -->
          </td>
        </tr>
      </tbody>
    </table>

  </div>
</template>

<script>
import {mapGetters, mapActions, mapState} from 'vuex'
import querystring from 'querystring'
import TagsView from '@/components/TagsView.vue'
import _ from 'lodash'
import * as filters from '@/filters'

/**
  * Uniquely hash trips by their stops, stop time and price.
  * Trips with different hashes are "significantly different"
  * from each other and should be represented by different colours
  */
function tripHash (trip) {
  function secondsSinceMidnight (t) {
    return t.getHours() * 3600 + t.getMinutes() * 60 + t.getSeconds()
  }

  return [
    trip.capacity,
    trip.price,
    _(trip.tripStops)
      .orderBy(['time', 'stopId'])
      .map(ts =>
        `${ts.stopId.toString(36)},${secondsSinceMidnight(ts.time).toString(36)}`
      )
      .join(';')
  ].join(';')
}

export default {
  props: ['companyId'],
  data () {
    return {
      filter: {
        tags: '',
        label: ''
      },
      filteredRoutes: [],
      routes: null,

      tripsByRoute: null,

      now: Date.now(),

      // route painting
      isPainting: false,

      // N.B. The reason we need this to be a reactive object is
      // because we have a `selected` field, and the reason we use a `selected`
      // field is becase when using some `selectedDates : int -> date` object
      // it will force the entire
      // table to re-render
      days: (() => {
        const today = new Date()
        return _.range(0, 65).map(offset => {
          let date = new Date(Date.UTC(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 5 + offset,
          ))
          return {
            date: date,
            today: (offset === 5),
            publicHoliday: false,
            selected: false,
            newMonthDay: offset === 0 || date.getUTCDate() === 1
          }
        })
      })(),

      extendJobs: {
        count: 0,
        done: 0
      }
    }
  },
  components: {
    TagsView
  },
  computed: {
    ...mapGetters('shared', ['companiesById', 'currentRoutesById']),
    ...mapState('shared', ['publicHolidays']),
    ...mapGetters(['axios']),

    f () {
      return {
        ...filters,
        weekdayLetter (date) {
          return 'SMTWTFS'.charAt(date.getUTCDay())
        }
      }
    },

    tags () {
      return this.filter.tags.split(',').filter(x => x.trim())
    },

    sortedRoutes () {
      return _.orderBy(
        this.filteredRoutes,
        ['label'],
        ['asc']
      )
    },

    months () {
      return this.days.reduce((list, day) => {
        if (!list.length || list[list.length - 1].date.getUTCMonth() !== day.date.getUTCMonth()) {
          list.push({
            date: day.date,
            colspan: 1
          })
          return list
        } else {
          list[list.length - 1].colspan++
          return list
        }
      }, [])
    }
  },
  created () {
    this.fetch('publicHolidays')
      .then(() => {
        console.log(this.publicHolidays, this.days)
        const isHoliday = this.publicHolidays
          .reduce((set, holiday) => {
            set[new Date(holiday.date).getTime()] = true
            return set
          }, {})

        this.days.forEach(day => {
          day.publicHoliday = !!isHoliday[day.date.getTime()]
        })
      })
  },
  mounted () {
    this.spinOnPromise(Promise.all(Object.values(this.$store.state.shared.promises)))
  },
  watch: {
    companyId: {
      immediate: true,
      handler (rp) {
        this.requery()
      }
    }
  },
  methods: {
    ...mapActions('modals', ['showModal', 'showErrorModal', 'alert']),
    ...mapActions('spinner', ['spinOnPromise']),
    ...mapActions('resources', ['createTripForDate']),
    ...mapActions('shared', ['invalidate', 'refresh', 'fetch']),

    requery () {
      const promise = this.$promise = this.axios.get('/routes?' + querystring.stringify({
        transportCompanyId: this.companyId || [],
        startDate: this.days[0].date.toISOString()
      }))
        .then(async (routesResponse) => {
          if (promise !== this.$promise) return

          this.routes = routesResponse.data
            .filter(r => !r.tags.includes('crowdstart'))
            .map(r => ({
              ...r,
              selected: false,
              ended: false,
              tripsByDate: null,
              _extensionHashId: 0
            }))

          this.updateFilter() // not using a computed because we want to throttle it

          // A trick to load the routes we're interested in first
          let currentTags = false; let currentLabel = false
          let currentRoutes = this.routes

          const updateCurrentRoutes = () => {
            // Prioritize routes with tags that we want
            currentRoutes = _.sortBy(
              currentRoutes, r => this.applyFilter(r) ? 0 : 1
            )
          }

          while (currentRoutes.length > 0) {
            if (currentTags !== this.filter.tags || currentLabel !== this.filter.label) {
              currentTags = this.filter.tags
              currentLabel = this.filter.label
              updateCurrentRoutes()
            }

            const route = currentRoutes[0]

            await this.loadTripsForRoute(route)
            if (promise !== this.$promise) return

            // Remove the first element
            currentRoutes.shift()
          } /* while (currentRoutes.length > 0) */
        })

      return promise
    },

    loadTripsForRoute (route) {
      return this.axios.get(`/routes/${route.id}?` + querystring.stringify({
        includeTrips: true,
        startDate: new Date(
          this.days[0].date.getUTCFullYear(),
          this.days[0].date.getUTCMonth(),
          this.days[0].date.getUTCDate(),
        ).toISOString(),
        endDate: new Date(
          this.days[this.days.length - 1].date.getUTCFullYear(),
          this.days[this.days.length - 1].date.getUTCMonth(),
          this.days[this.days.length - 1].date.getUTCDate() + 1,
        ).toISOString()
      }))
        .then((response) => {
          const trips = response.data.trips.map(trip => ({
            ...trip,
            date: new Date(trip.date),
            tripStops: trip.tripStops.map(ts => ({
              ...ts,
              time: new Date(ts.time)
            }))
          }))

          trips.forEach(trip => {
            trip.hash = tripHash(trip)
          })

          const tripHashes = _(trips)
            .map(t => t.hash)
            .uniqBy()
            .map((x, i) => [x, i])
            .fromPairs()
            .value()

          trips.forEach(trip => {
            trip.hashId = tripHashes[trip.hash]
            trip.hashIdMod4 = tripHashes[trip.hash] % 4
          })

          route.tripsByDate = _.keyBy(trips, t => t.date.getTime()) || {}
          route.ended = (trips.length === 0)
        })
    },

    updateFilter: _.throttle(function () {
      this.filteredRoutes = this.routes && this.routes
        .filter(route => this.applyFilter(route))
    }, 500, {leading: false, trailing: true}),

    applyFilter (route) {
      return (!this.filter.label || route.label === this.filter.label) &&
        this.tags.every(tag => route.tags && route.tags.indexOf(tag) !== -1)
    },

    dateClass (route, day) {
      const trip = _.get(route.tripsByDate, day.date.getTime())
      const hashCode = _.get(trip, 'hashIdMod4')

      return {
        'has-trip': trip,
        [`trip-hash-${hashCode}`]: true,
        'selected': day.selected,
        'loading': !route.tripsByDate,
        'ended': route.ended,
        'selected-hash': (hashCode !== undefined) && (hashCode === route._extensionHashId)
      }
    },
    useTripHashOf (route, day) {
      const trip = _.get(route.tripsByDate, day.date.getTime())

      if (trip) route._extensionHashId = trip.hashId
    },

    // Route painting
    beginPaintRoute (event, route) {
      this.isPainting = {
        route,
        isMoved: false,
        initial: route.selected
      }

      const mouseUpListener = () => {
        this.isPainting = false
        document.body.removeEventListener('mouseup', mouseUpListener)
      }

      document.body.addEventListener('mouseup', mouseUpListener)
    },
    paintRoute (event, route) {
      if (!(event.buttons & 1)) return

      if (this.isPainting) {
        route.selected = !this.isPainting.initial
      }
    },
    endPaintRoute (event, route) {
      if (this.isPainting && this.isPainting.route === route) {
        route.selected = !this.isPainting.initial
        this.isPainting = false
      }
    },

    // Route painting
    beginPaintDate (event, date) {
      this.isPainting = {
        date,
        isMoved: false,
        initial: date.selected
      }

      const mouseUpListener = () => {
        this.isPainting = false
        document.body.removeEventListener('mouseup', mouseUpListener)
      }

      document.body.addEventListener('mouseup', mouseUpListener)
    },
    paintDate (event, date) {
      if (!(event.buttons & 1)) return

      if (this.isPainting) {
        date.selected = !this.isPainting.initial
      }
    },
    endPaintDate (event, date) {
      if (this.isPainting && this.isPainting.date === date) {
        date.selected = !this.isPainting.initial
        this.isPainting = false
      }
    },

    async confirmAndExtend () {
      const routesToExtend = this.filteredRoutes.filter(r => r.selected && !r.ended).reverse()
      const daysToExtend = this.days.filter(r => r.selected)

      const confirm = await this.showModal({
        component: 'CommonModals',
        props: {
          type: 'confirm',
          message: `Are you sure you want to extend ${routesToExtend.length} ` +
            `routes by ${daysToExtend.length} days?`
        }
      })

      if (!confirm) return

      this.extendJobs.count = routesToExtend.length
      this.extendJobs.done = 0

      for (let route of routesToExtend) {
        const lastTrip = _(route.tripsByDate)
          .values()
          .filter(trip => trip.hashId === route._extensionHashId)
          .maxBy('date')

        try {
          // Do it batches of 5
          for (let days of _.chunk(
            daysToExtend.filter(day => !route.tripsByDate[day.date.getTime()]),
            5
          )) {
            await Promise.all(days.map(day =>
              this.createTripForDate({
                date: day.date,
                trip: {
                  ...lastTrip,
                  status: null /* Ensure that all new trips are always valid, bookable */
                }
              })))
          }
        } catch (error) {
          this.alert({
            title: `Trip creation failed for ${route.label}`,
            message: _.get(error, 'message', _.get(error, 'data.message'))
          })
          return
        } finally {
          this.loadTripsForRoute(route)
        }
        this.extendJobs.done++
      }

      await this.alert({
        title: `${routesToExtend.length} routes successfully extended!`
      })

      for (let day of this.days) {
        day.selected = false
      }
      for (let route of this.filteredRoutes) {
        route.selected = false
      }
    }
  }
}

</script>

<style lang="scss">
.selection-table {
  thead th {
    text-align: center;
    user-select: none;

    &.date-selector {
      cursor: pointer;
      &:hover {
        background-color: #999;
      }
      &.selected {
        background-color: #F90;
      }
    }
    &.public-holiday {
      color: red;
    }
    &.today {
      color: #00F;
    }
    &.new-month {
      border-left: solid 2px #000;
    }
  }

  tr td.loading {
    &, &:hover {
      background-color: #DDD;
    }
  }

  tr.ended td {
    text-decoration: line-through;
  }

  td.has-trip.selected, td.has-trip:not(.selected) {
    tr.active &, tr.active:hover &, &, &:hover {
      &.trip-hash-0 {
        background-color: #FFF8C8;
        cursor: pointer;
      }
      &.trip-hash-1 {
        background-color: #95CCC7;
        cursor: pointer;
      }
      &.trip-hash-2 {
        background-color: #F1D38D;
        cursor: pointer;
      }
      &.trip-hash-3 {
        background-color: #C6D0AE;
        cursor: pointer;
      }
    }
  }

  td.selected-hash {
    border: solid 3px #CF5B6F;
  }

  tr.active td {
    background-color: #9CF;

    &.has-trip {
      background-color: #008;
    }
    &.selected {
      background-color: #F90;
    }
  }
  tr:not(.active):hover td {
    background-color: 0.8 * #FFF + 0.2 * #000;
  }
  tr.active:hover td {
    background-color: 0.8 * #9CF + 0.2 * #000;
    &.selected:not(.has-trip) {
      background-color: 0.8 * #F90 + 0.2 * #000;
    }
  }
}
.route-selector {
  cursor: pointer;
  user-select: none;
}
</style>
