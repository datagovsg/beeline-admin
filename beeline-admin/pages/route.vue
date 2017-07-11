<template>
  <div>
    <LoadingSpinner />
    <ModalHelper />
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
  props: ['companyId', 'routeId', 'tab'],
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
    ]

    return {
      tabs,
      route: null,
      routePromise: null,
    }
  },
  watch: {
    routeId() {
      this.requery()
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
    RouteDisplay: require('../components/routes/RouteDisplay.vue'),
    RouteDescriptionEditor: require('../components/routes/RouteDescriptionEditor.vue'),
    TripsEditor: require('../components/routes/TripsEditor.vue'),
    CrowdstartEditor: require('../components/routes/CrowdstartEditor.vue'),
  },
  computed: {
    f() { return filters },
    activeTab () {
      return this.tabs.findIndex(tab => tab.link === this.tab)
    }
  },
  created() {
    this.requery()
  },
  methods: {
    ...mapActions('resources', ['getRoute', 'saveRoute', 'createTripForDate']),
    ...mapActions('spinner', ['spinOnPromise']),

    goToTab(tab) {
      return `#/c/${this.companyId}/trips/${this.routeId}/${tab.link}`
    },

    requery () {
      if (!this.routeId) {
        this.routePromise = Promise.resolve(null)
      } else {
        this.routePromise = this.getRoute({
          id: this.routeId,
          options: {
            include_dates: true,
            include_features: true,
            include_trips: true,
            start_date: filters.date(Date.now() - 30 * 24 * 3600 * 1000, 'dd-mmm-yyyy'),
            end_date: filters.date(Date.now() + 180 * 24 * 3600 * 1000, 'dd-mmm-yyyy'),
          }
        })
      }
    }
  }
}
</script>
