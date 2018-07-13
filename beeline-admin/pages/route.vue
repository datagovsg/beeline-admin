<template>
  <div>
    <ol class="breadcrumb">
      <li><a :href="`#/c/${companyId}/routes`">Routes</a></li>
      <li>
        <a :href="`#/c/${companyId}/trips/${routeId}/${action}`" v-if="route">
          {{route.label}} ({{route.id}})
        </a>
      </li>
    </ol>

    <h2 class="sub-header">Route Editor</h2>

    <RouteDisplay :route="route" />

    <ul class="nav nav-tabs">
      <li v-for="(tab, index) in tabs" :class="{
        active: activeTab === index
        }">
        <a :href="goToTab(tab)">
          {{tab.description}}
        </a>
      </li>
    </ul>

    <br/>
    <div v-if="tabs[activeTab]" :is="tabs[activeTab].component"
      :route="route" @requery="requery" :companyId="companyId" />
  </div>
</template>

<script>
import {mapGetters, mapActions, mapState} from 'vuex'
import * as resources from '../stores/resources'
const filters = require('../filters')

export default {
  props: ['companyId', 'routeId', 'action'],
  data() {
    const tabs = [
      {
        description: 'Edit Route Description',
        component: 'RouteDescriptionEditor',
        link: 'route'
      },
      {
        description: 'Edit Trips',
        component: 'TripsEditor',
        link: 'trips'
      },
      {
        description: 'Edit Crowdstart Parameters',
        component: 'CrowdstartEditor',
        link: 'crowdstart'
      },
      {
        description: 'View Bidders',
        component: 'CrowdstartDisplay',
        link: 'bidders'
      },
    ]

    return {
      tabs,
      route: null,
      routePromise: null,
    }
  },
  watch: {
    routeId: {
      immediate: true,
      handler (h) {
       this.spinOnPromise(this.requery())
      }
    },
    routePromise: {
      immediate: true,
      handler (p) {
        if (p) {
          this.spinOnPromise(p)

          p.then((route) => {
            this.route = route
          })
        }
      }
    },
  },
  components: {
    RouteDisplay: require('../components/routes/RouteDisplay.vue').default,
    RouteDescriptionEditor: require('../components/routes/RouteDescriptionEditor.vue').default,
    TripsEditor: require('../components/routes/TripsEditor.vue').default,
    CrowdstartEditor: require('../components/routes/CrowdstartEditor.vue').default,
    CrowdstartDisplay: require('../components/routes/CrowdstartDisplay.vue').default
  },
  computed: {
    f() { return filters },
    activeTab () {
      return this.tabs.findIndex(tab => tab.link === this.action)
    }
  },
  methods: {
    ...mapActions('resources', ['getRoute', 'saveRoute', 'createTripForDate']),
    ...mapActions('spinner', ['spinOnPromise']),

    goToTab(tab) {
      return `#/c/${this.companyId}/trips/${this.routeId}/${tab.link}`
    },

    requery () {
      if (!this.routeId) {
        return this.routePromise = Promise.resolve(null)
      } else {
        return this.routePromise = this.getRoute({
          id: this.routeId,
          options: {
            includeDates: true,
            includeFeatures: true,
            includeTrips: true,
            startDate: filters.date(Date.now() - 30 * 24 * 3600 * 1000, 'dd-mmm-yyyy'),
            endDate: filters.date(Date.now() + 180 * 24 * 3600 * 1000, 'dd-mmm-yyyy'),
          }
        })
      }
    }
  }
}
</script>
