<template>
  <div>
    <ModalHelper ref="modalHelper"/>
    <LoadingSpinner ref="loadingSpinner"/>
    <div class="row">
      <div class="col-lg-12">
        <div class="pull-left">
          <p class="text-info">
            Trips stops, time, price and capacity is based on next available trip for each route.<br />Last driver indicates the last driver that pinged this route.
          </p>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col-lg-12 btn-group">
        <div class="form-inline">
          <label>Search for Route</label>
          <input class="form-control" placeholder="e.g. 123, C10, Bedok" v-model="filter.searchTerms"
            @input="filter.page = 0"/>
        </div>

        <button class="btn" v-for="tagPreset in tagPresets"
          :class="{
            'btn-primary': tagPreset == filter.preset,
            'btn-default': tagPreset != filter.preset
          }"
          @click="filter.preset = tagPreset">
          {{tagPreset.name}}
        </button>
      </div>
    </div>
    <div class="row" v-if="routes">
      <div class="col-lg-12">
        <div class="pull-left">
          <uib-pagination :boundary-links="true" v-model="filter.page"
            :total-items="routes.length" :items-per-page="filter.perPage" />
        </div>
        <div class="pull-right create-button">
          <a class="btn btn-primary btn-lg" :href="`#/c/${companyId}/trips/0/route`">
            <span class="glyphicon glyphicon-plus-sign" aria-hidden="true"></span>Create a new route
          </a>
        </div>
      </div>
    </div>
    <div class="row" v-if="routes">
      <div class="col-lg-12">
        <table class="table table-condensed table-striped table-hover">
          <thead>
            <tr>
              <th></th>
              <sort-th @sort="filter.order=$event.order, filter.orderBy=$event.orderBy" :order="filter.order" :order-by="filter.orderBy" field="id">Route<br />ID</sort-th>
              <sort-th @sort="filter.order=$event.order, filter.orderBy=$event.orderBy" :order="filter.order" :order-by="filter.orderBy" field="label">Route<br />label</sort-th>
              <sort-th @sort="filter.order=$event.order, filter.orderBy=$event.orderBy" :order="filter.order" :order-by="filter.orderBy">Company</sort-th>
              <sort-th @sort="filter.order=$event.order, filter.orderBy=$event.orderBy" :order="filter.order" :order-by="filter.orderBy" field="from">Route<br />Description</sort-th>
              <sort-th @sort="filter.order=$event.order, filter.orderBy=$event.orderBy" :order="filter.order" :order-by="filter.orderBy" field="firstTrip.date">Start date</sort-th>
              <sort-th @sort="filter.order=$event.order, filter.orderBy=$event.orderBy" :order="filter.order" :order-by="filter.orderBy" field="endDate">End date</sort-th>
              <sort-th>Status</sort-th>
              <sort-th>Boarding</sort-th>
              <sort-th>Alighting</sort-th>
              <sort-th>Route path</sort-th>
              <sort-th @sort="filter.order=$event.order, filter.orderBy=$event.orderBy" :order="filter.order" :order-by="filter.orderBy" field="lastDriverName">Last driver</sort-th>
              <sort-th @sort="filter.order=$event.order, filter.orderBy=$event.orderBy" :order="filter.order" :order-by="filter.orderBy" field="lastPrice">Price</sort-th>
              <sort-th @sort="filter.order=$event.order, filter.orderBy=$event.orderBy" :order="filter.order" :order-by="filter.orderBy" field="lastCapacity">Capacity</sort-th>
              <sort-th>Tags</sort-th>
              <sort-th>Actions</sort-th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(route, index) in sortedRoutes">
              <td>
                {{ filter.page * filter.perPage + index + 1 }}
              </td>
              <td>{{route.id}}</td>
              <td><span class="route-label">{{route.label}}</span></td>
              <td style="width:6%">
                {{ companiesById[route.transportCompanyId]
                  && companiesById[route.transportCompanyId].name}}
              </td>
              <td style="width:12%">
                <table class="borderless">
                  <tr>
                    <td>From</td>
                    <td>{{route.from}}</td>
                  </tr>
                  <tr>
                    <td>To</td>
                    <td>{{route.to}}</td>
                  </tr>
                </table>
              </td>
              <td>
                {{ route.firstTrip && f.date(route.firstTrip.date, 'dd\u00a0mmm\u00a0yyyy', true) }}
                <br />
                {{ route.firstTrip && f.date(route.firstTrip.date, 'ddd', true) }}
              </td>
              <td>
                {{ route.dates.lastDate && f.date(route.dates.lastDate, 'dd\u00a0mmm\u00a0yyyy', true) }}
                <br />
                {{ route.dates.lastDate && f.date(route.dates.lastDate, 'ddd', true) }}
              </td>
              <td>
                <template v-if="route.trips[0]">
                  <span class="label route-active"
                      v-if="route.trips[0].tripStops[0].time.getTime() <= now && route.nextTrip">Active</span>
                  <span class="label route-notstarted"
                      v-if="now < route.trips[0].tripStops[0].time.getTime()">Not Started</span>
                  <span class="label route-ended"
                      v-if="!route.nextTrip">Ended</span>
                </template>
              </td>
              <td style="width:15%">
                <expandable-area>
                  <table class="borderless" v-if="route.recentTrip">
                    <tr v-for="tripStop in route.recentTrip.tripStops"
                        v-if="tripStop.canBoard">
                      <td class="text-nowrap">
                        {{f.date(tripStop.time, 'HH:MM')}}
                      </td>
                      <td>
                        {{tripStop.stop.description}}
                      </td>
                    </tr>
                  </table>
                </expandable-area>
              </td>
              <td style="width:15%">
                <expandable-area>
                  <table class="borderless" v-if="route.recentTrip">
                    <tr v-for="tripStop in route.recentTrip.tripStops"
                        v-if="tripStop.canAlight">
                      <td class="text-nowrap">
                        {{f.date(tripStop.time, 'HH:MM')}}
                      </td>
                      <td>
                        {{tripStop.stop.description}}
                      </td>
                    </tr>
                  </table>
                </expandable-area>
              </td>
              <td><button class="btn btn-default" @click="viewRoute(route)">View</button></td>
              <td>{{route.indicativeTrip && route.indicativeTrip.lastDriverName}}</td>
              <td>{{route.indicativeTrip && route.indicativeTrip.lastPrice}}</td>
              <td>{{route.indicativeTrip && route.indicativeTrip.lastCapacity}}<span class="glyphicon glyphicon-user" aria-hidden="true"></span></td>
              <td><TagsView :tags="route.tags" /></td>
              <td>
                <div class="btn-group" role="group" aria-label="...">
                  <button type="button" class="btn btn-default" @click="copyRoute(route)">
                    <span class="glyphicon glyphicon-duplicate" aria-hidden="true"></span>
                    Copy
                  </button>
                  <a :href="`#/c/${companyId}/trips/${route.id}/trips`" class="btn btn-default">
                    <span class="glyphicon glyphicon-edit" aria-hidden="true"></span>
                    Edit
                  </a>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import {mapGetters, mapActions, mapState} from 'vuex'
