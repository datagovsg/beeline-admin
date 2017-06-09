<template>
  <div>
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
          <input class="form-control" placeholder="e.g. 123, C10, Bedok" v-model="filter.searchTerms"/>
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
        <div class="pull-right create-button" ng-if="adminService.isSuperAdmin()">
          <button class="btn btn-primary btn-lg" ui-sref="^.trips({routeId:0, action: 'route'})">
            <span class="glyphicon glyphicon-plus-sign" aria-hidden="true"></span>Create a new route
          </button>
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
                    <td>
                      From
                    </td>
                    <td>
                      {{route.from}}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      To
                    </td>
                    <td>
                      {{route.to}}
                    </td>
                  </tr>
                </table>
              </td>
              <td>
                {{ route.firstTrip && f.date(route.firstTrip.date, 'dd\u00a0mmm\u00a0yyyy', true) }}
                <br />
                {{ route.firstTrip && f.date(route.firstTrip.date, 'ddd', true) }}
              </td>
              <td>{route.endDate | date:'dd mmm yyyy'}}<br />{route.endDate | date:'(EEE)'}}</td>
              <td>
                <span class="label route-active"
                    ng-if="route.startDate.getTime() <= now && now <= route.endDate.getTime() + 24*3600*1000">Active</span>
                <span class="label route-notstarted"
                    ng-if="now < route.startDate.getTime()">Not Started</span>
                <span class="label route-ended"
                    ng-if="now > route.endDate.getTime() + 24*3600*1000">Ended</span>
              </td>
              <td style="width:15%">
                <expandable-area>
                  <table class="borderless" ng-if="route.indicativeTrip">
                    <tr v-for="tripStop in route.indicativeTrip.tripStops"
                        v-if="tripStop.canBoard">
                      <td class="text-nowrap">
                        {{f.date(tripStop.time, 'HH:mm')}}
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
                  <table class="borderless" ng-if="route.indicativeTrip">
                    <tr v-for="tripStop in route.indicativeTrip.tripStops"
                        v-if="tripStop.canAlight">
                      <td class="text-nowrap">
                        {{f.date(tripStop.time, 'HH:mm')}}
                      </td>
                      <td>
                        {{tripStop.stop.description}}
                      </td>
                    </tr>
                  </table>
                </expandable-area>
              </td>
              <td><button class="btn btn-default" @click="viewRoute(route.id)">View</button></td>
              <td>{route.indicativeTrip.lastDriverName}}</td>
              <td>{{route.indicativeTrip && route.indicativeTrip.price}}</td>
              <td>{{route.indicativeTrip && route.indicativeTrip.capacity}}<span class="glyphicon glyphicon-user" aria-hidden="true"></span></td>
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
    }
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
  computed: {
    ...mapState('shared', ['allRoutes', 'companies']),
    ...mapGetters('shared', ['companiesById', 'currentRoutesById']),
    f() { return filters },

    routes() {
      const routes = this.allRoutes &&
        this.allRoutes
          .filter(r => !this.companyId || r.transportCompanyId === this.companyId)
          .filter(r => !this.filter.preset.tag || r.tags.indexOf(this.filter.preset.tag) !== -1)
          .filter(r => !this.filter.searchTerms ||
              r.label.toLowerCase().startsWith(this.filter.searchTerms.toLowerCase()) ||
              r.name.toLowerCase().indexOf(this.filter.searchTerms.toLowerCase()) !== -1 ||
              r.id.toString() == this.filter.searchTerms)
          .map(route => ({
            ...route,
            firstTrip: _.get(route, 'trips.0'),
            lastTrip: null, // No way of getting it yet
            indicativeTrip: _.get(this.currentRoutesById, `${route.id}.trips[0]`) || route.trips[0],
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
    viewRoute() {
      // UNIMPLEMENTED
    },
    copyRoute() {
      // UNIMPLEMENTED
    }
  }
}
</script>
