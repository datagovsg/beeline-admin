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
    <div class="row">
      <div class="col-lg-12">
        <div class="pull-left">
          <uib-pagination :boundary-links="true" v-model="filter.page"
            :total-items="allRoutes.length" :items-per-page="filter.perPage" />
        </div>
        <div class="pull-right create-button" ng-if="adminService.isSuperAdmin()">
          <button class="btn btn-primary btn-lg" ui-sref="^.trips({routeId:0, action: 'route'})">
            <span class="glyphicon glyphicon-plus-sign" aria-hidden="true"></span>Create a new route
          </button>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col-lg-12">
        <table class="table table-condensed table-striped table-hover">
          <thead>
            <tr>
              <th></th>
              <th sort-direction='filter.order' sort-model="filter.orderBy" my-sort="id">Route<br />ID</th>
              <th sort-direction='filter.order' sort-model="filter.orderBy" my-sort="label">Route<br />label</th>
              <th sort-direction='filter.order' sort-model="filter.orderBy" my-sort="">Company</th>
              <th sort-direction='filter.order' sort-model="filter.orderBy" my-sort="from">Route<br />Description</th>
              <th sort-direction='filter.order' sort-model="filter.orderBy" my-sort="startDate">Start date</th>
              <th sort-direction='filter.order' sort-model="filter.orderBy" my-sort="endDate">End date</th>
              <!-- <th sort-direction='filter.order' sort-model="filter.orderBy" my-sort="lastStartTime">Start time</th> -->
              <!-- <th sort-direction='filter.order' sort-model="filter.orderBy" my-sort="lastEndTime">End time</th> -->
              <th sort-direction='filter.order' sort-model="filter.orderBy">Status</th>
              <th sort-direction='filter.order' sort-model="filter.orderBy">Boarding</th>
              <th sort-direction='filter.order' sort-model="filter.orderBy">Alighting</th>
              <th sort-direction='filter.order' sort-model="filter.orderBy" my-sort="">Route path</th>
              <th sort-direction='filter.order' sort-model="filter.orderBy" my-sort="lastDriverName">Last driver</th>
              <th sort-direction='filter.order' sort-model="filter.orderBy" my-sort="lastPrice">Price</th>
              <th sort-direction='filter.order' sort-model="filter.orderBy" my-sort="lastCapacity">Capacity</th>
              <th sort-direction='filter.order' sort-model="filter.orderBy" my-sort="">Tags</th>
              <th sort-direction='filter.order' sort-model="filter.orderBy" my-sort="">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(route, index) in routes">
              <td>
                {{ index + 1 }}
              </td>
              <td>{{route.id}}</td>
              <td><span class="route-label">{{route.label}}</span></td>
              <td style="width:6%">{{route.transportCompany.name}}</td>
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
              <td>{route.startDate | date:'dd MMM yyyy'}}<br />{route.startDate | date:'(EEE)'}}</td>
              <td>{route.endDate | date:'dd MMM yyyy'}}<br />{route.endDate | date:'(EEE)'}}</td>
              <!-- <td>{{route.lastStartTime | intervalToTime | date:'HH:mm'}}</td> -->
              <!-- <td>{{route.lastEndTime   | intervalToTime | date:'HH:mm'}}</td> -->
              <td>
                <span class="label route-active"
                    ng-if="route.startDate.getTime() <= now && now <= route.endDate.getTime() + 24*3600*1000">Active</span>
                <span class="label route-notstarted"
                    ng-if="now < route.startDate.getTime()">Not Started</span>
                <span class="label route-ended"
                    ng-if="now > route.endDate.getTime() + 24*3600*1000">Ended</span>
              </td>
              <td style="width:15%">
                <trip-info-broker trip-id="route.indicativeTrip.nextTripId || route.indicativeTrip.lastTripId || route.indicativeTrip.tripId" trip="nextTrip"></trip-info-broker>
                <expandable-area>
                  <table class="borderless" ng-if="nextTrip">
                    <tr ng-repeat="tripStop in nextTrip.tripStops | filter:{canBoard: true}">
                      <td class="text-nowrap">
                        {{tripStop.time | date:'HH:mm'}}
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
                  <table class="borderless" ng-if="nextTrip">
                    <tr ng-repeat="tripStop in nextTrip.tripStops | filter:{canAlight: true}">
                      <td class="text-nowrap">
                        {{tripStop.time | date:'HH:mm'}}
                      </td>
                      <td>
                        {{tripStop.stop.description}}
                      </td>
                    </tr>
                  </table>
                </expandable-area>
              </td>
              <td><button class="btn btn-default" ng-click="viewRoute(route.id)">View</button></td>
              <td>{{route.indicativeTrip.lastDriverName}}</td>
              <td>{{route.indicativeTrip.lastPrice}}</td>
              <td>{{route.indicativeTrip.lastCapacity}}<span class="glyphicon glyphicon-user" aria-hidden="true"></span></td>
              <td>
                <ul class="tags">
                  <li ng-repeat="tag in route.tags track by $index">{{tag}}</li>
                </ul>
              </td>
              <td>
                <div class="btn-group" role="group" aria-label="...">
                  <button type="button" class="btn btn-default" ng-click="copy(route)">
                    <span class="glyphicon glyphicon-duplicate" aria-hidden="true"></span>
                    Copy
                  </button>
                  <button type="button" class="btn btn-default"
                    ui-sref="^.trips({routeId: route.id, action: 'route'})">
                    <span class="glyphicon glyphicon-edit" aria-hidden="true" ui-sref="^.trips({routeId: route.id, action: 'trips'})" ></span>
                    Edit
                  </button>
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
import {mapGetters, mapActions, mapSetters} from 'vuex'

export default {
  data() {
    const tagPresets = [
      { name: 'All', tags: null },
      { name: 'Crowdstart', tags: ['lelong'] },
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
      },
      tagPresets,
    }
  },
  created() {
    this.$store.dispatch('fetchAllRoutes')
  },
  computed {
    ...mapState('shared')
  }
}
</script>
