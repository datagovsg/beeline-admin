<template>
  <div>
    <ModalHelper ref="modalHelper"/>
    <LoadingSpinner ref="loadingSpinner"/>
    <h1>Routes</h1>
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
          <UibPagination :boundary-links="true" v-model="filter.page"
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
              <SortTh @sort="filter.order=$event.order, filter.orderBy=$event.orderBy" :order="filter.order" :order-by="filter.orderBy" field="id">Route<br />ID</SortTh>
              <SortTh @sort="filter.order=$event.order, filter.orderBy=$event.orderBy" :order="filter.order" :order-by="filter.orderBy" field="label">Route<br />label</SortTh>
              <SortTh @sort="filter.order=$event.order, filter.orderBy=$event.orderBy" :order="filter.order" :order-by="filter.orderBy">Company</SortTh>
              <SortTh @sort="filter.order=$event.order, filter.orderBy=$event.orderBy" :order="filter.order" :order-by="filter.orderBy" field="from">Route<br />Description</SortTh>
              <SortTh @sort="filter.order=$event.order, filter.orderBy=$event.orderBy" :order="filter.order" :order-by="filter.orderBy" field="firstTrip.date">Start date</SortTh>
              <SortTh @sort="filter.order=$event.order, filter.orderBy=$event.orderBy" :order="filter.order" :order-by="filter.orderBy" field="endDate">End date</SortTh>
              <SortTh>Status</SortTh>
              <SortTh>Boarding</SortTh>
              <SortTh>Alighting</SortTh>
              <SortTh>Route path</SortTh>
              <SortTh @sort="filter.order=$event.order, filter.orderBy=$event.orderBy" :order="filter.order" :order-by="filter.orderBy" field="lastPrice">Price</SortTh>
              <SortTh @sort="filter.order=$event.order, filter.orderBy=$event.orderBy" :order="filter.order" :order-by="filter.orderBy" field="lastCapacity">Capacity</SortTh>
              <SortTh>Tags</SortTh>
              <SortTh>Actions</SortTh>
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
                <ExpandableArea>
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
                </ExpandableArea>
              </td>
              <td style="width:15%">
                <ExpandableArea>
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
                </ExpandableArea>
              </td>
              <td><button class="btn btn-default" @click="viewRoute(route)">View</button></td>
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
import _ from 'lodash'
import {mapGetters, mapActions, mapState} from 'vuex'
import * as resources from '../stores/resources'
const filters = require('../filters')

import CreateTripsDatePicker from '@/modals/CreateTripsDatePicker.vue'
import ExpandableArea from '@/components/ExpandableArea.vue'
import SortTh from '@/components/SortTh.vue'
import TagsView from '@/components/TagsView.vue'
import UibPagination from '@/components/UibPagination.vue'

export default {
  props: ['companyId'],
  data() {
    const tagPresets = [
      { name: 'All', tags: null },
      { name: 'Crowdstart', tags: ['crowdstart'] },
      { name: 'Lite', tags: ['lite'] },
      { name: 'Regular', tags: ['public'] },
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
    CreateTripsDatePicker,
    ExpandableArea,
    SortTh,
    TagsView,
    UibPagination,
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
    this.spinOnPromise(Promise.all(Object.values(this.$store.state.shared.promises)))
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
          .filter(r => !this.filter.preset.tags || _.intersection(r.tags, this.filter.preset.tags).length > 0)
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
    ...mapActions('spinner', ['spinOnPromise']),

    viewRoute(route) {
      this.showModal({
        component:'ViewRouteTrips',
        props: {route}
      })
    },
    async copyRoute(r) {
      const routePromise = this.getRoute({
        id: r.id,
        options: {
          includeTrips: true,
          includeDates: true,
          includeFeatures: true,
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

      const route = await this.spinOnPromise(routePromise)

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

        await this.spinOnPromise(Promise.all(tripPromises));

        await this.spinOnPromise(
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