import * as resources from '../stores/resources'
const filters = require('../filters')

export default {
  props: ['companyId'],
  data() {
    const tagPresets = [
      { name: 'All', tag: null },
      { name: 'Crowdstart', tag: 'lelong' },
      { name: 'Lite', tag: 'lite' },
      { name: 'Regular', tag: 'public' },
    ]

    return {
      filter: {
        perPage: 30,
        page: 0,
      	orderBy: 'label',
      	order: 'asc',
        preset: tagPresets[0],
        searchTerms: '',
      },
      tagPresets,
      now: Date.now(),
    }
  },
  components: {
    CreateTripsDatePicker: require('../modals/CreateTripsDatePicker.vue')
  },
  methods: {
    getStartDate(r) {
      return this.f._.get(r, 'firstTrip.date')
    }
  },
  created() {
    this.$store.dispatch('shared/fetch', 'currentRoutes')
    this.$store.dispatch('shared/fetch', 'allRoutes')
    this.$store.dispatch('shared/fetch', 'companies')
  },
  mounted() {
    this.$refs.loadingSpinner.watch(Promise.all(Object.values(this.$store.state.shared.promises)))
  },
  computed: {
    ...mapState('shared', ['allRoutes', 'companies']),
    ...mapGetters('shared', ['companiesById', 'currentRoutesById']),
    ...mapGetters(['axios']),

    f() { return filters },

    routes() {
      const routes = this.allRoutes &&
        this.allRoutes
          .filter(r => !this.companyId || r.transportCompanyId === this.companyId)
          .filter(r => !this.filter.preset.tag || r.tags.indexOf(this.filter.preset.tag) !== -1)
          .filter(r => !this.filter.searchTerms ||
              (r.label && r.label.toLowerCase().startsWith(this.filter.searchTerms.toLowerCase())) ||
              (r.name && r.name.toLowerCase().indexOf(this.filter.searchTerms.toLowerCase()) !== -1) ||
              r.id.toString() == this.filter.searchTerms)
          .map(route => ({
            ...route,
            firstTrip: _.get(route, 'trips.0'),
            lastTrip: null, // No way of getting it yet
            nextTrip: _.get(this.currentRoutesById, `${route.id}.trips[0]`),
            recentTrip: _.get(this.currentRoutesById, `${route.id}.trips[0]`) || _.get(route, 'trips.0')
          }))
      return routes
    },
    sortedRoutes() {
      return this.routes && _.orderBy(this.routes, [this.filter.orderBy], [this.filter.order])
        .slice(
          this.filter.page * this.filter.perPage,
          (this.filter.page + 1) * this.filter.perPage
        )
    }
  },
  methods: {
    ...mapActions('modals', ['showModal']),
    ...mapActions('resources', ['getRoute', 'saveRoute', 'createTripForDate']),
    ...mapActions('shared', ['invalidate', 'refresh']),

    viewRoute(route) {
      this.showModal({
        component: require('../modals/ViewRouteTrips.vue'),
        props: {route}
      })
    },
    async copyRoute(r) {
      const routePromise = this.getRoute({
        id: r.id,
        options: {
          include_trips: true,
          include_dates: true,
          include_features: true,
        }
      })

      const label = await this.showModal({
        component: 'CommonModals',
        props: {
          type: 'prompt',
          title: 'Copy Route',
          message: 'New Route Label',
          defaultValue: `Copy of ${r.label}`,
        }
      })

      if (!label) return

      const route = await this.$refs.loadingSpinner.spinOnPromise(routePromise)

      const newRoute = {
        ..._.omit(route, ['id']),
        label
      }

      // Prompt for the dates
      let tripDates
      try {
        tripDates = await this.showModal({
          component: 'CreateTripsDatePicker',
          props: {
            route,
            selectOnTrips: true,
          }
        })
      } catch (err) {
        console.log(err)
        return
      }

      try {
        const createResponse = await this.saveRoute({
            ...newRoute,
            // WORKAROUND FOR OLDER ROUTES
            companyTags: newRoute.companyTags || [],
            tags: newRoute.tags || [],
        })

        const tripPromises = tripDates.map((tripDate) => {
          const trip = route.trips.find(t => t.date.getTime() === tripDate.getTime())

          const tripData = {
            ...trip,
            id: null,
            routeId: createResponse.data.id,
            tripStops: trip.tripStops.map(ts => ({
              ...ts,
              id: null
            }))
          }
          return this.createTripForDate({
            date: tripDate,
            trip: tripData,
          })
        })

        await this.$refs.loadingSpinner.watch(Promise.all(tripPromises));

        await this.$refs.loadingSpinner.watch(
          this.refresh(['allRoutes', 'currentRoutes'])
        )
      } catch (err) {
        await this.showModal({
          component: 'CommonModals',
          props: {
            title: 'Error',
            message: err.message,
          }
        })
      }
    }
  }
}
</script>
